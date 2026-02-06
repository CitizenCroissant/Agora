#!/bin/bash
# Create a simple 1024x1024 PNG icon with blue background
# Requires ImageMagick: convert or magick command
if command -v convert &> /dev/null; then
  convert -size 1024x1024 xc:'#0055a4' icon.png
  echo "Created icon.png using ImageMagick"
elif command -v magick &> /dev/null; then
  magick -size 1024x1024 xc:'#0055a4' icon.png
  echo "Created icon.png using ImageMagick (magick)"
else
  echo "ImageMagick not found. Please create assets/icon.png manually (1024x1024 PNG)"
  echo "You can use any image editor or download a placeholder from:"
  echo "https://via.placeholder.com/1024x1024/0055a4/ffffff?text=A"
fi
