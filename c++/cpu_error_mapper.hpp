#pragma once

#include <assert.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <cstring>

#include "util.hpp"

#include "shader.hpp"

//********************************/
// CPUErrorMapResult implementation

class CPUErrorMapResult
{
public:
    CPUErrorMapResult(int width, int height)
    {
        int size = width * height;
        _width = width;
        _height = height;
        _size = size;

        _x = new float[size];
        _y = new float[size];
        _t = new unsigned int[size * 2 * 3];
        _e_x = new double[size];
        _e_y = new double[size];
        _e_r = new double[size];
        _e_a = new double[size];
        _c_x = new float[size * 3];
        _c_y = new float[size * 3];
        _c_xy = new float[size * 3];
        _c_r = new float[size * 3];
        _c_a = new float[size * 3];
    }

    ~CPUErrorMapResult()
    {
        delete[] _x;
        delete[] _y;
        delete[] _t;
        delete[] _e_x;
        delete[] _e_y;
        delete[] _e_r;
        delete[] _e_a;
        delete[] _c_x;
        delete[] _c_y;
        delete[] _c_xy;
        delete[] _c_r;
        delete[] _c_a;
    }

    double getWeightedError(int index, std::vector<float> weights) const
    {
        // adjust weights to total 1
        float total_weight = 0;
        for (float weight : weights)
        {
            total_weight += weight;
        }
        if (total_weight == 0)
            return 0;
        for (float &weight : weights)
        {
            weight /= total_weight;
        }
        return _e_x[index] * weights[0] + _e_y[index] * weights[1] + _e_r[index] * weights[2] + _e_a[index] * weights[3];
    }

    RenderData getRenderDataXError()
    {
        return {_x, _y, _c_x, _t};
    }

    RenderData getRenderDataYError()
    {
        return {_x, _y, _c_y, _t};
    }

    RenderData getRenderDataXYError()
    {
        return {_x, _y, _c_xy, _t};
    }

    RenderData getRenderDataRError()
    {
        return {_x, _y, _c_r, _t};
    }

    RenderData getRenderDataAError()
    {
        return {_x, _y, _c_a, _t};
    }

    int _width = 0, _height = 0, _size = 0;
    float *_x;
    float *_y;
    unsigned int *_t;
    double *_e_x; // error in x direction
    double *_e_y; // error in y direction
    double *_e_r; // error relative x/y
    double *_e_a; // error in angle
    float *_c_x;
    float *_c_y;
    float *_c_xy;
    float *_c_r;
    float *_c_a;
};

class ErrorMapper
{
public:
    ErrorMapper() {}

    ~ErrorMapper();

    void setParams(int width, int height, double a, double IF, double rad_factor, MappingTables *mapping_tables, double tilt, double crop_left, double crop_right);

    Vec4 getCirclePoint(double r, Vec4 cp, double arc_offset);
    double getRadiusIF(int yi, double cIF);

    Vec4 mapPoint(double x, int xi, int yi);

    void map(int width, int height, MappingTables *mapping_tables, float arc_length, float interpolation_factor, float radius_modifier, float tilt, float crop_left, float crop_right);
    void run();

    int _width = 0, _height = 0, _size = 0;
    double _a, _IF, _rad_factor, _tilt, _crop_left, _crop_right;
    MappingTables *_mapping_tables = nullptr;
    CPUErrorMapResult *_result = nullptr;
};