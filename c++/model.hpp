#ifndef MODEL_H
#define MODEL_H

#include <vector>
#include <functional>
#include <boost/json.hpp>

#include "util.hpp"
#include "unsupported/Eigen/Splines"
#include "alglib-cpp/src/interpolation.h"

#include "shader.hpp"
#include "gl_image_mapper.hpp"
#include "gl_grid_mapper.hpp"
#include "cpu_error_mapper.hpp"
#include "gl_renderer.hpp"

#include "ifcurve.hpp"

#define INVALID_MODEL_PARAM -1

class Bounds
{
public:
    Bounds() = default;

    void setBounds(float lower, float upper)
    {
        _lower = lower;
        _upper = upper;
    }

    void setLowerBound(float lower)
    {
        _lower = lower;
    }

    void setUpperBound(float upper)
    {
        _upper = upper;
    }

    float interp(float x)
    {
        return _lower + (_upper - _lower) * x;
    }

    float _lower;
    float _upper;
};

template <typename T>
class ModelPublicProperty
{
public:
    ModelPublicProperty(const T &value) : _value(value) {}

    operator const T &() const
    {
        return _value;
    }

    void setValue(std::pair<const T, bool> new_value)
    {
        if (new_value.second && new_value.first != _value)
        {
            _value = new_value.first;
            _has_changed = true;
            if (_observer)
            {
                _observer(_value);
            }
        }
    }

    void setValueForce(const T new_value)
    {
        _value = new_value;
    }

    void on_change(const std::function<void(const T &new_value)> fun)
    {
        _observer = fun;
    }

    bool hasChanged()
    {
        if (_has_changed)
        {
            _has_changed = false;
            return true;
        }
        return false;
    }

private:
    T _value;
    bool _has_changed = false;
    std::function<void(const T &new_value)> _observer;
};

class ModelPublicProperties
{
public:
    ModelPublicProperties() = default;

    ModelPublicProperty<float> _interpolation_factor = 0.5f;
    ModelPublicProperty<float> _d_factor = 0.5f;
    ModelPublicProperty<bool> _d_restrict = true;
    ModelPublicProperty<float> _radius_modifier = 3.14f;
    ModelPublicProperty<bool> _optimize_active = false;
    ModelPublicProperty<int> _optimize_max_iterations = 1000;
    ModelPublicProperty<float> _opt_xerror_weight = 1;
    ModelPublicProperty<float> _opt_yerror_weight = 1;
    ModelPublicProperty<float> _opt_rerror_weight = 1;
    ModelPublicProperty<float> _opt_aerror_weight = 1;
    ModelPublicProperty<bool> _optimize_interpolation_factor = false;
    ModelPublicProperty<bool> _optimize_d_factor = false;
    ModelPublicProperty<bool> _optimize_radius_modifier = false;
    ModelPublicProperty<float> _tilt = 0;
    ModelPublicProperty<float> _image_rotation = 0.f;
    ModelPublicProperty<float> _vertical_shift = 0.f;
    ModelPublicProperty<float> _preview_image_scale = 1.f;
    ModelPublicProperty<float> _crop_top = 0.f;
    ModelPublicProperty<float> _crop_bottom = 0.f;
    ModelPublicProperty<float> _crop_right = 0.f;
    ModelPublicProperty<float> _crop_left = 0.f;
    ModelPublicProperty<int> _grid_x = 15;
    ModelPublicProperty<int> _grid_y = 15;
    ModelPublicProperty<bool> _grid_active = false;
    ModelPublicProperty<bool> _grid_alp = false;
    ModelPublicProperty<int> _grid_thickness = 1;
    ModelPublicProperty<bool> _image_active = true;
    ModelPublicProperty<bool> _enforce_isotropy = false;
    ModelPublicProperty<bool> _generate_error_maps = false;
    ModelPublicProperty<float> _error_map_quality = 1.f;
    ModelPublicProperty<bool> _errors_use_gpu = false;
    ModelPublicProperty<bool> _plot_interpolation = false;
    ModelPublicProperty<bool> _plot_ifcurve = false;
    ModelPublicProperty<float> _spline_smoothing = 0.000001f; // 1e-06 min value currently
    ModelPublicProperty<int> _render_max_res = 1000;
};

class Model
{
public:
    Model(std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y);
    ~Model();

    void createSplines(float smoothing);

    void setImage(unsigned char *image, int width, int height);
    void cropTop(float amount);
    void cropBottom(float amount);
    void linearFit();
    float getEFHeight(float h_a);

    void setupMappingTables(int width, int height, MappingTables &mapping_tablesm, bool alp = false);
    void setupErrorMappingTables(int width, int height, MappingTables &mapping_tables);

    RenderResult renderImage();
    RenderResult renderError(int error_type);
    RenderResult renderGrid();

    void mapImage(int width, int height);
    void mapErrors();
    void mapGrid(int width, int height);

    void registerObservers();
    void updateState();
    bool checkPropertiesValid();
    void updateBetaBounds();

    void optimizeParameters();

    boost::json::object getInterpolationPlotData();
    boost::json::object getIFCurvePlotData();
    boost::json::object getParameterFeedback();

    ModelPublicProperties &getModelPublicProperties()
    {
        return _public_properties;
    }

    ErrorMapper *getCPUErrorMapper()
    {
        return _error_mapper;
    }

    IFCurve *getIFCurve()
    {
        return _ifcurve;
    }

    Vec4 getCirclePoint(double r, Vec4 cp, double arc_offset);
    double getRadiusIF(float h_a, double cIF);
    Vec4 mapPoint(double x, double y);

private:
    // ************* static members
    std::vector<float> _x;   // samples of the z-height of the input mask
    std::vector<float> _a_x; // samples of the arc-length of the input mask (same z-height as _x)
    std::vector<float> _y;   // corresponding radii

    float _height;
    float _arc_length;

    alglib::spline1dinterpolant _a_x_y_spline; // mapping from arc-length to radius
    alglib::spline1dinterpolant _x_a_x_spline; // mapping from z-height to arc-length

    unsigned char *_image;
    int _image_width, _image_height;

    ImageMapper *_image_mapper = nullptr;
    GridMapper *_grid_mapper = nullptr;
    ErrorMapper *_error_mapper = nullptr;
    Renderer *_renderer = nullptr;
    IFCurve *_ifcurve = nullptr;

    // ************* dynamic members
    Bounds _x_bounds;
    Bounds _a_x_bounds;

    float _slope;     // contour linear fit slope
    float _intercept; // contour linear fit intercept

    ModelPublicProperties _public_properties;
    bool _remap_image = false;
    bool _remap_grid = false;
    bool _remap_errors = false;

    boost::json::object _parameter_feedback;
};

#endif // MODEL_