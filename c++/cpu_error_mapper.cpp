#include "cpu_error_mapper.hpp"

//********************************/
// CPUErrorMapper implementation

ErrorMapper::~ErrorMapper()
{
    if (_result != nullptr)
    {
        delete _result;
    }
}

void ErrorMapper::setParams(int width, int height, double a, double IF, double rad_factor, MappingTables *mapping_tables, double tilt, double crop_left, double crop_right)
{
    assert(width != 0 && "Called setSize with invalid width");

    if (_result != nullptr)
    {
        delete _result;
    }

    _width = width;
    _height = height;
    _size = width * height;

    _a = a;
    _IF = IF;
    _rad_factor = rad_factor;
    _tilt = tilt;
    _crop_left = crop_left;
    _crop_right = crop_right;
    _mapping_tables = mapping_tables;

    _result = new CPUErrorMapResult(width, height);
}

Vec4 ErrorMapper::getCirclePoint(double r, Vec4 cp, double arc_offset)
{
    double phi = arc_offset / r;
    double x = r * sin(phi);
    double y = cp.g - r * cos(phi);

    // apply artificial tilt (not really a perspective transformation)
    double y_flat = cp.g - r;
    y = mix(y, y_flat, _tilt);

    return Vec4(x, y);
}

double ErrorMapper::getRadiusIF(int yi, double cIF)
{
    float r_orig = _mapping_tables->_a_x_y[yi];
    float r_fit = _mapping_tables->_linear_fit[yi];

    return (r_fit + (r_orig - r_fit) * cIF);
}

Vec4 ErrorMapper::mapPoint(double x, int xi, int yi)
{
    double h_a = double(_mapping_tables->_x_a_x[yi]);
    double arc_offset = 0.0;

    if (x != 0.0)
    {
        double area = double(_mapping_tables->_if_curve_integrals[xi]);
        double circ = getRadiusIF(yi, area / abs(x)) * M_PI * 2;
        arc_offset = circ / 2 * x;
    }

    double sc_rad_h = getRadiusIF(yi, _IF) * _rad_factor;
    Vec4 sc_cp(0, _a - h_a + sc_rad_h);

    return getCirclePoint(sc_rad_h, sc_cp, arc_offset);
}

void ErrorMapper::map(int width, int height, MappingTables *mapping_tables, float arc_length, float interpolation_factor, float radius_modifier, float tilt, float crop_left, float crop_right)
{
    setParams(width, height, double(arc_length), double(interpolation_factor), double(radius_modifier), mapping_tables, double(tilt), double(crop_left), double(crop_right));
    run();
}

void ErrorMapper::run()
{
    for (int xi = 0; xi < _width; xi++)
    {
        for (int yi = 0; yi < _height; yi++)
        {
            int index = yi * _width + xi;

            double x = mix(_crop_left, 1.0 - _crop_right, float(xi) / (float(_width) - 1));
            x = (x - 0.5) * 2;

            Vec4 point_center = mapPoint(x, xi * 2, yi * 2);
            Vec4 point_right = mapPoint(x + (x <= 0 ? JITTER : -JITTER), xi * 2 + 1, yi * 2);
            Vec4 point_bottom = mapPoint(x, xi * 2, yi * 2 + 1);

            _result->_x[index] = point_center.r;
            _result->_y[index] = point_center.g;

            if (xi > 0 && yi < _height - 1)
            {
                int t_index = yi * (_width - 1) + (xi - 1);

                unsigned int t1_1 = yi * _width + xi - 1;
                unsigned int t1_2 = yi * _width + xi;
                unsigned int t1_3 = (yi + 1) * _width + xi - 1;

                unsigned int t2_1 = yi * _width + xi;
                unsigned int t2_2 = (yi + 1) * _width + xi;
                unsigned int t2_3 = (yi + 1) * _width + xi - 1;

                _result->_t[t_index * 6] = t1_1;
                _result->_t[t_index * 6 + 1] = t1_2;
                _result->_t[t_index * 6 + 2] = t1_3;
                _result->_t[t_index * 6 + 3] = t2_1;
                _result->_t[t_index * 6 + 4] = t2_2;
                _result->_t[t_index * 6 + 5] = t2_3;
            }

            double distance_x = Vec4::distance(point_center, point_right);
            double distance_y = Vec4::distance(point_center, point_bottom);

            double distance_x_norm = (distance_x * 2) / JITTER;
            double circ_orig = _mapping_tables->_a_x_y[yi * 2] * M_PI * 2;
            double x_error = distance_x_norm / circ_orig;
            Vec4 x_col = getErrorColor(x_error);
            _result->_e_x[index] = std::pow(std::clamp(x_error - 1, -1., 1.), 2);
            _result->_c_x[index * 3] = x_col.r;
            _result->_c_x[index * 3 + 1] = x_col.g;
            _result->_c_x[index * 3 + 2] = x_col.b;

            // y error
            double distance_y_norm = distance_y / JITTER;
            double y_error = distance_y_norm / _a;
            Vec4 y_col = getErrorColor(y_error);
            _result->_e_y[index] = std::pow(std::clamp(y_error - 1, -1., 1.), 2);
            _result->_c_y[index * 3] = y_col.r;
            _result->_c_y[index * 3 + 1] = y_col.g;
            _result->_c_y[index * 3 + 2] = y_col.b;

            // xy error (average)
            Vec4 xy_col = mix(x_col, y_col, 0.5);
            _result->_c_xy[index * 3] = xy_col.r;
            _result->_c_xy[index * 3 + 1] = xy_col.g;
            _result->_c_xy[index * 3 + 2] = xy_col.b;

            // relative xy error
            double r_error = x_error / y_error;
            Vec4 r_col = getErrorColor(r_error);
            _result->_e_r[index] = std::pow(std::clamp(r_error - 1, -1., 1.), 2);
            _result->_c_r[index * 3] = r_col.r;
            _result->_c_r[index * 3 + 1] = r_col.g;
            _result->_c_r[index * 3 + 2] = r_col.b;

            // angular error
            // angle between point_center->point_right and point_center->point_bottom
            Vec4 up_vector = (point_bottom - point_center).normalize();
            Vec4 right_vector = (point_right - point_center).normalize();
            double angle = acos(Vec4::dot(up_vector, right_vector));
            double angle_error = 1 + (angle - M_PI / 2) / (M_PI / 2);
            Vec4 angle_col = getErrorColor(angle_error);
            _result->_e_a[index] = std::pow(std::clamp(angle_error - 1, -1., 1.), 2);
            _result->_c_a[index * 3] = angle_col.r;
            _result->_c_a[index * 3 + 1] = angle_col.g;
            _result->_c_a[index * 3 + 2] = angle_col.b;
        }
    }
}