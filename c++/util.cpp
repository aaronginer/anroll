#include "util.hpp"

#include <vector>
#include <cmath>
#include <iostream>
#include <algorithm>

#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

#include <boost/json/src.hpp>

#define CHANNELS 4

void loadMaskFile(std::string folder_path, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y)
{
    std::string file_name = "mask.png";
    int width, height, channels;
    unsigned char *img = stbi_load(folder_path.append(file_name).c_str(), &width, &height, &channels, CHANNELS); // Force RGBA
    loadMask(img, width, height, x, a_x, y);
    stbi_image_free(img);
}

void loadMaskRaw(unsigned char *raw_image, int length, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y)
{
    int width, height, channels;
    unsigned char *img = stbi_load_from_memory(raw_image, length, &width, &height, &channels, CHANNELS); // Force RGBA
    loadMask(img, width, height, x, a_x, y);
    stbi_image_free(img);
}

void loadMask(unsigned char *img, int width, int height, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y)
{
    if (!img)
    {
        std::cerr << "Failed to load mask.\n";
        return;
    }

    // *****************************************
    // find the top and bottom edges of the mask
    // *****************************************

    // TODO ALLOW MASK TO START WITH WHITE PIXEL AND END WITH WHITE PIXEL

    int top = -1;
    int bottom = -1;
    int prev_r = -1;
    int prev_g = -1;
    int prev_b = -1;
    for (int h = 0; h < height; h++)
    {
        int w = width / 2;
        int pixel_index = (h * width + w) * CHANNELS;

        int r = img[pixel_index];
        int g = img[pixel_index + 1];
        int b = img[pixel_index + 2];

        if (prev_r != -1 && !(prev_r == r && prev_g == g && prev_b == b))
        {
            if (bottom == -1)
            {
                bottom = h;
            }
            else
            {
                top = h - 1;
                break;
            }
        }

        prev_r = r;
        prev_g = g;
        prev_b = b;
    }

    if (top == -1 || bottom == -1)
    {
        throw std::runtime_error("Error loading mask: Mask does not contain a valid top and bottom edge. \nMake sure the inner part is solid white and the outer part is solid black.");
    }

    // *****************************************
    // find the x-edges of the mask
    // *****************************************

    std::vector<int> edge_right;
    edge_right.resize(height);
    int edges_found = 0;
    for (int h = bottom; h <= top; h++)
    {
        int x_center = (int)width / 2.f;
        // find right edge of the mask
        for (int w = width - 1; w >= x_center; w--)
        {
            int pixel_index = (h * width + w) * CHANNELS;

            int r = img[pixel_index];
            int g = img[pixel_index + 1];
            int b = img[pixel_index + 2];
            if (r == 255 && g == 255 && b == 255)
            {
                edge_right[h] = w;
                edges_found++;
                break;
            }
        }
    }

    if (edges_found != top - bottom + 1)
    {
        throw std::runtime_error("Error loading mask: Mask does not contain a valid edge. \nMake sure the inner part is solid white and the outer part is a single solid color. Also make sure to use the correct half of the mask.");
    }

    // *****************************************
    // trace arc and save heights and radii
    // *****************************************
    std::vector<float> x_tmp;
    std::vector<float> y_tmp;

    x_tmp.push_back(0);
    y_tmp.push_back(edge_right[bottom] - width / 2.f);
    for (int h = bottom + 1; h <= top; h++)
    {
        float radius = edge_right[h] - width / 2.f;

        x_tmp.push_back(h - bottom);
        y_tmp.push_back(radius);
    }

    // *****************************************
    // see whether the radius is growing or shrinking for each height h
    // *****************************************
    std::vector<bool> growing; // for each data point, this array shows whether y will get bigger or smaller afterward
    for (int i = 0; i < x_tmp.size(); i++)
    {
        // last element handling
        if (i == x_tmp.size() - 1)
        {
            growing.push_back(growing[growing.size() - 1]);
            break;
        }

        // iterate through following y values to determine growth/shrinkage
        for (int j = i + 1; j < x_tmp.size(); j++)
        {
            float y_current = y_tmp[i];
            if (y_tmp[j] > y_current)
            {
                growing.push_back(true);
                break;
            }
            else if (y_tmp[j] < y_current)
            {
                growing.push_back(false);
                break;
            }
            // edge case where the mask contour is the same from i until size-1
            else if (j == x_tmp.size() - 1)
            {
                growing.push_back(false);
                break;
            }
        }
    }

    // *****************************************
    // remove unnecessary data-points from x_tmp/y_tmp
    // and populate x, y results
    // *****************************************
    bool c_growing = growing[0];
    for (int i = 0; i < x_tmp.size(); i++)
    {
        // always keep first and last
        if (i == 0 || i == x_tmp.size() - 1)
        {
            x.push_back(x_tmp[i]);
            y.push_back(y_tmp[i]);
            continue;
        }

        // case: current radius is same as previous radius
        if (y_tmp[i] == y_tmp[i - 1])
        {
            /* keep value if radius changes afterwards and growing changes as well /----#\ */
            if (y_tmp[i] != y_tmp[i + 1] && growing[i] != c_growing)
            {
                c_growing = !c_growing;
                x.push_back(x_tmp[i]);
                y.push_back(y_tmp[i]);
                continue;
            }
        }
        // case: current radius is different from previous radius -> keep
        else
        {
            // TODO skip local mask pixel errors

            // change current growth direction if necessary
            if (growing[i] != c_growing)
            {
                c_growing = !c_growing;
            }
            x.push_back(x_tmp[i]);
            y.push_back(y_tmp[i]);
        }
    }

    // *****************************************
    // calculate arc data a_x and arc_length
    // *****************************************
    a_x.push_back(0);
    float arc_length = 0;
    for (int i = 1; i < x.size(); i++)
    {
        float p1_x = (float)y[i];
        float p1_y = (float)x[i];

        float p2_x = (float)y[i - 1];
        float p2_y = (float)x[i - 1];

        float distance = sqrt(pow(p1_x - p2_x, 2) + pow(p1_y - p2_y, 2));
        assert(distance >= 1);
        arc_length += distance;

        a_x.push_back(arc_length);
    }

    debug("Mask loaded");
}

std::pair<float, bool> getJsonFloat(const boost::json::value &val)
{
    if (val.is_double())
    {
        return {static_cast<float>(val.as_double()), true};
    }
    else if (val.is_int64())
    {
        return {static_cast<float>(val.as_int64()), true};
    }
    else if (val.is_uint64())
    {
        return {static_cast<float>(val.as_uint64()), true};
    }
    return {0.f, false};
}

std::pair<int, bool> getJsonInt(const boost::json::value &val)
{
    if (val.is_int64())
    {
        return {static_cast<int>(val.as_int64()), true};
    }
    return {0, false};
}

std::pair<bool, bool> getJsonBool(const boost::json::value &val)
{
    if (val.is_int64())
    {
        return {static_cast<int>(val.as_int64()) == 1, true};
    }
    else if (val.is_bool())
    {
        return {val.as_bool(), true};
    }
    return {0, false};
}

void linspace(std::vector<float> &result, float start, float end, int n)
{
    if (n < 2)
        return;

    result.reserve(n);
    float step = (end - start) / (n - 1);

    for (int i = 0; i < n; i++)
    {
        result.push_back(start + i * step);
    }
}

Vec4 getErrorColor(double t)
{
    t = std::clamp(t - 0.5, 0.0, 1.0);

    Vec4 c1(0.0, 0.114, 0.549);
    Vec4 c2(0.161, 0.3333, 1.0);
    Vec4 c3(1.0, 1.0, 1.0);
    Vec4 c4(1.0, 0.157, 0.2);
    Vec4 c5(0.557, 0.0, 0.016);

    if (t < 0.45)
    {
        return mix(c1, c2, t / 0.45);
    }
    else if (t < 0.5)
    {
        return mix(c2, c3, (t - 0.45) / 0.05);
    }
    else if (t == 0.5)
    {
        return c3;
    }
    else if (t <= 0.55)
    {
        return mix(c3, c4, (t - 0.5) / 0.05);
    }
    else
    {
        return mix(c4, c5, (t - 0.55) / 0.45);
    }
}

void debug(const char *message)
{
    std::cout << message << "\n";
    fflush(stdout);
}