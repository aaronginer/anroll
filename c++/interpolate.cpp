#include "cxxopts.hpp"
#include <iostream>
#include "model.hpp"
#include <cmath>
#include "util.hpp"
#include "stb_image.h"
#include "stb_image_write.h"
#include "timer.hpp"

// auxiliary tool for the paper, not for production uses
int main(int argc, char *argv[])
{
    if (!glfwInit())
    {
        assert(false && "Failed to initialized GLFW Library");
    }
    GLFWwindow *w = initGLFWContext();

    cxxopts::Options options("AnRoll CMD", "Model Parameters");

    options.add_options()("m,mask", "Input Mask Path", cxxopts::value<std::string>()->default_value("test.png"));
    options.add_options()("u,unrolling", "Input Unrolling Path", cxxopts::value<std::string>()->default_value("test.png"));
    options.add_options()("o,output-file", "Output File Path", cxxopts::value<std::string>()->default_value("output.png"));
    options.add_options()("e,enforce-isotropy", "X Distortion Compensation [true/false]", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("s,scale", "Image Resolution [0,1]", cxxopts::value<float>()->default_value("0.5"));
    options.add_options()("export-result", "Export Result", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("export-error-maps", "Export Error Maps", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("grid-active", "Grid Active", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("grid-uniform", "Grid Uniform", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("x,grid-x", "Grid Lines Horizontal", cxxopts::value<int>()->default_value("21"));
    options.add_options()("y,grid-y", "Grid Lines Vertical", cxxopts::value<int>()->default_value("21"));
    options.add_options()("t,grid-t", "Grid Line Thickness", cxxopts::value<int>()->default_value("1"));
    options.add_options()("image-active", "Image Active", cxxopts::value<bool>()->default_value("true"));
    options.add_options()("smoothing", "Contour Smoothing", cxxopts::value<float>()->default_value("0.001"));
    options.add_options()("dist-quality", "Distortion Map Fidelity", cxxopts::value<float>()->default_value("1.0"));

    // bounds
    options.add_options()("if-low", "IF lower bound", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("if-high", "IF upper bound", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("if-steps", "IF steps", cxxopts::value<int>()->default_value("100"));

    options.add_options()("d-low", "d lower bound", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("d-high", "d upper bound", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("d-steps", "d steps", cxxopts::value<int>()->default_value("100"));

    options.add_options()("r-low", "Radius Factor lower bound", cxxopts::value<float>()->default_value("6.282"));
    options.add_options()("r-high", "Radius Factor upper bound", cxxopts::value<float>()->default_value("6.282"));
    options.add_options()("r-steps", "Radius Factor steps", cxxopts::value<int>()->default_value("100"));

    options.add_options()("h,help", "Print usage");

    auto result = options.parse(argc, argv);

    std::string mask = result["mask"].as<std::string>();
    std::string unrolling = result["unrolling"].as<std::string>();
    std::string output_file = result["output-file"].as<std::string>();
    bool y_distortion = result["enforce-isotropy"].as<bool>();
    float scale = result["scale"].as<float>();
    bool export_result = result["export-result"].as<bool>();
    bool export_error_maps = result["export-error-maps"].as<bool>();
    bool image_active = result["image-active"].as<bool>();
    bool grid_active = result["grid-active"].as<bool>();
    bool grid_uniform = result["grid-uniform"].as<bool>();
    int grid_lines_h = result["grid-x"].as<int>();
    int grid_lines_v = result["grid-y"].as<int>();
    int grid_thickness = result["grid-t"].as<int>();

    float smoothing = result["smoothing"].as<float>();

    float dist_quality = result["dist-quality"].as<float>();

    float if_low = result["if-low"].as<float>();
    float if_high = result["if-high"].as<float>();
    int if_steps = result["if-steps"].as<int>();

    float d_low = result["d-low"].as<float>();
    float d_high = result["d-high"].as<float>();
    int d_steps = result["d-steps"].as<int>();

    float r_low = result["r-low"].as<float>();
    float r_high = result["r-high"].as<float>();
    int r_steps = result["r-steps"].as<int>();

    if (result.count("help"))
    {
        std::cout << options.help() << "\n";
        return 0;
    }

    // preprocessing
    std::vector<float> x;
    std::vector<float> a_x;
    std::vector<float> y;

    int width;
    int height;
    int channels;
    unsigned char *mask_raw = stbi_load(mask.c_str(), &width, &height, &channels, CHANNELS);
    loadMask(mask_raw, width, height, x, a_x, y);

    // load model
    Model *model = new Model(x, a_x, y);

    unsigned char *img = stbi_load(unrolling.c_str(), &width, &height, &channels, CHANNELS);

    model->setImage(img, width, height);

    model->getModelPublicProperties()._enforce_isotropy.setValue({y_distortion, true});
    model->getModelPublicProperties()._generate_error_maps.setValue({true, true});
    model->getModelPublicProperties()._preview_image_scale.setValue({scale, true});
    model->getModelPublicProperties()._grid_active.setValue({grid_active, true});
    model->getModelPublicProperties()._grid_alp.setValue({grid_uniform, true});
    model->getModelPublicProperties()._grid_x.setValue({grid_lines_h, true});
    model->getModelPublicProperties()._grid_y.setValue({grid_lines_v, true});
    model->getModelPublicProperties()._image_active.setValue({image_active, true});
    model->getModelPublicProperties()._grid_thickness.setValue({grid_thickness, true});
    model->getModelPublicProperties()._spline_smoothing.setValue({smoothing, true});
    model->getModelPublicProperties()._error_map_quality.setValue({dist_quality, true});

    long long image_render_time = 0;
    int rendered = 0;
    for (int if_i = 0; if_i < (if_high == if_low ? 1 : if_steps); if_i++)
    {
        float interp_i = if_i / float(if_steps - 1);
        float val_if = mix(if_low, if_high, interp_i);

        // set if
        model->getModelPublicProperties()._interpolation_factor.setValue({val_if, true});
        model->updateBetaBounds();
        float prev_d = -INFINITY;
        for (int d_i = 0; d_i < (d_high == d_low ? 1 : d_steps); d_i++)
        {
            float interp_d = d_i / float(d_steps - 1);
            float val_d = mix(d_low, d_high, interp_d);

            // set d-val
            if (d_low == d_high)
            {
                model->getIFCurve()->getFunction()->update(val_if, val_if);
                val_d = val_if;
            }
            else
            {
                model->getModelPublicProperties()._d_factor.setValue({val_d, true});
                val_d = model->getIFCurve()->getFunction()->getParams()[1];
            }

            if (prev_d == val_d)
            {
                continue;
            }

            prev_d = val_d;

            for (int r_i = 0; r_i < (r_high == r_low ? 1 : r_steps); r_i++)
            {
                float interp_r = r_i / float(r_steps - 1);
                float val_r = mix(r_low, r_high, interp_r);

                // set r
                model->getModelPublicProperties()._radius_modifier.setValue({val_r, true});

                model->updateState();
                model->mapErrors();

                if (export_error_maps)
                {
                    auto eres = model->renderError(0);
                    stbi_write_png(std::string("err_h_if=").append(std::to_string(val_if)).append("_d=").append(std::to_string(val_d)).append("_r=").append(std::to_string(val_r)).append("_ef=").append(y_distortion ? "true" : "false").append(".png").c_str(), eres.width, eres.height, CHANNELS, eres.image, 0);
                    eres = model->renderError(1);
                    stbi_write_png(std::string("err_v_if=").append(std::to_string(val_if)).append("_d=").append(std::to_string(val_d)).append("_r=").append(std::to_string(val_r)).append("_ef=").append(y_distortion ? "true" : "false").append(".png").c_str(), eres.width, eres.height, CHANNELS, eres.image, 0);
                    eres = model->renderError(3);
                    stbi_write_png(std::string("err_r_if=").append(std::to_string(val_if)).append("_d=").append(std::to_string(val_d)).append("_r=").append(std::to_string(val_r)).append("_ef=").append(y_distortion ? "true" : "false").append(".png").c_str(), eres.width, eres.height, CHANNELS, eres.image, 0);
                    eres = model->renderError(4);
                    stbi_write_png(std::string("err_a_if=").append(std::to_string(val_if)).append("_d=").append(std::to_string(val_d)).append("_r=").append(std::to_string(val_r)).append("_ef=").append(y_distortion ? "true" : "false").append(".png").c_str(), eres.width, eres.height, CHANNELS, eres.image, 0);
                }

                if (export_result)
                {
                    RenderResult r;
                    Timer *image_timer = new Timer("Render Time", true);
                    if (image_active)
                    {
                        r = model->renderImage();
                    }
                    if (grid_active)
                    {
                        r = model->renderGrid();
                    }
                    image_render_time += image_timer->getElapsedTimeMicroseconds();
                    delete image_timer;
                    rendered++;
                    if (image_active || grid_active)
                    {
                        stbi_write_png(std::string("res_if=").append(std::to_string(val_if)).append("_d=").append(std::to_string(val_d)).append("_r=").append(std::to_string(val_r)).append("_ef=").append(y_distortion ? "true" : "false").append(".png").c_str(), r.width, r.height, CHANNELS, r.image, 0);
                    }
                }

                float eh = 0.0f;
                float ev = 0.0f;
                float er = 0.0f;
                float ea = 0.0f;
                int pixels = model->getCPUErrorMapper()->_result->_width * model->getCPUErrorMapper()->_result->_height;
                for (int x = 0; x < pixels; x++)
                {
                    eh += model->getCPUErrorMapper()->_result->getWeightedError(x, {1.0, 0.0, 0.0, 0.0});
                    ev += model->getCPUErrorMapper()->_result->getWeightedError(x, {0.0, 1.0, 0.0, 0.0});
                    er += model->getCPUErrorMapper()->_result->getWeightedError(x, {0.0, 0.0, 1.0, 0.0});
                    ea += model->getCPUErrorMapper()->_result->getWeightedError(x, {0.0, 0.0, 0.0, 1.0});
                }
                // format this so that each error is aligned to 10 characters
                // std::cout << "DATA:" << val_if << "," << val_d << "," << val_r << "," << eh / pixels << "," << ev / pixels << "," << er / pixels << "," << ea / pixels << "\n";
                std::cout << val_if << ";" << val_d << ";" << val_r << ";" << eh << ";" << ev << ";" << er << ";" << ea << "\n";
            }
        }
    }

    // std::cout << "Average Image Render Time: " << image_render_time / float(rendered) / 1000000.0f << "s\n";

    delete model;

    destroyGLFWWindow(w);
    stbi_image_free(mask_raw);
    stbi_image_free(img);
    return 0;
}