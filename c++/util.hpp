#ifndef UTIL_H
#define UTIL_H

#include <boost/json.hpp>

#define CHANNELS 4
#define GRID_SUBDIVISIONS 100
#define M_PI 3.14159265358979323846
#define JITTER 0.001f

//********************************/
// Mapping and Rendering Utility

class MappingTables
{
public:
    MappingTables(int width, int height)
    {
        _if_curve_integrals = new float[width];
        _x_a_x = new float[height];
        _a_x_y = new float[height];
        _linear_fit = new float[height];
    }

    ~MappingTables()
    {
        delete[] _if_curve_integrals;
        delete[] _x_a_x;
        delete[] _a_x_y;
        delete[] _linear_fit;
    }

    float *_if_curve_integrals;
    float *_x_a_x;
    float *_a_x_y;
    float *_linear_fit;
};

typedef struct RenderData
{
    float *_x;
    float *_y;
    float *_c;
    unsigned int *_t;
} __RenderData__;

//********************************/
// ChatGPT generated Vec4
struct Vec4
{
    double r, g, b, a;

    Vec4() : r(0), g(0), b(0), a(0) {}
    Vec4(double r = 0, double g = 0, double b = 0, double a = 0) : r(r), g(g), b(b), a(a) {}

    Vec4 operator*(double scalar) const
    {
        return Vec4(r * scalar, g * scalar, b * scalar, a * scalar);
    }

    Vec4 operator+(const Vec4 &other) const
    {
        return Vec4(r + other.r, g + other.g, b + other.b, a + other.a);
    }

    Vec4 operator-(const Vec4 &other) const
    {
        return Vec4(r - other.r, g - other.g, b - other.b, a - other.a);
    }

    Vec4 normalize() const
    {
        double len = length();
        if (len == 0)
            return Vec4(0, 0, 0, 0);
        return Vec4(r / len, g / len, b / len, a / len);
    }

    static double dot(const Vec4 &a, const Vec4 &b)
    {
        return a.r * b.r + a.g * b.g + a.b * b.b + a.a * b.a;
    }

    double length() const
    {
        return std::sqrt(std::pow(r, 2) + std::pow(g, 2) + std::pow(b, 2) + std::pow(a, 2));
    }

    static double distance(const Vec4 &a, const Vec4 &b)
    {
        return (a - b).length();
    }
};

//********************************/
// Mask Loading
void loadMaskFile(std::string folder_path, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y);
void loadMaskRaw(unsigned char *image_raw, int length, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y);
void loadMask(unsigned char *img, int width, int height, std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y);

//********************************/
// JSON parsing
std::pair<float, bool> getJsonFloat(const boost::json::value &val);
std::pair<int, bool> getJsonInt(const boost::json::value &val);
std::pair<bool, bool> getJsonBool(const boost::json::value &val);

//********************************/
// Utility functions
void linspace(std::vector<float> &result, float start, float end, int n);

template <typename T>
T mix(const T &a, const T &b, double t)
{
    return a * (1.0 - t) + b * t;
}

Vec4 getErrorColor(double t);

void debug(const char *message);

#endif // UTIL_H