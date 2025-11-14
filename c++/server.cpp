// websocket_server.cpp
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/json.hpp>
#include <boost/beast/core/detail/base64.hpp>

#include <iostream>
#include <string>
#include <thread>
#include <fstream>

#include "cxxopts.hpp"

#include "model.hpp"

#include "stb_image.h"

#include "util.hpp"

#include "timer.hpp"

namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace websocket = beast::websocket; // from <boost/beast/websocket.hpp>
namespace net = boost::asio;            // from <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>

void sendImageData(websocket::stream<tcp::socket> &ws, RenderResult result, std::string target)
{
    boost::json::object meta;
    meta["command"] = "image";
    meta["width"] = result.width;
    meta["height"] = result.height;
    meta["target"] = target;

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();
    size_t image_len = result.width * result.height * 4;

    // Build buffer
    size_t size = 4 + json_len + image_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    // Copy image data
    std::memcpy(data + 4 + json_len, result.image, image_len);

    // Send as one binary message
    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void sendModelLoaded(websocket::stream<tcp::socket> &ws)
{
    boost::json::object meta;
    meta["command"] = "modelLoaded";

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();

    size_t size = 4 + json_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void sendParameterFeedback(websocket::stream<tcp::socket> &ws, boost::json::object feedback)
{
    if (feedback.empty())
    {
        return;
    }
    boost::json::object meta;
    meta["command"] = "feedback";
    meta["feedback"] = feedback;

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();

    size_t size = 4 + json_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void sendPlotData(websocket::stream<tcp::socket> &ws, boost::json::object plot_data)
{
    boost::json::object meta;
    meta["command"] = "plot";
    meta["data"] = plot_data;

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();

    size_t size = 4 + json_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void sendFinished(websocket::stream<tcp::socket> &ws)
{
    boost::json::object meta;
    meta["command"] = "finished";

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();

    size_t size = 4 + json_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void sendError(websocket::stream<tcp::socket> &ws, std::string error)
{
    boost::json::object meta;
    meta["command"] = "error";
    meta["text"] = error;

    std::string meta_str = boost::json::serialize(meta);
    uint32_t json_len = meta_str.size();

    size_t size = 4 + json_len;
    unsigned char *data = new unsigned char[size];

    // Copy 4-byte JSON length
    std::memcpy(data, &json_len, 4);

    // Copy JSON
    std::memcpy(data + 4, meta_str.data(), json_len);

    ws.binary(true);
    ws.write(boost::asio::buffer(data, size));

    delete[] data;
}

void doSession(tcp::socket socket)
{
    std::cout << "Starting session for address: " << socket.remote_endpoint().address().to_string() << " on port: " << socket.local_endpoint().port() << "\n";

    GLFWwindow *w = initGLFWContext();

    Model *model = nullptr;

    websocket::stream<tcp::socket> ws{std::move(socket)};
    ws.read_message_max(0);

    try
    {
        ws.accept();

        beast::flat_buffer buffer;

        while (true)
        {
            ws.read(buffer);
            Timer *pt = new Timer("Packet");
            std::string message = beast::buffers_to_string(buffer.data());
            buffer.consume(buffer.size());

            boost::json::value json_value = boost::json::parse(message);
            boost::json::object json_object = json_value.as_object();

            if (json_object["command"].as_string() == "loadProject")
            {
                std::cout << "Loading a new project\n";
                if (model != nullptr)
                {
                    delete model;
                    model = nullptr;
                }

                auto const b64_size_mask = boost::beast::detail::base64::decoded_size(json_object["mask"].as_string().size());
                auto const b64_size_unrolling = boost::beast::detail::base64::decoded_size(json_object["unrolling"].as_string().size());

                unsigned char *img_mask_raw = new unsigned char[b64_size_mask];
                unsigned char *img_unrolling_raw = new unsigned char[b64_size_unrolling];

                auto const decode_mask = boost::beast::detail::base64::decode(img_mask_raw, json_object["mask"].as_string().c_str(), json_object["mask"].as_string().size());
                auto const decode_unrolling = boost::beast::detail::base64::decode(img_unrolling_raw, json_object["unrolling"].as_string().c_str(), json_object["unrolling"].as_string().size());

                int size_mask = decode_mask.first;
                int size_unrolling = decode_unrolling.first;

                std::vector<float> x;
                std::vector<float> a_x;
                std::vector<float> y;
                loadMaskRaw(img_mask_raw, size_mask, x, a_x, y);

                model = new Model(x, a_x, y);

                int width, height, channels;
                unsigned char *img = stbi_load_from_memory(img_unrolling_raw, size_unrolling, &width, &height, &channels, CHANNELS);

                model->setImage(img, width, height);

                std::cout << "Loaded a new project\n";
                sendModelLoaded(ws);

                delete[] img_mask_raw;
                delete[] img_unrolling_raw;

                sendFinished(ws);
            }
            if (json_object["command"].as_string() == "tune")
            {
                std::cout << message << "\n";
                if (model == nullptr)
                {
                    sendFinished(ws);
                    continue;
                }

                model->getModelPublicProperties()._interpolation_factor.setValue(getJsonFloat(json_object["if"]));
                model->getModelPublicProperties()._d_factor.setValue(getJsonFloat(json_object["d"]));
                model->getModelPublicProperties()._d_restrict.setValue(getJsonFloat(json_object["dr"]));
                model->getModelPublicProperties()._radius_modifier.setValue(getJsonFloat(json_object["rad"]));
                model->getModelPublicProperties()._optimize_active.setValue(getJsonBool(json_object["opt_active"]));
                model->getModelPublicProperties()._optimize_max_iterations.setValue(getJsonInt(json_object["opt_max_iter"]));
                model->getModelPublicProperties()._opt_xerror_weight.setValue(getJsonFloat(json_object["opt_e0w"]));
                model->getModelPublicProperties()._opt_yerror_weight.setValue(getJsonFloat(json_object["opt_e1w"]));
                model->getModelPublicProperties()._opt_rerror_weight.setValue(getJsonFloat(json_object["opt_e2w"]));
                model->getModelPublicProperties()._opt_aerror_weight.setValue(getJsonFloat(json_object["opt_e3w"]));
                model->getModelPublicProperties()._optimize_interpolation_factor.setValue(getJsonBool(json_object["opt_if"]));
                model->getModelPublicProperties()._optimize_d_factor.setValue(getJsonBool(json_object["opt_d"]));
                model->getModelPublicProperties()._optimize_radius_modifier.setValue(getJsonBool(json_object["opt_rad"]));
                model->getModelPublicProperties()._tilt.setValue(getJsonFloat(json_object["tilt"]));
                model->getModelPublicProperties()._preview_image_scale.setValue(getJsonFloat(json_object["pif"]));
                model->getModelPublicProperties()._image_rotation.setValue(getJsonFloat(json_object["ir"]));
                model->getModelPublicProperties()._vertical_shift.setValue(getJsonFloat(json_object["iry"]));
                model->getModelPublicProperties()._crop_top.setValue(getJsonFloat(json_object["croptop"]));
                model->getModelPublicProperties()._crop_bottom.setValue(getJsonFloat(json_object["cropbottom"]));
                model->getModelPublicProperties()._crop_right.setValue(getJsonFloat(json_object["cropright"]));
                model->getModelPublicProperties()._crop_left.setValue(getJsonFloat(json_object["cropleft"]));
                model->getModelPublicProperties()._grid_x.setValue(getJsonInt(json_object["gridx"]));
                model->getModelPublicProperties()._grid_y.setValue(getJsonInt(json_object["gridy"]));
                model->getModelPublicProperties()._grid_active.setValue(getJsonBool(json_object["grid_active"]));
                model->getModelPublicProperties()._grid_alp.setValue(getJsonBool(json_object["grid_alp"]));
                model->getModelPublicProperties()._grid_thickness.setValue(getJsonInt(json_object["grid_thickness"]));
                model->getModelPublicProperties()._image_active.setValue(getJsonBool(json_object["image_active"]));
                model->getModelPublicProperties()._enforce_isotropy.setValue(getJsonBool(json_object["enforce_isotropy"]));
                model->getModelPublicProperties()._generate_error_maps.setValue(getJsonBool(json_object["errors_active"]));
                model->getModelPublicProperties()._error_map_quality.setValue(getJsonFloat(json_object["errors_quality"]));
                model->getModelPublicProperties()._plot_interpolation.setValue(getJsonBool(json_object["plot_interp"]));
                model->getModelPublicProperties()._plot_ifcurve.setValue(getJsonBool(json_object["plot_ifcurve"]));
                model->getModelPublicProperties()._spline_smoothing.setValue(getJsonFloat(json_object["spline_smoothing"]));
                model->getModelPublicProperties()._render_max_res.setValue(getJsonInt(json_object["render_max_res"]));
                // gpu error mapping currently not supported
                // model->getModelPublicProperties()._errors_use_gpu.setValue(get_json_bool(json_object["errors_use_gpu"]));

                if (!model->checkPropertiesValid())
                {
                    sendFinished(ws);
                    continue;
                }
                model->updateState();

                RenderResult result;

                if (model->getModelPublicProperties()._image_active)
                {
                    Timer *t = new Timer("Image");
                    result = model->renderImage();
                    delete t;
                }

                if (model->getModelPublicProperties()._grid_active)
                {
                    Timer *t = new Timer("Grid");
                    result = model->renderGrid();
                    delete t;
                }

                if (model->getModelPublicProperties()._image_active || model->getModelPublicProperties()._grid_active)
                {
                    sendImageData(ws, result, "preview");
                }
                else
                {
                    result.image = new unsigned char[4 * 4 * 4];
                    memset(result.image, 0, 4 * 4 * 4);
                    result.width = 4;
                    result.height = 4;
                    sendImageData(ws, result, "preview");
                    delete[] result.image;
                }

                if (model->getModelPublicProperties()._generate_error_maps)
                {
                    Timer *t = new Timer("Errors");
                    model->mapErrors();
                    sendImageData(ws, model->renderError(0), "xerror");
                    sendImageData(ws, model->renderError(1), "yerror");
                    sendImageData(ws, model->renderError(2), "xyerror");
                    sendImageData(ws, model->renderError(3), "rerror");
                    sendImageData(ws, model->renderError(4), "aerror");
                    delete t;
                }

                if (model->getModelPublicProperties()._plot_interpolation)
                {
                    sendPlotData(ws, model->getInterpolationPlotData());
                }
                if (model->getModelPublicProperties()._plot_ifcurve)
                {
                    sendPlotData(ws, model->getIFCurvePlotData());
                }

                sendParameterFeedback(ws, model->getParameterFeedback());
                sendFinished(ws);
            }
            delete pt;
        }
    }
    catch (boost::beast::system_error const &e)
    {
        std::cerr << "Session error: " << e.what() << std::endl;
    }
    catch (std::exception const &e)
    {
        sendError(ws, std::string(e.what()));
        std::cerr << "Session error: " << e.what() << std::endl;
    }
    delete model;
    destroyGLFWWindow(w);
}

#include "shader.hpp"

int main(int argc, char *argv[])
{
    cxxopts::Options options("AnRoll Server", "Parameters");
    options.add_options()("p,port", "Port", cxxopts::value<int>()->default_value("57777"));
    options.add_options()("c,connections", "Max Connections", cxxopts::value<int>()->default_value("8"));
    options.add_options()("h,help", "Print usage");

    auto result = options.parse(argc, argv);

    int port = result["port"].as<int>();
    int max_connections = result["connections"].as<int>();

    if (result.count("help"))
    {
        std::cout << options.help() << "\n";
        return 0;
    }

    if (!glfwInit())
    {
        assert(false && "Failed to initialized GLFW Library");
    }

    try
    {
        // Create an I/O context
        net::io_context ioc;

        // Create an acceptor to listen on the TCP port
        tcp::acceptor acceptor{ioc, tcp::endpoint{net::ip::make_address("0.0.0.0"), port}};
        std::cout << "WebSocket server listening on ws://0.0.0.0:" << port << std::endl;

        while (true)
        {
            // Accept a new connection
            tcp::socket socket{ioc};
            acceptor.accept(socket);

            // Spawn a thread to handle the session
            std::thread{[s = std::move(socket)]() mutable
                        {
                            doSession(std::move(s));
                        }}
                .detach();
        }
    }
    catch (std::exception const &e)
    {
        std::cerr << "Fatal error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}
