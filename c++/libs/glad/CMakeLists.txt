cmake_minimum_required(VERSION 3.10)
project(glad C)

# Set C standard (C99 is appropriate for GLAD)
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Source files
set(GLAD_SOURCE
    src/glad.c
)

# Header files
set(GLAD_HEADERS
    include/glad/glad.h
    include/KHR/khrplatform.h
)

# Create a static library
add_library(glad STATIC ${GLAD_SOURCE} ${GLAD_HEADERS})

# Define include directories
target_include_directories(glad
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)