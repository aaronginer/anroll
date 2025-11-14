#include "ifcurve.hpp"

//********************************/
// IFCurve implementation

IFCurve::IFCurve(float d_factor, float interpolation_factor)
{
    function = new QuadraticFunction();
    _d_factor = d_factor;
    setInterpolationFactor(interpolation_factor);
}

IFCurve::~IFCurve()
{
    delete function;
}

// update interpolation factor and calculate appropriate upper and lower vounds for d_value
void IFCurve::setInterpolationFactor(float interpolation_factor)
{
    _interpolation_factor = interpolation_factor;

    setDFactor(_d_factor);
}

// update d_factor and optimize function for resulting d_value;
void IFCurve::setDFactor(float d_factor)
{
    _d_factor = d_factor;
    float d_value = _d_lower_bound + d_factor * (_d_upper_bound - _d_lower_bound);
    function->update(d_value, _interpolation_factor);
}

// set the globally conservative upper and lower bounds for d_value
void IFCurve::setDBounds(float lower, float upper)
{
    _d_lower_bound = lower;
    _d_upper_bound = upper;

    setDFactor(_d_factor);
}

IFCurveFunction *IFCurve::getFunction()
{
    return function;
}

float IFCurve::operator()(float x)
{
    return (*function)(x);
}