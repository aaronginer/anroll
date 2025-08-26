# AnRoll - Analytic Unrolling of Painted Pottery Surfaces

## Source Code:
All source code is available in the src/ folder. src/c++ contains the source code for the model implementation, while src/web contains the source code for the browser-based user interface.

## Downloads:
You can download different versions of the tool here.

CMD wrapper:

Server wrapper:

User Interface (web-only):

Electron App:

## Usage

There are three different ways of unrolling images:

### 1 Command-Line only
To run the tool through the command line, you only need the CMD wrapper. Running it with .cmd.exe --help will give you an extensive list of available features.

### 2 Server-wrapper + browser interace:
For this method, you have to download the Server wrapper as well as the web-only user interface. Then simply start the server application either by double clicking, or, alternatively, through the command line, where you can provide a port number (server.exe -p [port]). Then simply open the anroll.html in the Chrome browser (other browsers may not work).

### 3 Electron App

The electron app is the complete package of server and UI, packaged as a simple Windows/Debian installer. Simply download, install, and open.
