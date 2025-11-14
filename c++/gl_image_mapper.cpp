#include "gl_image_mapper.hpp"

//********************************/
// ImageMapper implementation

ImageMapper::ImageMapper()
{
    createProgram();

    // Generate Image texture (input)
    glGenTextures(1, &_image_tex);
    glBindTexture(GL_TEXTURE_2D, _image_tex);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
}

ImageMapper::~ImageMapper()
{
    glDeleteBuffers(NUM_BUFFERS_IMG, _buffers);
    glDeleteTextures(1, &_image_tex);
    glDeleteProgram(_program);

    if (_result != nullptr)
    {
        delete _result;
    }
}

void ImageMapper::setSize(int width, int height)
{
    assert(width != 0 && "Called setSize with invalid width");

    if (width == _width && height == _height)
        return;

    if (_width != 0) // i.e. has been called at least once before
    {
        glDeleteBuffers(NUM_BUFFERS_IMG, _buffers);
        delete _result;
    }

    _width = width;
    _height = height;
    _size = width * height;

    initBuffers();
    _result = new ImageMapResult(width, height);
}

void ImageMapper::initBuffers()
{
    glGenBuffers(NUM_BUFFERS_IMG, _buffers);
    // RenderData buffers (in order) (output)
    createBuffer(nullptr, _size * sizeof(float), 0, _buffers[0]);
    createBuffer(nullptr, _size * sizeof(float), 1, _buffers[1]);
    createBuffer(nullptr, _size * 3 * sizeof(float), 2, _buffers[2]);
    createBuffer(nullptr, _size * 2 * 3 * sizeof(unsigned int), 3, _buffers[3]);

    // MappingTables buffers (in order) (input)
    createBuffer(nullptr, _width * sizeof(float), 4, _buffers[4]);
    createBuffer(nullptr, _height * sizeof(float), 5, _buffers[5]);
    createBuffer(nullptr, _height * sizeof(float), 6, _buffers[6]);
    createBuffer(nullptr, _height * sizeof(float), 7, _buffers[7]);
}

void ImageMapper::bindBuffers()
{
    for (int i = 0; i < NUM_BUFFERS_IMG; i++)
    {
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, i, _buffers[i]);
    }
}

void ImageMapper::loadImageTexture(int width, int height, unsigned char *image)
{
    glBindTexture(GL_TEXTURE_2D, _image_tex);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, image);
}

void ImageMapper::fillBuffers(MappingTables &mapping_tables)
{
    glNamedBufferSubData(_buffers[4], 0, _width * sizeof(float), mapping_tables._if_curve_integrals);
    glNamedBufferSubData(_buffers[5], 0, _height * sizeof(float), mapping_tables._x_a_x);
    glNamedBufferSubData(_buffers[6], 0, _height * sizeof(float), mapping_tables._a_x_y);
    glNamedBufferSubData(_buffers[7], 0, _height * sizeof(float), mapping_tables._linear_fit);
}

void ImageMapper::readBuffers()
{
    glGetNamedBufferSubData(_buffers[0], 0, _size * sizeof(float), _result->_x);
    glGetNamedBufferSubData(_buffers[1], 0, _size * sizeof(float), _result->_y);
    glGetNamedBufferSubData(_buffers[2], 0, _size * 3 * sizeof(float), _result->_c);
    glGetNamedBufferSubData(_buffers[3], 0, _size * 2 * 3 * sizeof(unsigned int), _result->_t);
}

void ImageMapper::fillUniforms(float arc_length, float interpolation_factor, float radius_modifier, float image_rotation, float vertical_shift, float tilt, float crop_bottom, float crop_top, float crop_left, float crop_right)
{
    glUseProgram(_program);
    glUniform1ui(glGetUniformLocation(_program, "width"), _width);
    glUniform1ui(glGetUniformLocation(_program, "height"), _height);
    glUniform1f(glGetUniformLocation(_program, "a"), arc_length);
    glUniform1f(glGetUniformLocation(_program, "IF"), interpolation_factor);
    glUniform1f(glGetUniformLocation(_program, "rad_factor"), radius_modifier);
    glUniform1f(glGetUniformLocation(_program, "image_rotation_x"), image_rotation);
    glUniform1f(glGetUniformLocation(_program, "vertical_shift"), vertical_shift);
    glUniform1f(glGetUniformLocation(_program, "tilt"), tilt);
    glUniform1f(glGetUniformLocation(_program, "crop_bottom"), crop_bottom);
    glUniform1f(glGetUniformLocation(_program, "crop_top"), crop_top);
    glUniform1f(glGetUniformLocation(_program, "crop_left"), crop_left);
    glUniform1f(glGetUniformLocation(_program, "crop_right"), crop_right);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, _image_tex);
    glUniform1i(glGetUniformLocation(_program, "input_image"), 0);
}

void ImageMapper::createProgram()
{
    // map shader
    std::string shader_source = loadShaderSource("shaders/image_map.comp");
    GLuint shader = compileShader(GL_COMPUTE_SHADER, shader_source.c_str());

    _program = glCreateProgram();
    glAttachShader(_program, shader);
    glLinkProgram(_program);
    glDeleteShader(shader);
}

void ImageMapper::map(int width, int height, MappingTables &mapping_tables, float arc_length, float interpolation_factor, float radius_modifier,
                      float image_rotation, float vertical_shift, float tilt, float crop_bottom, float crop_top, float crop_left, float crop_right)
{
    setSize(width, height);
    bindBuffers();
    fillBuffers(mapping_tables);
    fillUniforms(arc_length, interpolation_factor, radius_modifier, image_rotation, vertical_shift, tilt, crop_bottom, crop_top, crop_left, crop_right);
    run();
    readBuffers();
}

void ImageMapper::run()
{
    glUseProgram(_program);
    GLuint groups_x = (_width + 15) / 16;
    GLuint groups_y = (_height + 15) / 16;
    glDispatchCompute(groups_x, groups_y, 1);
    glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
}