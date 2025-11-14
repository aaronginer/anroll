#include <chrono>
#include <iostream>
#include <string>

class Timer
{
public:
    Timer(const std::string &label = "", const bool silent = false)
        : label_(label), start_(std::chrono::high_resolution_clock::now()), silent_(silent) {}

    long long getElapsedTimeMicroseconds()
    {
        auto now = std::chrono::high_resolution_clock::now();
        auto duration =
            std::chrono::duration_cast<std::chrono::microseconds>(now - start_).count();
        return duration;
    }
    ~Timer()
    {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration =
            std::chrono::duration_cast<std::chrono::microseconds>(end - start_).count();
        if (!silent_)
        {
            std::cout << (label_.empty() ? "Elapsed time: " : label_ + " elapsed time: ")
                      << duration / (float)1000000 << " s" << std::endl;
        }
    }

private:
    bool silent_ = false;
    std::string label_;
    std::chrono::high_resolution_clock::time_point start_;
};