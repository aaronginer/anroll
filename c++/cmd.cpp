#include "cxxopts.hpp"
#include <iostream>
#include "model.hpp"
#include <cmath>
#include "util.hpp"
#include "stb_image.h"
#include "stb_image_write.h"
#include "timer.hpp"

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
    options.add_options()("i,interpolation-factor", "Interpolation Factor", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("d,d-factor", "Horizontal Non-Uniformity", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("r,radius-factor", "Radius Factor", cxxopts::value<float>()->default_value("6.282"));
    options.add_options()("rotation", "Image Rotation", cxxopts::value<float>()->default_value("0.0"));
    options.add_options()("e,enforce-isotropy", "X Distortion Compensation", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("grid-active", "Grid Active", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("grid-uniform", "Grid Uniform", cxxopts::value<bool>()->default_value("false"));
    options.add_options()("x,grid-x", "Grid Lines Horizontal", cxxopts::value<int>()->default_value("21"));
    options.add_options()("y,grid-y", "Grid Lines Vertical", cxxopts::value<int>()->default_value("21"));
    options.add_options()("t,grid-t", "Grid Line Thickness", cxxopts::value<int>()->default_value("1"));
    options.add_options()("image-active", "Image Active", cxxopts::value<bool>()->default_value("true"));
    options.add_options()("h,help", "Print usage");

    auto result = options.parse(argc, argv);

    std::string mask = result["mask"].as<std::string>();
    std::string unrolling = result["unrolling"].as<std::string>();
    std::string output_file = result["output-file"].as<std::string>();
    float interpolation_factor = result["interpolation-factor"].as<float>();
    float d_factor = result["d-factor"].as<float>();
    float radius_factor = result["radius-factor"].as<float>();
    float rotation = result["rotation"].as<float>();
    bool y_distortion = result["enforce-isotropy"].as<bool>();
    bool image_active = result["image-active"].as<bool>();
    bool grid_uniform = result["grid-uniform"].as<bool>();
    bool grid_active = result["grid-active"].as<bool>();
    int grid_lines_h = result["grid-x"].as<int>();
    int grid_lines_v = result["grid-y"].as<int>();
    int grid_thickness = result["grid-t"].as<int>();

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

    model->getModelPublicProperties()._interpolation_factor.setValue({interpolation_factor, true});
    model->getModelPublicProperties()._d_factor.setValue({d_factor, true});
    model->getModelPublicProperties()._radius_modifier.setValue({radius_factor, true});
    model->getModelPublicProperties()._image_rotation.setValue({rotation, true});
    model->getModelPublicProperties()._enforce_isotropy.setValue({y_distortion, true});
    model->getModelPublicProperties()._generate_error_maps.setValue({true, true});
    model->getModelPublicProperties()._grid_active.setValue({grid_active, true});
    model->getModelPublicProperties()._grid_alp.setValue({grid_uniform, true});
    model->getModelPublicProperties()._grid_x.setValue({grid_lines_h, true});
    model->getModelPublicProperties()._grid_y.setValue({grid_lines_v, true});
    model->getModelPublicProperties()._image_active.setValue({image_active, true});
    model->getModelPublicProperties()._grid_thickness.setValue({grid_thickness, true});

    model->updateState();

    RenderResult r;
    if (image_active)
    {
        r = model->renderImage();
    }
    if (grid_active)
    {
        r = model->renderGrid();
    }
    // export the image
    if (image_active || grid_active)
    {
        stbi_write_png(output_file.c_str(), r.width, r.height, CHANNELS, r.image, 0);
    }

    delete model;
    stbi_image_free(img);
    stbi_image_free(mask_raw);
    destroyGLFWWindow(w);
}