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

#include "unsupported/Eigen/Splines"
#include "Eigen/Dense"

//********************************/
// GridMapperResult implementation

class GridMapResult
{
public:
    GridMapResult(int width, int height)
    {
        int size = width * height;
        _x = new float[size];
        _y = new float[size];
    }

    ~GridMapResult()
    {
        delete[] _x;
        delete[] _y;
    }

    RenderData getRenderData()
    {
        return {_r_x.data(), _r_y.data(), nullptr, _r_l.data()};
    }

    std::vector<float> _r_x;
    std::vector<float> _r_y;
    std::vector<unsigned int> _r_l; // line buffer
    float *_x;
    float *_y;
};

#define NUM_BUFFERS_GRID 6
class GridMapper
{
public:
    GridMapper();

    ~GridMapper();

    /* BUFFERS:
    0: output x
    1: output y
    2: input if table
    3: input x_a_x table
    4: input a_x_y table
    5: input linear table
    */
    GLuint _buffers[NUM_BUFFERS_GRID] = {0, 0, 0, 0, 0, 0};
    GLuint _program, _program_calc_values;
    int _width = 0, _height = 0, _size = 0;
    GridMapResult *_result = nullptr;

    void setSize(int width, int height);

    void initBuffers();

    void bindBuffers();

    void fillBuffers(MappingTables &mapping_tables);

    void readBuffers();

    void fillUniforms(float arc_length, float interpolation_factor, float radius_modifier, float tilt, float crop_left, float crop_right);

    void createProgram();

    void map(int width, int height, MappingTables &mapping_tables, float arc_length, float interpolation_factor,
             float radius_modifier, float tilt, float crop_left, float crop_right);

    void interpolate();

    void run();
};