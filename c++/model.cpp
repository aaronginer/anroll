#include "model.hpp"
#include <iostream>
#include <algorithm>
#include <fstream>

#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <chrono>

#include <boost/math/statistics/linear_regression.hpp>
#include <boost/math/quadrature/gauss.hpp>
#include <boost/math/quadrature/tanh_sinh.hpp>
#include <boost/math/quadrature/gauss_kronrod.hpp>
#include <boost/math/quadrature/trapezoidal.hpp>

using namespace boost::math::quadrature;
using namespace boost::math::statistics;

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include <stb_image_write.h>

#define STB_IMAGE_RESIZE_IMPLEMENTATION
#include "stb_image_resize2.h"

#include "stb_image.h"

#include "timer.hpp"

#define CHANNELS 4

Model::Model(std::vector<float> &x, std::vector<float> &a_x, std::vector<float> &y)
    : _x(x), _a_x(a_x), _y(y)
{
    _height = _x[_x.size() - 1];
    _arc_length = _a_x[_a_x.size() - 1];

    _x_bounds.setBounds(0, _height);
    _a_x_bounds.setBounds(0, _arc_length);

    createSplines(_public_properties._spline_smoothing);

    linearFit();

    _image_mapper = new ImageMapper();
    _error_mapper = new ErrorMapper();
    _grid_mapper = new GridMapper();
    _renderer = new Renderer();
    _ifcurve = new IFCurve(_public_properties._d_factor, _public_properties._interpolation_factor);

    registerObservers();
}

Model::~Model()
{
    if (_image != nullptr)
    {
        stbi_image_free(_image);
    }

    delete _image_mapper;
    delete _grid_mapper;
    delete _error_mapper;
    delete _renderer;
    delete _ifcurve;
}

void Model::createSplines(float smoothing)
{

    alglib::spline1dfitreport report;
    alglib::real_1d_array x, a_x, y;
    std::vector<double> x_double(_x.begin(), _x.end());
    std::vector<double> a_x_double(_a_x.begin(), _a_x.end());
    std::vector<double> y_double(_y.begin(), _y.end());

    x.setcontent(_x.size(), x_double.data());
    a_x.setcontent(_a_x.size(), a_x_double.data());
    y.setcontent(_y.size(), y_double.data());

    alglib::spline1dbuildmonotone(x, a_x, _x_a_x_spline);
    size_t num_knots = std::max(4, (int)_a_x.size() / 2);
    alglib::spline1dfit(a_x, y, num_knots, double(smoothing), _a_x_y_spline, report);
}

void Model::setImage(unsigned char *image, int width, int height)
{
    assert(image != nullptr);

    _image = image;
    _image_width = width;
    _image_height = height;

    _image_mapper->loadImageTexture(_image_width, _image_height, _image);
}

void Model::cropTop(float amount)
{
    // this is reversed because of how the mask data is stored
    float tmp = _height * amount;
    _x_bounds.setLowerBound(tmp);
    _a_x_bounds.setLowerBound(alglib::spline1dcalc(_x_a_x_spline, tmp));
}

void Model::cropBottom(float amount)
{
    // this is reversed because of how the mask data is stored
    float tmp = _height * (1 - amount);
    _x_bounds.setUpperBound(tmp);
    _a_x_bounds.setUpperBound(alglib::spline1dcalc(_x_a_x_spline, tmp));
}

#define LIN_FIT_SAMPLES 30
void Model::linearFit()
{
    std::vector<float> tmp_a_x;
    linspace(tmp_a_x, _a_x_bounds._lower, _a_x_bounds._upper, LIN_FIT_SAMPLES);

    std::vector<float> tmp_y;
    std::transform(tmp_a_x.begin(), tmp_a_x.end(), std::back_inserter(tmp_y), [this](float value)
                   { return alglib::spline1dcalc(_a_x_y_spline, value); });

    std::tie(_intercept, _slope) = simple_ordinary_least_squares(tmp_a_x, tmp_y);
}

// directly calculate the adjusted h_a based on the integral the spline is based on
float Model::getEFHeight(float h_a)
{
    float if_0 = (*_ifcurve)(0);
    auto x_distortion = [this, if_0](float h_a) -> float
    {
        float r_contour = alglib::spline1dcalc(_a_x_y_spline, h_a);
        float r_linear = _slope * h_a + _intercept;
        float circ_interp = (r_linear + (r_contour - r_linear) * if_0) * 2 * M_PI;
        float circ_real = r_contour * 2 * M_PI;
        return circ_interp / circ_real;
    };

    boost::math::quadrature::gauss_kronrod<float, 61> integrator;

    float tol = 1e-10;
    return integrator.integrate(x_distortion, 0.0, h_a, tol);
}

void Model::setupMappingTables(int width, int height, MappingTables &mapping_tables, bool alp) // arc-length-parametrized (y uniformity)
{
    for (int w = 0; w < width; w++)
    {
        float x = mix(float(_public_properties._crop_left), float(1 - _public_properties._crop_right), (double)w / (width - 1));
        x = (x - 0.5) * 2; // map to [-1, 1]
        mapping_tables._if_curve_integrals[w] = _ifcurve->getFunction()->integrate(0, abs(x));
    }

    for (int h = 0; h < height; h++)
    {
        float y = (float)h / (height - 1);
        float h_z = _x_bounds.interp(y);
        float h_a = alp ? _a_x_bounds.interp(y) : alglib::spline1dcalc(_x_a_x_spline, h_z);

        mapping_tables._a_x_y[h] = alglib::spline1dcalc(_a_x_y_spline, h_a);
        mapping_tables._linear_fit[h] = _slope * h_a + _intercept;

        if (_public_properties._enforce_isotropy) // modify h_a based on the x-error at x=0 and height h
        {
            mapping_tables._x_a_x[h] = getEFHeight(h_a);
        }
        else
        {
            mapping_tables._x_a_x[h] = h_a;
        }
    }
}

// modified version of the standard mapping table to include an extra jittered values for each point in both directions
// the jittered values lead to jittered points which are used to calculated the errors
// !!!!! requires mapping tables 2 times the size !!!!!
void Model::setupErrorMappingTables(int width, int height, MappingTables &mapping_tables)
{
    for (int w = 0; w < width; w++)
    {
        int index_center = w * 2;

        float x_center = mix(float(_public_properties._crop_left), float(1 - _public_properties._crop_right), (double)w / (width - 1));
        x_center = (x_center - 0.5) * 2; // map to [-1, 1]
        float x_jittered = x_center + (x_center < 0 ? JITTER : -JITTER);

        mapping_tables._if_curve_integrals[index_center] = _ifcurve->getFunction()->integrate(0, abs(x_center));
        mapping_tables._if_curve_integrals[index_center + 1] = _ifcurve->getFunction()->integrate(0, abs(x_jittered));
    }

    for (int h = 0; h < height; h++)
    {
        int index_center = h * 2;

        float y = (float)h / (height - 1);
        float h_z = _x_bounds.interp(y);

        float h_a_center = alglib::spline1dcalc(_x_a_x_spline, h_z);
        float h_a_bottom = h_a_center + JITTER * _arc_length;

        mapping_tables._a_x_y[index_center] = alglib::spline1dcalc(_a_x_y_spline, h_a_center);
        mapping_tables._linear_fit[index_center] = _slope * h_a_center + _intercept;

        mapping_tables._a_x_y[index_center + 1] = alglib::spline1dcalc(_a_x_y_spline, h_a_bottom);
        mapping_tables._linear_fit[index_center + 1] = _slope * h_a_bottom + _intercept;

        if (_public_properties._enforce_isotropy) // modify h_a based on the x-error at x=0 and height h
        {
            mapping_tables._x_a_x[index_center] = getEFHeight(h_a_center);
            mapping_tables._x_a_x[index_center + 1] = getEFHeight(h_a_bottom);
        }
        else
        {
            mapping_tables._x_a_x[index_center] = h_a_center;
            mapping_tables._x_a_x[index_center + 1] = h_a_bottom;
        }
    }
}

void Model::registerObservers()
{
    _public_properties._interpolation_factor.on_change([this](const float interpolation_factor)
                                                       { _ifcurve->setInterpolationFactor(interpolation_factor); });
    _public_properties._d_factor.on_change([this](const float d_factor)
                                           { _ifcurve->setDFactor(d_factor); });
    _public_properties._crop_top.on_change([this](const float crop_top)
                                           { cropTop(crop_top); });
    _public_properties._crop_bottom.on_change([this](const float crop_bottom)
                                              { cropBottom(crop_bottom); });
    _public_properties._spline_smoothing.on_change([this](const float spline_smoothing)
                                                   { createSplines(spline_smoothing); });
}

// IMPORTANT: This function has to be called before rendering!!!!
// update state based on changed properties before running calculations
void Model::updateState()
{
    bool radius_modifier_c = _public_properties._radius_modifier.hasChanged();
    bool tilt_c = _public_properties._tilt.hasChanged();
    bool optimize_active_c = _public_properties._optimize_active.hasChanged();
    bool optimize_max_iterations_c = _public_properties._optimize_max_iterations.hasChanged();
    bool optimize_xerror_weight_c = _public_properties._opt_xerror_weight.hasChanged();
    bool optimize_yerror_weight_c = _public_properties._opt_yerror_weight.hasChanged();
    bool optimize_rerror_weight_c = _public_properties._opt_rerror_weight.hasChanged();
    bool optimize_aerror_weight_c = _public_properties._opt_aerror_weight.hasChanged();
    bool optimize_interpolation_factor_c = _public_properties._optimize_interpolation_factor.hasChanged();
    bool optimize_d_factor_c = _public_properties._optimize_d_factor.hasChanged();
    bool optimize_radius_modifier_c = _public_properties._optimize_radius_modifier.hasChanged();
    bool preview_image_scale_c = _public_properties._preview_image_scale.hasChanged();
    bool image_rotation_c = _public_properties._image_rotation.hasChanged();
    bool vertical_shift_c = _public_properties._vertical_shift.hasChanged();
    bool grid_x_c = _public_properties._grid_x.hasChanged();
    bool grid_y_c = _public_properties._grid_y.hasChanged();
    bool grid_active_c = _public_properties._grid_active.hasChanged();
    bool grid_alp_c = _public_properties._grid_alp.hasChanged();
    bool grid_thickness_c = _public_properties._grid_thickness.hasChanged();
    bool image_active_c = _public_properties._image_active.hasChanged();
    bool generate_error_maps_c = _public_properties._generate_error_maps.hasChanged();
    bool error_map_quality_c = _public_properties._error_map_quality.hasChanged();
    bool errors_use_gpu_c = _public_properties._errors_use_gpu.hasChanged();
    bool plot_interpolation_c = _public_properties._plot_interpolation.hasChanged();
    bool plot_ifcurve_c = _public_properties._plot_ifcurve.hasChanged();
    bool crop_bottom_c = _public_properties._crop_bottom.hasChanged();
    bool crop_top_c = _public_properties._crop_top.hasChanged();
    bool crop_left_c = _public_properties._crop_left.hasChanged();
    bool crop_right_c = _public_properties._crop_right.hasChanged();
    bool enforce_isotropy_c = _public_properties._enforce_isotropy.hasChanged();
    bool interp_factor_c = _public_properties._interpolation_factor.hasChanged();
    bool d_factor_c = _public_properties._d_factor.hasChanged();
    bool d_restrict_c = _public_properties._d_restrict.hasChanged();
    bool spline_smoothing_c = _public_properties._spline_smoothing.hasChanged();
    bool render_max_res_c = _public_properties._render_max_res.hasChanged();

    // set remap flags based on changed properties
    bool remap_all_required = interp_factor_c || d_factor_c || d_restrict_c || radius_modifier_c || optimize_active_c || optimize_max_iterations_c || optimize_xerror_weight_c || optimize_yerror_weight_c || optimize_rerror_weight_c || optimize_aerror_weight_c || optimize_interpolation_factor_c || optimize_d_factor_c || tilt_c || preview_image_scale_c || crop_bottom_c || crop_top_c || crop_left_c || crop_right_c || enforce_isotropy_c || spline_smoothing_c || render_max_res_c;

    bool d_value_update_required = interp_factor_c || crop_top_c || crop_bottom_c || d_restrict_c;

    _remap_image = remap_all_required || image_rotation_c || vertical_shift_c;
    _remap_grid = remap_all_required || grid_x_c || grid_y_c || grid_thickness_c || grid_alp_c || grid_active_c;
    _remap_errors = remap_all_required || error_map_quality_c || errors_use_gpu_c || generate_error_maps_c;

    // refit linear regression line if crop parameters have changed
    if (crop_bottom_c || crop_top_c)
    {
        linearFit();
    }

    // update beta_U bounds - appendix A in the paper
    if (d_value_update_required)
    {
        updateBetaBounds();
    }

    if (remap_all_required && _public_properties._optimize_active &&
        (_public_properties._optimize_interpolation_factor || _public_properties._optimize_d_factor || _public_properties._optimize_radius_modifier))
    {
        optimizeParameters();
    }
}

// update beta_U bounds - appendix A in the paper
void Model::updateBetaBounds()
{
    int samples = int((float)_image_height * _public_properties._preview_image_scale * (1 - (_public_properties._crop_top + _public_properties._crop_bottom)));
    float global_min = -INFINITY;
    float global_max = INFINITY;
    for (int h = 0; h < samples; h++)
    {
        float y = (float)h / (samples - 1);
        float h_z = _x_bounds.interp(y);
        float h_a = alglib::spline1dcalc(_x_a_x_spline, h_z);

        float b0 = -(_slope * h_a + _intercept) / (alglib::spline1dcalc(_a_x_y_spline, h_a) - (_slope * h_a + _intercept));
        float b1 = (3 * _public_properties._interpolation_factor) / 2 + ((_slope * h_a + _intercept) / (2 * (alglib::spline1dcalc(_a_x_y_spline, h_a) - (_slope * h_a + _intercept))));

        float upper = b0 > b1 ? b0 : b1;
        float lower = b0 < b1 ? b0 : b1;

        // additionally restrict to 0 <= A_IF(1), AF_(0) <= 1
        if (_public_properties._d_restrict)
        {
            float b0_restricted = std::max(0.0f, (3 * _public_properties._interpolation_factor - 1) / 2);
            float b1_restricted = std::min(1.0f, (3 * _public_properties._interpolation_factor) / 2);

            lower = std::max(lower, b0_restricted);
            upper = std::min(upper, b1_restricted);
        }

        if (global_min < lower)
        {
            global_min = lower;
        }
        if (global_max > upper)
        {
            global_max = upper;
        }
    }
    _ifcurve->setDBounds(global_min, global_max);
    _parameter_feedback["D_LOW"] = global_min;
    _parameter_feedback["D_HIGH"] = global_max;
}

// check if specific properties are invalid before running calculations
bool Model::checkPropertiesValid()
{
    // if the total crop exceeds the limit of 0.95 dont run calculations for this package (can happen due to client-side race-conditions)
    if (_public_properties._crop_bottom + _public_properties._crop_top > 0.951)
    {
        std::cout << "Crop bottom + top exceeds limit of 0.951, not running calculations.\n Values: " << _public_properties._crop_bottom << " + " << _public_properties._crop_top << "\n";
        return false;
    }
    if (_public_properties._crop_left + _public_properties._crop_right > 0.951)
    {
        std::cout << "Crop left + right exceeds limit of 0.951, not running calculations.\n Values: " << _public_properties._crop_left << " + " << _public_properties._crop_right << "\n";
        return false;
    }

    return true;
}

RenderResult Model::renderImage()
{
    int width = int((float)_image_width * _public_properties._preview_image_scale * (1 - (_public_properties._crop_left + _public_properties._crop_right)));
    int height = int((float)_image_height * _public_properties._preview_image_scale * (1 - (_public_properties._crop_top + _public_properties._crop_bottom)));

    mapImage(width, height);
    return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _image_mapper->_result->getRenderData());
}

#define ERROR_DIMS 500.f
RenderResult Model::renderError(int error_type)
{
    int width = (int)(ERROR_DIMS * _public_properties._error_map_quality);
    int height = (int)(ERROR_DIMS * _public_properties._error_map_quality);

    switch (error_type)
    {
    case 0:
        return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _error_mapper->_result->getRenderDataXError());
        break;
    case 1:
        return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _error_mapper->_result->getRenderDataYError());
        break;
    case 2:
        return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _error_mapper->_result->getRenderDataXYError());
        break;
    case 3:
        return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _error_mapper->_result->getRenderDataRError());
        break;
    case 4:
        return _renderer->renderTriangles(width, height, _public_properties._render_max_res, _error_mapper->_result->getRenderDataAError());
        break;
    default:
        assert(false);
    }
}

RenderResult Model::renderGrid()
{
    mapGrid(_public_properties._grid_x, _public_properties._grid_y);

    return _renderer->renderLines(_public_properties._grid_x, _public_properties._grid_y, _grid_mapper->_result->_r_x.size(), _grid_mapper->_result->_r_l.size(),
                                  _public_properties._render_max_res, _public_properties._image_active,
                                  _public_properties._grid_thickness, _grid_mapper->_result->getRenderData());
}

void Model::mapImage(int width, int height)
{
    if (_remap_image)
    {
        MappingTables image_mapping_tables(width, height);
        setupMappingTables(width, height, image_mapping_tables);
        _image_mapper->map(width, height, image_mapping_tables, _arc_length, _public_properties._interpolation_factor, _public_properties._radius_modifier, _public_properties._image_rotation, _public_properties._vertical_shift, _public_properties._tilt, _public_properties._crop_bottom, _public_properties._crop_top, _public_properties._crop_left, _public_properties._crop_right);
    }
    _remap_image = false;
}

void Model::mapGrid(int width, int height)
{
    if (_remap_grid)
    {
        MappingTables grid_mapping_tables(width, height);
        setupMappingTables(width, height, grid_mapping_tables, _public_properties._grid_alp);
        _grid_mapper->map(width, height, grid_mapping_tables, _arc_length, _public_properties._interpolation_factor, _public_properties._radius_modifier, _public_properties._tilt, _public_properties._crop_left, _public_properties._crop_right);
        _grid_mapper->interpolate();
    }
    _remap_grid = false;
}

void Model::mapErrors()
{
    if (_remap_errors)
    {
        int width = (int)(ERROR_DIMS * _public_properties._error_map_quality);
        int height = (int)(ERROR_DIMS * _public_properties._error_map_quality);

        MappingTables error_mapping_tables(width * 2, height * 2);
        setupErrorMappingTables(width, height, error_mapping_tables);
        _error_mapper->map(width, height, &error_mapping_tables, _arc_length, _public_properties._interpolation_factor, _public_properties._radius_modifier, _public_properties._tilt, _public_properties._crop_left, _public_properties._crop_right);
    }
    _remap_errors = false;
}

struct ParamOptData
{
    Model *_model;
    MappingTables *_mapping_tables;
    int if_index;
    int d_index;
    int rad_index;
};
#define OPTIMIZATION_DIMS 100
void Model::optimizeParameters()
{
    MappingTables error_mapping_tables(OPTIMIZATION_DIMS * 2, OPTIMIZATION_DIMS * 2);
    setupErrorMappingTables(OPTIMIZATION_DIMS, OPTIMIZATION_DIMS, error_mapping_tables);
    auto objective = [](const std::vector<double> &x, std::vector<double> &grad, void *data) -> double
    {
        ParamOptData *opt_data = static_cast<ParamOptData *>(data);
        Model *m = opt_data->_model;
        MappingTables *mapping_tables = opt_data->_mapping_tables;

        // determine values for IF, dFactor, radFactor based on optimization flags
        // update the ifcurve if necessary
        float interpolation_factor = m->_public_properties._interpolation_factor;
        float d_factor = m->_public_properties._d_factor;
        float radius_modifier = m->_public_properties._radius_modifier;
        if (m->_public_properties._optimize_interpolation_factor)
        {
            interpolation_factor = x[opt_data->if_index];
            m->_public_properties._interpolation_factor.setValue({float(interpolation_factor), true});
            m->updateBetaBounds();
        }
        if (m->_public_properties._optimize_d_factor)
        {
            d_factor = x[opt_data->d_index];
            m->_public_properties._d_factor.setValue({float(d_factor), true});
            m->_ifcurve->setDFactor(d_factor);
        }
        if (m->_public_properties._optimize_radius_modifier)
        {
            radius_modifier = x[opt_data->rad_index];
            m->_public_properties._radius_modifier.setValue({float(radius_modifier), true});
        }
        // recompute mapping tables if necessary
        if (m->_public_properties._optimize_interpolation_factor || m->_public_properties._optimize_d_factor)
        {
            m->setupErrorMappingTables(OPTIMIZATION_DIMS, OPTIMIZATION_DIMS, *mapping_tables);
        }

        m->_error_mapper->map(OPTIMIZATION_DIMS, OPTIMIZATION_DIMS, mapping_tables, m->_arc_length, interpolation_factor, radius_modifier, m->_public_properties._tilt, m->_public_properties._crop_left, m->_public_properties._crop_right);
        double error = 0.0;
        for (int i = 0; i < OPTIMIZATION_DIMS * OPTIMIZATION_DIMS; i++)
        {
            error += m->_error_mapper->_result->getWeightedError(i, {m->_public_properties._opt_xerror_weight, m->_public_properties._opt_yerror_weight, m->_public_properties._opt_rerror_weight, m->_public_properties._opt_aerror_weight});
        }
        return error;
    };

    int dimensions = _public_properties._optimize_interpolation_factor + _public_properties._optimize_d_factor + _public_properties._optimize_radius_modifier;
    std::vector<double> upper_bounds;
    std::vector<double> lower_bounds;
    std::vector<double> initial_values;
    std::vector<double> x_tol;

    if (_public_properties._optimize_interpolation_factor)
    {
        upper_bounds.push_back(1.0f);
        lower_bounds.push_back(0.0f);
        initial_values.push_back(0.5f);
    }
    if (_public_properties._optimize_d_factor)
    {
        upper_bounds.push_back(1.0f);
        lower_bounds.push_back(0.0f);
        initial_values.push_back(0.5f);
    }
    // do not optimize radius if target is x-error (no impact)
    if (_public_properties._optimize_radius_modifier)
    {
        upper_bounds.push_back(_slope < 0 ? 0.5 : 500);
        lower_bounds.push_back(_slope < 0 ? -500 : 0.5);
        initial_values.push_back(_slope < 0 ? -M_PI : M_PI);
    }

    int index_of_if = -1 + _public_properties._optimize_interpolation_factor;
    int index_of_d = index_of_if + _public_properties._optimize_d_factor;
    int index_of_radius_modifier = index_of_d + _public_properties._optimize_radius_modifier;
    ParamOptData optData = {this, &error_mapping_tables, index_of_if, index_of_d, index_of_radius_modifier};

    nlopt::opt global(dimensions == 1 ? nlopt::GN_DIRECT : nlopt::GN_MLSL, dimensions);
    global.set_min_objective(objective, (void *)&optData);
    global.set_maxeval(_public_properties._optimize_max_iterations);
    global.set_maxtime(10);
    global.set_upper_bounds(upper_bounds);
    global.set_lower_bounds(lower_bounds);
    if (dimensions > 1)
    {
        nlopt::opt local(nlopt::LN_BOBYQA, dimensions);
        local.set_ftol_abs(1e-5);
        global.set_local_optimizer(local);
    }
    else
    {
        global.set_ftol_abs(1e-5);
    }
    std::vector<double> x = initial_values;

    double minf;
    try
    {
        nlopt::result result = global.optimize(x, minf);
    }
    catch (const std::exception &e)
    {
        std::cerr << "Optimizer crashed with error: " << e.what() << '\n';
    }

    std::cout << "Optimization result: " << " Error: " << minf << std::endl;

    if (_public_properties._optimize_interpolation_factor)
    {
        _public_properties._interpolation_factor.setValue({float(x[index_of_if]), true});
        updateBetaBounds();
        _parameter_feedback["SET_INTERPOLATION_FACTOR"] = _public_properties._interpolation_factor;
    }
    if (_public_properties._optimize_d_factor)
    {
        _public_properties._d_factor.setValue({float(x[index_of_d]), true});
        _parameter_feedback["SET_D_FACTOR"] = _public_properties._d_factor;
    }
    if (_public_properties._optimize_radius_modifier)
    {
        _public_properties._radius_modifier = x[index_of_radius_modifier];
        _parameter_feedback["SET_RADIUS_MODIFIER"] = _public_properties._radius_modifier;
    }
}

boost::json::object Model::getInterpolationPlotData()
{
    boost::json::object plot_data;
    plot_data["target"] = "interp";

    std::vector<float> x;
    linspace(x, _a_x_bounds._lower, _a_x_bounds._upper, 100);

    std::vector<float> y_contour;
    std::transform(x.begin(), x.end(), std::back_inserter(y_contour), [this](float value)
                   { return alglib::spline1dcalc(_a_x_y_spline, value); });

    std::vector<float> y_linear;
    std::transform(x.begin(), x.end(), std::back_inserter(y_linear), [this](float value)
                   { return _slope * value + _intercept; });

    std::vector<float> y_interp;
    std::transform(x.begin(), x.end(), std::back_inserter(y_interp), [this](float value)
                   {
    float r_orig = alglib::spline1dcalc(_a_x_y_spline, value);
    float r_linear = _slope * value + _intercept;

    return (r_linear + (r_orig - r_linear) * _public_properties._interpolation_factor); });

    boost::json::array x_arr;
    boost::json::array y_contour_arr;
    boost::json::array y_linear_arr;
    boost::json::array y_interp_arr;

    for (float v : x)
        x_arr.push_back(v);
    for (float v : y_contour)
        y_contour_arr.push_back(v);
    for (float v : y_linear)
        y_linear_arr.push_back(v);
    for (float v : y_interp)
        y_interp_arr.push_back(v);

    plot_data["x"] = x_arr;
    plot_data["y_contour"] = y_contour_arr,
    plot_data["y_linear"] = y_linear_arr;
    plot_data["y_interp"] = y_interp_arr;

    return plot_data;
}

boost::json::object Model::getIFCurvePlotData()
{
    boost::json::object plot_data;
    plot_data["target"] = "ifcurve";

    std::vector<float> x;
    linspace(x, -1, 1, 100);

    std::vector<float> y;
    std::transform(x.begin(), x.end(), std::back_inserter(y), [this](float value)
                   { return (*_ifcurve)(value); });

    boost::json::array x_arr;
    boost::json::array y_arr;

    for (float v : x)
        x_arr.push_back(v);
    for (float v : y)
        y_arr.push_back(v);

    plot_data["x"] = x_arr;
    plot_data["y"] = y_arr;

    return plot_data;
}

boost::json::object Model::getParameterFeedback()
{
    boost::json::object feedback = _parameter_feedback;
    _parameter_feedback.clear();
    return feedback;
}

Vec4 Model::getCirclePoint(double r, Vec4 cp, double arc_offset)
{
    double phi = arc_offset / r;
    double x = r * sin(phi);
    double y = cp.g - r * cos(phi);

    return Vec4(x, y);
}

double Model::getRadiusIF(float h_a, double cIF)
{
    float r_orig = alglib::spline1dcalc(_a_x_y_spline, h_a);
    float r_fit = _slope * h_a + _intercept;

    return (r_fit + (r_orig - r_fit) * cIF);
}

Vec4 Model::mapPoint(double x, double y)
{
    double h_z = y * _height;
    double h_a = alglib::spline1dcalc(_x_a_x_spline, h_z);
    double h_a_EF = _public_properties._enforce_isotropy ? getEFHeight(h_a) : h_a;
    double arc_offset = 0.0;

    if (x != 0.0)
    {
        double area = (double)_ifcurve->getFunction()->integrate(0, abs(x));
        double circ = getRadiusIF(h_a, area / abs(x)) * M_PI * 2;
        arc_offset = circ / 2 * x;
    }

    double sc_rad_h = getRadiusIF(h_a, _public_properties._interpolation_factor) * _public_properties._radius_modifier;
    Vec4 sc_cp(0, _arc_length - h_a_EF + sc_rad_h);

    return getCirclePoint(sc_rad_h, sc_cp, arc_offset);
}