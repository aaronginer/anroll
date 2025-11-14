# debian / ubuntu

echo "Installing dependencies for AnRoll project..."

sudo apt-get update

sudo apt-get install -y libglfw3-dev
sudo apt-get install -y libx11-dev libgl1-mesa-dev mesa-common-dev
sudo apt-get install -y libglu1-mesa-dev mesa-utils

sudo add-apt-repository -y ppa:kisak/kisak-mesa
sudo apt-get update
sudo apt-get upgrade -y

echo "Installation complete!"
echo "Please reboot."