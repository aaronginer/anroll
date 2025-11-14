#pragma once

#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <assert.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <cstring>

#include "util.hpp"

#include "shader.hpp"

//********************************/
// ImageMapResult implementation

class ImageMapResult
{
public:
    ImageMapResult(int width, int height)
    {
        int size = width * height;
        _x = new float[size];
        _y = new float[size];
        _c = new float[size * 3];
        _t = new unsigned int[size * 2 * 3];
    }

    ~ImageMapResult()
    {
        delete[] _x;
        delete[] _y;
        delete[] _c;
        delete[] _t;
    }

    RenderData getRenderData()
    {
        return {_x, _y, _c, _t};
    }

    float *_x;
    float *_y;
    float *_c;
    unsigned int *_t;
};

#define NUM_BUFFERS_IMG 8
class ImageMapper
{
public:
    ImageMapper();

    ~ImageMapper();

    GLuint _buffers[NUM_BUFFERS_IMG] = {0, 0, 0, 0, 0, 0, 0, 0};
    GLuint _image_tex;
    GLuint _program, _program_calc_values;
    int _width = 0, _height = 0, _size = 0;
    ImageMapResult *_result = nullptr;

    void setSize(int width, int height);

    void initBuffers();

    void bindBuffers();

    void loadImageTexture(int width, int height, unsigned char *image);

    void fillBuffers(MappingTables &mapping_tables);
    void readBuffers();

    void fillUniforms(float arc_length, float interpolation_factor, float radius_modifier, float image_rotation, float vertical_shift, float tilt, float crop_bottom, float crop_top, float crop_left, float crop_right);

    void createProgram();

    void map(int width, int height, MappingTables &mapping_tables, float arc_length, float interpolation_factor, float radius_modifier,
             float image_rotation, float vertical_shift, float tilt, float crop_bottom, float crop_top, float crop_left, float crop_right);

    void run();
};