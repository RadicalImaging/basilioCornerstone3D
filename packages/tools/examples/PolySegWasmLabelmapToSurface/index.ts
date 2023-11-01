import ICRPolySegApp from '../../../../utils/assets/polyseg/ICRPolySeg';
import {
  RenderingEngine,
  Types,
  Enums,
  setVolumesForViewports,
  volumeLoader,
  utilities,
  geometryLoader,
  CONSTANTS,
} from '@cornerstonejs/core';
import {
  initDemo,
  createImageIdsAndCacheMetaData,
  setTitleAndDescription,
  addButtonToToolbar,
} from '../../../../utils/demo/helpers';

import * as cornerstoneTools from '@cornerstonejs/tools';

// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

let instance = undefined;

addButtonToToolbar({
  title: 'Convert labelmap to surface',
  onClick: async () => {
    if (!instance) {
      return;
    }

    const labelMapHeader = await fetch('/labelMap.json').then((res) =>
      res.json()
    );
    const labelMap = await fetch('/labelMap.bin').then((res) =>
      res.arrayBuffer()
    );
    const values = new Uint8Array(labelMap);
    const int32Array = new Int32Array(values.length);
    for (let i = 0; i < values.length; i++) {
      int32Array[i] = values[i];
    }
    // we need to convert the labelMapHeader attributes from objects to arrays
    const result = instance.convertLabelmapToSurface(
      int32Array,
      [
        labelMapHeader.dimensions[0],
        labelMapHeader.dimensions[1],
        labelMapHeader.dimensions[2],
      ],
      [
        labelMapHeader.spacing[0],
        labelMapHeader.spacing[1],
        labelMapHeader.spacing[2],
      ],
      [
        labelMapHeader.direction[0],
        labelMapHeader.direction[1],
        labelMapHeader.direction[2],
      ],
      [
        labelMapHeader.origin[0],
        labelMapHeader.origin[1],
        labelMapHeader.origin[2],
      ],
      [1]
    );

    const closedSurface = {
      id: 'closedSurface',
      color: [200, 232, 20],
      frameOfReferenceUID: 'test-frameOfReferenceUID',
      data: {
        points: result.points,
        polys: result.polys,
      },
    };
    const geometryId = closedSurface.id;
    const segmentationId = geometryId;
    geometryLoader.createAndCacheGeometry(geometryId, {
      type: GeometryType.SURFACE,
      geometryData: closedSurface as Types.PublicSurfaceData,
    });

    // Add the segmentations to state
    await segmentation.addSegmentations([
      {
        segmentationId,
        representation: {
          // The type of segmentation
          type: csToolsEnums.SegmentationRepresentations.Surface,
          // The actual segmentation data, in the case of contour geometry
          // this is a reference to the geometry data
          data: {
            geometryId,
          },
        },
      },
    ]);
    await segmentation.addSegmentationRepresentations(toolGroupId, [
      {
        segmentationId,
        type: csToolsEnums.SegmentationRepresentations.Surface,
      },
    ]);
    await segmentation.addSegmentationRepresentations(toolGroupId3d, [
      {
        segmentationId,
        type: csToolsEnums.SegmentationRepresentations.Surface,
      },
    ]);
  },
});

const {
  SegmentationDisplayTool,
  ToolGroupManager,
  Enums: csToolsEnums,
  segmentation,
  ZoomTool,
  PanTool,
  StackScrollMouseWheelTool,
  TrackballRotateTool,
} = cornerstoneTools;
const { MouseBindings } = csToolsEnums;
const { ViewportType, GeometryType } = Enums;

// Define a unique id for the volume
const volumeName = 'CT_VOLUME_ID'; // Id of the volume less loader prefix
const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
const toolGroupId = 'MY_TOOLGROUP_ID';
const toolGroupId3d = 'MY_TOOLGROUP_ID_3d';

// ======== Set up page ======== //
setTitleAndDescription(
  'Surface Segmentation Representation for Volume Viewports',
  'In this demonstration, we will show you how to render surfaces. On the left side, you will find a volume viewport, and on the right side, there is a 3D viewport. When you interact with the images, the intersection between the surfaces and the underlying volume is calculated. Please note that this calculation may be slow during the initial visit, but we have implemented caching to significantly improve speed in subsequent visits. In the future, we plan to enhance the user experience by introducing off-thread pre-calculation of all surfaces.'
);

const size = '500px';
const content = document.getElementById('content');
const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'flex';
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

const element1 = document.createElement('div');
const element2 = document.createElement('div');
element1.oncontextmenu = () => false;
element2.oncontextmenu = () => false;

element1.style.width = size;
element1.style.height = size;
element2.style.width = size;
element2.style.height = size;

viewportGrid.appendChild(element1);
viewportGrid.appendChild(element2);

content.appendChild(viewportGrid);

const instructions = document.createElement('p');
content.append(instructions);
// ============================= //

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  instance = await ICRPolySegApp();

  // Add tools to Cornerstone3D
  cornerstoneTools.addTool(SegmentationDisplayTool);
  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(ZoomTool);
  cornerstoneTools.addTool(StackScrollMouseWheelTool);
  cornerstoneTools.addTool(TrackballRotateTool);

  // Define tool groups to add the segmentation display tool to
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  const toolGroup3d = ToolGroupManager.createToolGroup(toolGroupId3d);

  toolGroup.addTool(SegmentationDisplayTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);

  toolGroup3d.addTool(SegmentationDisplayTool.toolName);
  toolGroup3d.addTool(ZoomTool.toolName);
  toolGroup3d.addTool(TrackballRotateTool.toolName, {
    configuration: { volumeId },
  });

  toolGroup3d.setToolEnabled(SegmentationDisplayTool.toolName);
  toolGroup.setToolEnabled(SegmentationDisplayTool.toolName);

  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Auxiliary, // Middle Click
      },
    ],
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary, // Right Click
      },
    ],
  });

  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  toolGroup3d.setToolActive(TrackballRotateTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary,
      },
    ],
  });

  toolGroup3d.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary, // Right Click
      },
    ],
  });

  // Get Cornerstone imageIds for the source data and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  });

  // Define a volume in memory
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  // Add some segmentations based on the source data volume

  // Instantiate a rendering engine
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create the viewports
  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_3D';

  const viewportInputArray = [
    {
      viewportId: viewportId2,
      type: ViewportType.VOLUME_3D,
      element: element1,
      defaultOptions: {
        background: <Types.Point3>[0.2, 0, 0.2],
      },
    },
    {
      viewportId: viewportId1,
      type: ViewportType.ORTHOGRAPHIC,
      element: element2,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
        background: <Types.Point3>[0.2, 0, 0.2],
      },
    },
  ];

  renderingEngine.setViewports(viewportInputArray);

  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup3d.addViewport(viewportId2, renderingEngineId);

  // Set the volume to load
  volume.load();

  // Set volumes on the viewports
  setVolumesForViewports(
    renderingEngine,
    [{ volumeId }],
    [viewportId1, viewportId2]
  ).then(() => {
    const viewport3d = renderingEngine.getViewport(viewportId2);
    const volumeActor = viewport3d.getDefaultActor().actor as Types.VolumeActor;
    utilities.applyPreset(
      volumeActor,
      CONSTANTS.VIEWPORT_PRESETS.find(
        (preset) => preset.name === 'CT-Chest-Contrast-Enhanced'
      )
    );

    const renderer = viewport3d.getRenderer();
    renderer.getActiveCamera().elevation(-70);
    viewport3d.setCamera({ parallelScale: 600 });

    viewport3d.render();
  });

  // Render the image
  renderingEngine.render();
}

run();
