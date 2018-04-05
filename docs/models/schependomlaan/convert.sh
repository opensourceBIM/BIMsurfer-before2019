#!/bin/bash
# IFC to xeogl pipeline demo - see README.md

# Convert IFC to COLLADA
./IfcConvert model.ifc model.dae

# Convert IFC to XML
./IfcConvert model.ifc  model.xml


# Convert COLLADA to glTF
./COLLADA2GLTF/build/COLLADA2GLTF-bin -i model.dae -o model.gltf

# Optimize glTF (optional)
# node ./gltf-pipeline/bin/gltf-pipeline.js -i model.dae -o model.optimized.gltf
