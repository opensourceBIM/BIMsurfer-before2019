# Program constants

# Mathematical constants
#math_sqrt2 = Math.sqrt 2.0

# Application constants
constants =
  camera:
    maxOrbitSpeed: Math.PI * 0.1
    orbitSpeedFactor: 0.01
    zoomSpeedFactor: 0.05
  thumbnails:
    size: [125, 100] 
    scale: 2 # Scale up the thumbnails for exporting to PDF and smoothing it in the img tag (See issue #18)
