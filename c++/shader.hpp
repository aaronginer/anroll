#pragma once

#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <assert.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <cstring>

GLFWwindow *initGLFWContext();
void destroyGLFWWindow(GLFWwindow *w);
void cleanupGPU();
void createBuffer(void *data, int size, int binding, GLuint buffer_name);
GLuint compileShader(GLenum type, const char *src);
std::string loadShaderSource(const std::string &filepath);