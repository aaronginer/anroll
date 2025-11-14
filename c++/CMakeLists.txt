# GPT Generated CMakeLists.txt for AnRoll Project
cmake_minimum_required(VERSION 3.10)
set(CMAKE_COLOR_DIAGNOSTICS ON)
set(BUILD_SHARED_LIBS OFF)
project(AnRoll CXX)

# Compiler-Einstellungen
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_compile_options(-Wall -Wextra)

# Unterverzeichnisse mit Bibliotheken einbinden
add_subdirectory(libs/nlopt)
add_subdirectory(libs/alglib/alglib-cpp)
add_subdirectory(libs/glad)
# add_subdirectory(libs/eigen)

# Plattformspezifische Bibliotheken und Pfade
if(WIN32)
    # Windows-spezifische Bibliotheken
    set(PLATFORM_LIBS opengl32 gdi32 ws2_32)
    set(GLFW_LIB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/libs/glfw64/lib-mingw-w64)
    include_directories(libs/glfw64/include)
    link_directories(${GLFW_LIB_DIR})
else()
    cmake_policy(SET CMP0072 NEW)
    set(OpenGL_GL_PREFERENCE GLVND)
    # Linux/Unix-spezifische Bibliotheken
    find_package(OpenGL REQUIRED)
    find_package(X11 REQUIRED)
    find_package(glfw3 REQUIRED)
    set(PLATFORM_LIBS ${OPENGL_LIBRARIES} ${X11_LIBRARIES} pthread dl)
endif()

# Include-Verzeichnisse
include_directories(
    libs/boost
    libs/boost/boost/beast/include
    libs/boost/boost/asio/includes
    libs/cxxopts/include
    libs/stb
    libs/alglib
    libs/eigen
    libs/glad/include
    ${CMAKE_BINARY_DIR}/libs/nlopt/
)

# Server-Anwendung
add_executable(server
    server.cpp
    model.cpp
    ifcurve.cpp
    shader.cpp
    gl_renderer.cpp
    gl_image_mapper.cpp
    gl_grid_mapper.cpp
    cpu_error_mapper.cpp
    util.cpp
)

# CMD-Anwendung
add_executable(cmd
    cmd.cpp
    model.cpp
    ifcurve.cpp
    shader.cpp
    gl_renderer.cpp
    gl_image_mapper.cpp
    gl_grid_mapper.cpp
    cpu_error_mapper.cpp
    util.cpp
)

# INTERPOLATE-Anwendung
add_executable(interpolate
    interpolate.cpp
    model.cpp
    ifcurve.cpp
    shader.cpp
    gl_renderer.cpp
    gl_image_mapper.cpp
    gl_grid_mapper.cpp
    cpu_error_mapper.cpp
    util.cpp
)


# Bibliotheken verlinken
foreach(TARGET server cmd interpolate)
    if(glfw3_FOUND)
        target_link_libraries(${TARGET}
            nlopt
            glfw
            alglib
            glad
            m
            ${PLATFORM_LIBS}
        )
    else()
        target_link_libraries(${TARGET}
            nlopt
            glfw3
            alglib
            glad
            m
            ${PLATFORM_LIBS}
        )
    endif()
    
    # Statisches Linking für GCC
    if(MSVC)
        # MSVC-spezifische Flags
    elseif(CMAKE_COMPILER_IS_GNUCXX)
        target_link_options(${TARGET} PRIVATE -static-libgcc -static-libstdc++)
    endif()
endforeach()