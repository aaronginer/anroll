#include "shader.hpp"

GLFWwindow *initGLFWContext()
{
    glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
    GLFWwindow *window = glfwCreateWindow(1, 1, "", nullptr, nullptr);
    if (!window)
    {
        assert(false && "Error initializing context.");
    }

    glfwMakeContextCurrent(window);

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        assert(false && "Error loading function pointers.");
    }

    return window;
}

void destroyGLFWWindow(GLFWwindow *w)
{
    if (w)
        glfwDestroyWindow(w);
}

void cleanupGPU()
{
    glfwTerminate();
}

void createBuffer(void *data, int size, int binding, GLuint buffer_name)
{
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, buffer_name);
    glBufferData(GL_SHADER_STORAGE_BUFFER, size, data, GL_DYNAMIC_COPY);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, binding, buffer_name);
}

std::string loadShaderSource(const std::string &filepath)
{
    std::ifstream file(filepath);
    if (!file.is_open())
    {
        std::cout << "Failed to open shader file: " << filepath << std::endl;
        exit(-1);
    }
    return std::string((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
}

GLuint compileShader(GLenum type, const char *src)
{
    GLuint shader = glCreateShader(type);
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);
    GLint success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success)
    {
        char log[512];
        glGetShaderInfoLog(shader, sizeof(log), nullptr, log);
        std::cerr << "Shader error: " << log << std::endl;
        exit(1);
    }
    return shader;
}