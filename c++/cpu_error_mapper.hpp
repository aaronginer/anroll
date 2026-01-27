#pragma once

#include <assert.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <cstring>
#include <memory>

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

        _x = std::make_unique<float[]>(size);
        _y = std::make_unique<float[]>(size);
        _t = std::make_unique<unsigned int[]>(size * 2 * 3);
        _e_x = std::make_unique<double[]>(size);
        _e_y = std::make_unique<double[]>(size);
        _e_r = std::make_unique<double[]>(size);
        _e_a = std::make_unique<double[]>(size);
        _c_x = std::make_unique<float[]>(size * 3);
        _c_y = std::make_unique<float[]>(size * 3);
        _c_xy = std::make_unique<float[]>(size * 3);
        _c_r = std::make_unique<float[]>(size * 3);
        _c_a = std::make_unique<float[]>(size * 3);
    }

    ~CPUErrorMapResult() = default;

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
        return {_x.get(), _y.get(), _c_x.get(), _t.get()};
    }

    RenderData getRenderDataYError()
    {
        return {_x.get(), _y.get(), _c_y.get(), _t.get()};
    }

    RenderData getRenderDataXYError()
    {
        return {_x.get(), _y.get(), _c_xy.get(), _t.get()};
    }

    RenderData getRenderDataRError()
    {
        return {_x.get(), _y.get(), _c_r.get(), _t.get()};
    }

    RenderData getRenderDataAError()
    {
        return {_x.get(), _y.get(), _c_a.get(), _t.get()};
    }

    int _width = 0, _height = 0, _size = 0;
    std::unique_ptr<float[]> _x;
    std::unique_ptr<float[]> _y;
    std::unique_ptr<unsigned int[]> _t;
    std::unique_ptr<double[]> _e_x; // error in x direction
    std::unique_ptr<double[]> _e_y; // error in y direction
    std::unique_ptr<double[]> _e_r; // error relative x/y
    std::unique_ptr<double[]> _e_a; // error in angle
    std::unique_ptr<float[]> _c_x;
    std::unique_ptr<float[]> _c_y;
    std::unique_ptr<float[]> _c_xy;
    std::unique_ptr<float[]> _c_r;
    std::unique_ptr<float[]> _c_a;
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
    std::unique_ptr<CPUErrorMapResult> _result = nullptr;
    MappingTables *_mapping_tables = nullptr;
};