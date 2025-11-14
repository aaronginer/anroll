#include "gl_renderer.hpp"

//********************************/
// Renderer implementation

Renderer::Renderer()
{
    createProgram();
    initBuffers();
}

Renderer::~Renderer()
{
    glDeleteProgram(_program);
}

void Renderer::setSize(int width, int height)
{
    if (width == _width && height == _height)
        return;

    _width = width;
    _height = height;
    _size = width * height;
}

void Renderer::setRenderSize(int render_size, float hw_retio)
{
    // short size is always render_size
    int render_width = render_size;
    int render_height = render_size;
    if (hw_retio > 1)
    {
        render_width = int(render_size / hw_retio);
    }
    else
    {
        render_height = int(render_size * hw_retio);
    }

    if (render_width == _render_width && render_height == _render_height)
        return;

    _render_width = render_width;
    _render_height = render_height;
    _output_buffer.resize(_render_width * render_height * 4);
    // resize window
    glfwSetWindowSize(glfwGetCurrentContext(), render_width, render_height);
    // reallocate texture memory
    glBindTexture(GL_TEXTURE_2D, _tex);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, render_width, render_height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
}

void Renderer::initBuffers()
{
    // generate framebuffer and bind it
    glGenFramebuffers(1, &_fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, _fbo);

    // generate texture and bind to framebuffer
    glGenTextures(1, &_tex);
    glBindTexture(GL_TEXTURE_2D, _tex);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, _tex, 0);

    // generate vertex array, vertex buffer, element buffer
    glGenVertexArrays(1, &_vao);
    glBindVertexArray(_vao);

    glGenBuffers(1, &_vbo);
    glGenBuffers(1, &_ebo);
}

void Renderer::fillBuffersTriangles(RenderData render_data)
{
    std::vector<Vertex> vertices(_size);
    for (size_t i = 0; i < _size; ++i)
    {
        float x_clip = (render_data._x[i] - _c_min_x) / ((_c_max_x - _c_min_x) / 2.0f) - 1.0f;
        float y_clip = -((render_data._y[i] - _c_min_y) / ((_c_max_y - _c_min_y) / 2.0f) - 1.0f);
        vertices[i] = {x_clip, y_clip, render_data._c[i * 3 + 0], render_data._c[i * 3 + 1], render_data._c[i * 3 + 2]};
    }

    glBindBuffer(GL_ARRAY_BUFFER, _vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), vertices.data(), GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, _ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, (_width - 1) * (_height - 1) * 2 * 3 * sizeof(unsigned int), render_data._t, GL_STATIC_DRAW);
}

void Renderer::fillBuffersLines(RenderData render_data, int num_points, int num_indices)
{
    std::vector<Vertex> vertices(num_points);
    for (size_t i = 0; i < num_points; ++i)
    {
        float x_clip = (render_data._x[i] - _c_min_x) / ((_c_max_x - _c_min_x) / 2.0f) - 1.0f;
        float y_clip = -((render_data._y[i] - _c_min_y) / ((_c_max_y - _c_min_y) / 2.0f) - 1.0f);
        vertices[i] = {x_clip, y_clip, 0, 0, 0};
    }

    glBindBuffer(GL_ARRAY_BUFFER, _vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), vertices.data(), GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, _ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, num_indices * sizeof(unsigned int), render_data._t, GL_STATIC_DRAW);
}

void Renderer::fillUniforms(int point_size)
{
    glUseProgram(_program);
    glUniform1ui(glGetUniformLocation(_program, "point_size"), point_size);
}

void Renderer::createProgram()
{
    std::string v_shader_source = loadShaderSource("shaders/render.vert");
    std::string f_shader_source = loadShaderSource("shaders/render.frag");
    GLuint vertex_shader = compileShader(GL_VERTEX_SHADER, v_shader_source.c_str());
    GLuint fragment_shader = compileShader(GL_FRAGMENT_SHADER, f_shader_source.c_str());
    _program = glCreateProgram();
    glAttachShader(_program, vertex_shader);
    glAttachShader(_program, fragment_shader);
    glLinkProgram(_program);
    glDeleteShader(vertex_shader);
    glDeleteShader(fragment_shader);
}

void Renderer::readResult()
{
    glReadPixels(0, 0, _render_width, _render_height, GL_RGBA, GL_UNSIGNED_BYTE, _output_buffer.data());
}

RenderResult Renderer::renderTriangles(int width, int height, int render_size, RenderData render_data)
{
    setSize(width, height);

    _c_min_x = *std::min_element(render_data._x, render_data._x + _size);
    _c_max_x = *std::max_element(render_data._x, render_data._x + _size);
    _c_min_y = *std::min_element(render_data._y, render_data._y + _size);
    _c_max_y = *std::max_element(render_data._y, render_data._y + _size);

    /*_c_min_x -= 0.01 * std::abs(_c_max_x - _c_min_x);
    _c_max_x += 0.01 * std::abs(_c_max_x - _c_min_x);
    _c_min_y -= 0.01 * std::abs(_c_max_y - _c_min_y);
    _c_max_y += 0.01 * std::abs(_c_max_y - _c_min_y);*/

    float ratio = std::abs(_c_max_y - _c_min_y) / std::abs(_c_max_x - _c_min_x);

    setRenderSize(render_size, ratio);

    fillBuffersTriangles(render_data);

    runTriangles();

    readResult();

    return {_output_buffer.data(), (size_t)_render_width, (size_t)_render_height};
}

RenderResult Renderer::renderLines(int width, int height, int num_points, int num_indices, int render_size, bool render_on_top, int line_size, RenderData render_data)
{
    setSize(width, height);

    if (!render_on_top)
    {
        _c_min_x = *std::min_element(render_data._x, render_data._x + num_points);
        _c_max_x = *std::max_element(render_data._x, render_data._x + num_points);
        _c_min_y = *std::min_element(render_data._y, render_data._y + num_points);
        _c_max_y = *std::max_element(render_data._y, render_data._y + num_points);

        float ratio = std::abs(_c_max_y - _c_min_y) / std::abs(_c_max_x - _c_min_x);

        setRenderSize(render_size, ratio);
    }

    fillBuffersLines(render_data, num_points, num_indices);

    runLines(num_indices, render_on_top, line_size);

    readResult();

    return {_output_buffer.data(), (size_t)_render_width, (size_t)_render_height};
}

void Renderer::runTriangles()
{
    glViewport(0, 0, _render_width, _render_height);
    glClearColor(1.0, 1.0, 1.0, 0.0);
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(_program);

    GLint pos_loc = glGetAttribLocation(_program, "aPos");
    GLint col_loc = glGetAttribLocation(_program, "aColor");

    glEnableVertexAttribArray(pos_loc);
    glVertexAttribPointer(pos_loc, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)0);

    glEnableVertexAttribArray(col_loc);
    glVertexAttribPointer(col_loc, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)(2 * sizeof(float)));

    // Render
    // glLineWidth(5);
    // glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
    glDrawElements(GL_TRIANGLES, (_width - 1) * (_height - 1) * 2 * 3, GL_UNSIGNED_INT, 0);
}

void Renderer::runPoints(int num_points, bool render_on_top)
{
    if (!render_on_top)
    {
        glViewport(0, 0, _render_width, _render_height);
        glClearColor(1.0, 1.0, 1.0, 0.0);
        glClear(GL_COLOR_BUFFER_BIT);
    }

    glUseProgram(_program);

    GLint pos_loc = glGetAttribLocation(_program, "aPos");
    GLint col_loc = glGetAttribLocation(_program, "aColor");

    glEnableVertexAttribArray(pos_loc);
    glVertexAttribPointer(pos_loc, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)0);

    glEnableVertexAttribArray(col_loc);
    glVertexAttribPointer(col_loc, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)(2 * sizeof(float)));

    // Render
    glEnable(GL_VERTEX_PROGRAM_POINT_SIZE);
    glDrawArrays(GL_POINTS, 0, num_points);
}

void Renderer::runLines(int num_indices, bool render_on_top, int line_size)
{
    if (!render_on_top)
    {
        glViewport(0, 0, _render_width, _render_height);
        glClearColor(1.0, 1.0, 1.0, 0.0);
        glClear(GL_COLOR_BUFFER_BIT);
    }

    glUseProgram(_program);

    GLint pos_loc = glGetAttribLocation(_program, "aPos");
    GLint col_loc = glGetAttribLocation(_program, "aColor");

    glEnableVertexAttribArray(pos_loc);
    glVertexAttribPointer(pos_loc, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)0);

    glEnableVertexAttribArray(col_loc);
    glVertexAttribPointer(col_loc, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void *)(2 * sizeof(float)));

    // Render
    glLineWidth(line_size);
    glDrawElements(GL_LINES, num_indices, GL_UNSIGNED_INT, 0);
}