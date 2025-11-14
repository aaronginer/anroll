cmake_minimum_required(VERSION 3.10)
project(alglib CXX)

# Setzen Sie den C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Sammeln Sie alle Quelldateien
file(GLOB ALGLIB_SOURCES "src/*.cpp")
file(GLOB ALGLIB_HEADERS "src/*.h")

# Erstellen Sie eine statische Bibliothek
add_library(alglib STATIC ${ALGLIB_SOURCES} ${ALGLIB_HEADERS})

# Definieren Sie das Include-Verzeichnis für andere Teile des Projekts
target_include_directories(alglib
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)