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

struct Vertex
{
    float x, y;    // aPos
    float r, g, b; // aColor
};

typedef struct RenderResult
{
    unsigned char *image;
    size_t width;
    size_t height;
} __RenderResult__;

class Renderer
{
public:
    Renderer();

    ~Renderer();

    GLuint _fbo, _tex, _vao, _vbo, _ebo;
    GLuint _program;
    int _width = 0, _height = 0, _size = 0;
    int _render_width = 0, _render_height = 0;
    std::vector<unsigned char> _output_buffer;
    float _c_min_x, _c_max_x;
    float _c_min_y, _c_max_y;

    void setSize(int width, int height);

    void setRenderSize(int render_size, float hw_retio);

    void initBuffers();

    void fillBuffersTriangles(RenderData render_data);

    void fillBuffersLines(RenderData render_data, int num_points, int num_indices);

    void fillUniforms(int point_size);

    void createProgram();

    void readResult();

    RenderResult renderTriangles(int width, int height, int render_size, RenderData render_data);

    RenderResult renderLines(int width, int height, int num_points, int num_indices, int render_size, bool render_on_top, int line_size, RenderData render_data);

    void runTriangles();

    void runPoints(int num_points, bool render_on_top);

    void runLines(int num_indices, bool render_on_top, int line_size);
};