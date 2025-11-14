#include "gl_grid_mapper.hpp"

//********************************/
// GridMapper implementation

GridMapper::GridMapper()
{
    createProgram();
}

GridMapper::~GridMapper()
{
    glDeleteBuffers(NUM_BUFFERS_GRID, _buffers);
    glDeleteProgram(_program);
    if (_result != nullptr)
    {
        delete _result;
    }
}

void GridMapper::setSize(int width, int height)
{
    assert(width != 0 && "Called setSize with invalid width");

    if (width == _width && height == _height)
        return;

    if (_width != 0) // i.e. has been called at least once before
    {
        glDeleteBuffers(NUM_BUFFERS_GRID, _buffers);

        delete _result;
    }

    _width = width;
    _height = height;
    _size = width * height;

    initBuffers();
    _result = new GridMapResult(width, height);
}

void GridMapper::initBuffers()
{
    glGenBuffers(NUM_BUFFERS_GRID, _buffers);
    // x, y buffers (in order) (output)
    createBuffer(nullptr, _size * sizeof(float), 0, _buffers[0]);
    createBuffer(nullptr, _size * sizeof(float), 1, _buffers[1]);

    // MappingTables buffers (in order) (input)
    createBuffer(nullptr, _width * sizeof(float), 2, _buffers[2]);
    createBuffer(nullptr, _height * sizeof(float), 3, _buffers[3]);
    createBuffer(nullptr, _height * sizeof(float), 4, _buffers[4]);
    createBuffer(nullptr, _height * sizeof(float), 5, _buffers[5]);
}

void GridMapper::bindBuffers()
{
    for (int i = 0; i < NUM_BUFFERS_GRID; i++)
    {
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, i, _buffers[i]);
    }
}

void GridMapper::fillBuffers(MappingTables &mapping_tables)
{
    glNamedBufferSubData(_buffers[2], 0, _width * sizeof(float), mapping_tables._if_curve_integrals);
    glNamedBufferSubData(_buffers[3], 0, _height * sizeof(float), mapping_tables._x_a_x);
    glNamedBufferSubData(_buffers[4], 0, _height * sizeof(float), mapping_tables._a_x_y);
    glNamedBufferSubData(_buffers[5], 0, _height * sizeof(float), mapping_tables._linear_fit);
}

void GridMapper::readBuffers()
{
    glGetNamedBufferSubData(_buffers[0], 0, _size * sizeof(float), _result->_x);
    glGetNamedBufferSubData(_buffers[1], 0, _size * sizeof(float), _result->_y);
}

void GridMapper::fillUniforms(float arc_length, float interpolation_factor, float radius_modifier, float tilt, float crop_left, float crop_right)
{
    glUseProgram(_program);
    glUniform1ui(glGetUniformLocation(_program, "width"), _width);
    glUniform1ui(glGetUniformLocation(_program, "height"), _height);
    glUniform1f(glGetUniformLocation(_program, "a"), arc_length);
    glUniform1f(glGetUniformLocation(_program, "IF"), interpolation_factor);
    glUniform1f(glGetUniformLocation(_program, "rad_factor"), radius_modifier);
    glUniform1f(glGetUniformLocation(_program, "tilt"), tilt);
    glUniform1f(glGetUniformLocation(_program, "crop_left"), crop_left);
    glUniform1f(glGetUniformLocation(_program, "crop_right"), crop_right);
}

void GridMapper::createProgram()
{
    // map shader
    std::string shader_source = loadShaderSource("shaders/grid_map.comp");
    GLuint shader = compileShader(GL_COMPUTE_SHADER, shader_source.c_str());

    _program = glCreateProgram();
    glAttachShader(_program, shader);
    glLinkProgram(_program);
    glDeleteShader(shader);
}

void GridMapper::map(int width, int height, MappingTables &mapping_tables, float arc_length, float interpolation_factor,
                     float radius_modifier, float tilt, float crop_left, float crop_right)
{
    setSize(width, height);
    bindBuffers();
    fillBuffers(mapping_tables);
    fillUniforms(arc_length, interpolation_factor, radius_modifier, tilt, crop_left, crop_right);
    run();
    readBuffers();
}

void GridMapper::interpolate()
{
    _result->_r_x.clear();
    _result->_r_y.clear();
    _result->_r_l.clear();

    // horizontal lines
    int current_index = 0;
    for (int h = 0; h < _height; h++)
    {
        Eigen::MatrixXd points(2, _width);
        for (int w = 0; w < _width; w++)
        {
            int index = h * _width + w;
            points(0, w) = _result->_x[index];
            points(1, w) = _result->_y[index];
        }

        Eigen::Spline2d fitted_spline = Eigen::SplineFitting<Eigen::Spline2d>::Interpolate(points, 2);

        for (int v = 0; v < GRID_SUBDIVISIONS; v++)
        {
            Eigen::VectorXd p = fitted_spline((float)v / (GRID_SUBDIVISIONS - 1));
            _result->_r_x.push_back(p(0));
            _result->_r_y.push_back(p(1));
            if (v > 0) // add line indices
            {
                _result->_r_l.push_back(current_index - 1);
                _result->_r_l.push_back(current_index);
            }
            current_index++;
        }
    }

    // vertical lines
    for (int w = 0; w < _width; w++)
    {
        Eigen::MatrixXd points(2, _height);
        for (int h = 0; h < _height; h++)
        {
            int index = h * _width + w;
            points(0, h) = _result->_x[index];
            points(1, h) = _result->_y[index];
        }

        Eigen::Spline2d fitted_spline = Eigen::SplineFitting<Eigen::Spline2d>::Interpolate(points, 2);

        for (int v = 0; v < GRID_SUBDIVISIONS; v++)
        {
            Eigen::VectorXd p = fitted_spline((float)v / (GRID_SUBDIVISIONS - 1));
            _result->_r_x.push_back(p(0));
            _result->_r_y.push_back(p(1));
            if (v > 0) // add line indices
            {
                _result->_r_l.push_back(current_index - 1);
                _result->_r_l.push_back(current_index);
            }
            current_index++;
        }
    }
}

void GridMapper::run()
{
    glUseProgram(_program);
    GLuint groups_x = (_width + 15) / 16;
    GLuint groups_y = (_height + 15) / 16;
    glDispatchCompute(groups_x, groups_y, 1);
    glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
}