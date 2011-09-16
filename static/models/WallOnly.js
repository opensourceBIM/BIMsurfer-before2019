/* Author:      Administrator
   Description: 
*/
SceneJS.createScene({
  type: 'scene',
  id: 'Scene',
  canvasId: 'scenejsCanvas',
  loggingElementId: 'scenejsLog',
  flags: {
    backfaces: false,
  },
  nodes: [
    {
      type: 'library',
      nodes: [
        {
          type: 'material',
          coreId: 'SpaceMaterial',
          baseColor: {
            r: 0.137255,
            g: 0.403922,
            b: 0.870588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'RoofMaterial',
          baseColor: {
            r: 0.837255,
            g: 0.203922,
            b: 0.270588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'SlabMaterial',
          baseColor: {
            r: 0.637255,
            g: 0.603922,
            b: 0.670588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'WallMaterial',
          baseColor: {
            r: 0.537255,
            g: 0.337255,
            b: 0.237255,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'DoorMaterial',
          baseColor: {
            r: 0.637255,
            g: 0.603922,
            b: 0.670588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'WindowMaterial',
          baseColor: {
            r: 0.2,
            g: 0.2,
            b: 0.8,
          },
          alpha: 0.2,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'RailingMaterial',
          baseColor: {
            r: 0.137255,
            g: 0.203922,
            b: 0.270588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'ColumnMaterial',
          baseColor: {
            r: 0.437255,
            g: 0.603922,
            b: 0.370588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'FurnishingElementMaterial',
          baseColor: {
            r: 0.437255,
            g: 0.603922,
            b: 0.370588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'CurtainWallMaterial',
          baseColor: {
            r: 0.5,
            g: 0.5,
            b: 0.5,
          },
          alpha: 0.5,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'StairMaterial',
          baseColor: {
            r: 0.637255,
            g: 0.603922,
            b: 0.670588,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'BuildingElementProxyMaterial',
          baseColor: {
            r: 0.5,
            g: 0.5,
            b: 0.5,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'material',
          coreId: 'FlowSegmentMaterial',
          baseColor: {
            r: 0.6,
            g: 0.4,
            b: 0.5,
          },
          alpha: 1.0,
          emit: 0.0,
        },
        {
          type: 'geometry',
          coreId: '3Ep4r0uuX5ywPYOUG2H2A4',
          primitive: 'triangles',
          positions: [-2700.0,-100.0,-2500.0,-2700.0,-100.0,2500.0,2700.0,-100.0,2500.0,2700.0,-100.0,-2500.0,2700.0,-100.0,-2500.0,2700.0,-100.0,2500.0,2700.0,100.0,2500.0,2700.0,100.0,-2500.0,2700.0,100.0,-2500.0,2700.0,100.0,2500.0,-2700.0,100.0,2500.0,-2700.0,100.0,-2500.0,-2700.0,100.0,-2500.0,-2700.0,100.0,2500.0,-2700.0,-100.0,2500.0,-2700.0,-100.0,-2500.0,-2700.0,100.0,2500.0,-2700.0,-100.0,2500.0,2700.0,-100.0,2500.0,2700.0,100.0,2500.0,2700.0,-100.0,-2500.0,-2700.0,-100.0,-2500.0,-2700.0,100.0,-2500.0,2700.0,100.0,-2500.0,],
          normals: [-0.0,-1.0,-0.0,-0.0,-1.0,-0.0,-0.0,-1.0,-0.0,-0.0,-1.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-0.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-0.0,1.0,-0.0,-1.0,-0.0,0.0,-1.0,-0.0,0.0,-1.0,-0.0,0.0,-1.0,-0.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,],
          indices: [0,2,1,2,0,3,4,6,5,6,4,7,8,10,9,10,8,11,12,14,13,14,12,15,16,17,18,18,19,16,20,21,22,22,23,20,],
        },
      ],
    },
    {
      type: 'lookAt',
      id: 'main-lookAt',
      eye: {
        x: 8100.0,
        y: 300.0,
        z: 7500.0,
      },
      look: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
      up: {
        x: 0.0,
        y: 0.0,
        z: 1.0,
      },
      nodes: [
        {
          type: 'camera',
          id: 'main-camera',
          optics: {
            type: 'perspective',
            far: 44172.39,
            near: 7.3620653,
            aspect: 1.0,
            fovy: 37.8493,
          },
          nodes: [
            {
              type: 'renderer',
              id: 'main-renderer',
              clear: {
                color: true,
                depth: true,
                stencil: false,
              },
              clearColor: {
                r: 0.2,
                g: 0.2,
                b: 0.2,
                a: 0.0,
              },
              nodes: [
                {
                  type: 'light',
                  id: 'sun-light',
                  mode: 'dir',
                  color: {
                    r: 0.8,
                    g: 0.8,
                    b: 0.8,
                  },
                  dir: {
                    x:-0.5,
                    y:-0.5,
                    z:-1.0,
                  },
                  diffuse: true,
                  specular: true,
                },
                {
                  type: 'tag',
                  tag: 'wall',
                  nodes: [
                    {
                      type: 'material',
                      coreId: 'WallMaterial',
                      nodes: [
                        {
                          type: 'name',
                          id: '3Ep4r0uuX5ywPYOUG2H2A4',
                          nodes: [
                            {
                              type: 'geometry',
                              coreId: '3Ep4r0uuX5ywPYOUG2H2A4',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  data: {
    bounds: [5400.0,200.0,5000.0],
    unit: '0.001 millimeter',
    ifcTypes: ['Wall',]
  },
});
