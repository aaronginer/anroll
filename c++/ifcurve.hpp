#include "nlopt.hpp"
#include <cmath>
#include <functional>
#include <iostream>

class IFCurveFunction;

typedef struct OptData
{
    IFCurveFunction *if_curve_function_object;
    float d;
    float interpolation_factor;
} __OptData__;

class IFCurveFunction
{
public:
    virtual void setParams(std::vector<double> params, float d) = 0;
    virtual std::vector<float> getParams() = 0;
    virtual float integrate(float lower_bound, float upper_bound) = 0;
    virtual void update(float d, float IF) = 0;
    virtual float operator()(float x) = 0;
};

class QuadraticFunction : public IFCurveFunction
{
public:
    QuadraticFunction() = default;

    void setParams(std::vector<double> params, float d) override
    {
        _a = params[0];
        _d = d;
    }

    std::vector<float> getParams() override
    {
        return {_a, _d};
    }

    float integrate(float lower_bound, float upper_bound) override
    {
        return ((_a * pow(upper_bound, 3)) / 3 + _d * upper_bound) - ((_a * pow(lower_bound, 3)) / 3 + _d * lower_bound);
    }

    // update function parameters
    void update(float d, float IF) override
    {
        // derived from integral[0,1](f(x)) = a/3 + d.
        // find a based on IF and d. a/3 + d = IF -> a = 3 * (IF - d)
        _d = d;
        _a = 3 * (IF - d);
    }

    float operator()(float x) override
    {
        return (_a * pow(x, 2)) + _d;
    }

private:
    float _a = 0.5;
    float _d = 0.5;
};

class IFCurve
{
public:
    IFCurve(float d_factor, float interpolation_factor);

    ~IFCurve();

    void setInterpolationFactor(float interpolation_factor);
    void setDFactor(float d_factor);
    void setDBounds(float lower, float upper);
    IFCurveFunction *getFunction();
    float operator()(float x);

private:
    float _d_lower_bound, _d_upper_bound;
    float _d_factor; // user-input d-value -> used to find real d-value between lower and upper bound d-value=lower_bound + d_factor * (upper_bound - lower_bound)
    float _interpolation_factor;

    IFCurveFunction *function;
};