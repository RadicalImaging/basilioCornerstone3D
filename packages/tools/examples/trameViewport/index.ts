import { RenderingEngine, Types, Enums } from '@cornerstonejs/core';
import {
  initDemo,
  createImageIdsAndCacheMetaData,
  setTitleAndDescription,
  addDropdownToToolbar,
} from '../../../../utils/demo/helpers';
import * as cornerstoneTools from '@cornerstonejs/tools';
import TrameViewport from '../../../core/src/RenderingEngine/trameViewport';

// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

const {
  PanTool,
  WindowLevelTool,
  StackScrollMouseWheelTool,
  ZoomTool,
  PlanarRotateTool,
  ToolGroupManager,
  Enums: csToolsEnums,
} = cornerstoneTools;

const { ViewportType } = Enums;
const { MouseBindings } = csToolsEnums;

const toolGroupId = 'STACK_TOOL_GROUP_ID';
const leftClickTools = [WindowLevelTool.toolName, PlanarRotateTool.toolName];
const defaultLeftClickTool = leftClickTools[0];
let currentLeftClickTool = leftClickTools[0];

// ======== Set up page ======== //
setTitleAndDescription(
  'Trame viewport example',
  'And manipulation tools for a stack viewport'
);

const size = '500px';
const content = document.getElementById('content');
const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'flex';
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

const element1 = document.createElement('div');
// Disable right click context menu so we can have right click tools
element1.oncontextmenu = (e) => e.preventDefault();

element1.id = 'cornerstone-element';
element1.style.width = size;
element1.style.height = size;

const element2 = document.createElement('div');
// Disable right click context menu so we can have right click tools
element2.oncontextmenu = (e) => e.preventDefault();

element2.id = 'cornerstone-element';
element2.style.width = '500px';
element2.style.height = '500px';

viewportGrid.appendChild(element1);
viewportGrid.appendChild(element2);

content.appendChild(viewportGrid);

const instructions = document.createElement('p');
instructions.innerText =
  'Middle Click: Pan\nRight Click: Zoom\n Mouse Wheel: Stack Scroll';

content.append(instructions);
// ============================= //

addDropdownToToolbar({
  options: {
    values: leftClickTools,
    defaultValue: defaultLeftClickTool,
  },
  onSelectedValueChange: (selectedValue) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    toolGroup.setToolPassive(currentLeftClickTool);

    toolGroup.setToolActive(<string>selectedValue, {
      bindings: [
        {
          mouseButton: MouseBindings.Primary, // Left Click
        },
      ],
    });

    currentLeftClickTool = selectedValue;
  },
});

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  // Add tools to Cornerstone3D
  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(WindowLevelTool);
  cornerstoneTools.addTool(StackScrollMouseWheelTool);
  cornerstoneTools.addTool(ZoomTool);
  cornerstoneTools.addTool(PlanarRotateTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  // Add tools to the tool group
  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName, { loop: false });
  toolGroup.addTool(PlanarRotateTool.toolName);

  // Set the initial state of the tools, here all tools are active and bound to
  // Different mouse inputs
  toolGroup.setToolActive(defaultLeftClickTool, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });
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
  // As the Stack Scroll mouse wheel is a tool using the `mouseWheelCallback`
  // hook instead of mouse buttons, it does not need to assign any mouse button.
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  });

  // Instantiate a rendering engine
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create a stack viewport
  const viewportId1 = 'TRAME_VIEWPORT';
  const viewportId2 = 'CT_STACK';
  const viewportInput1 = {
    viewportId: viewportId1,
    type: ViewportType.TRAME,
    element: element1,
    defaultOptions: {
      background: <Types.Point3>[0, 0, 0],
    },
  };

  const viewportInput2 = {
    viewportId: viewportId2,
    type: ViewportType.STACK,
    element: element2,
    defaultOptions: {
      background: <Types.Point3>[0, 0, 0],
    },
  };

  renderingEngine.enableElement(viewportInput1);
  renderingEngine.enableElement(viewportInput2);

  // Set the tool group on the viewport
  toolGroup.addViewport(viewportId2, renderingEngineId);

  // Get the stack viewport that was created
  const viewport = <Types.IStackViewport>(
    renderingEngine.getViewport(viewportId2)
  );

  // Set the stack on the viewport
  viewport.setStack(imageIds);

  cornerstoneTools.utilities.stackPrefetch.enable(viewport.element);

  // Render the image
  viewport.render();

  // Get the trame viewport that was created
  const trameViewport = renderingEngine.getViewport(
    viewportId1
  ) as TrameViewport;

  const config = {
    application: 'cone',
    sessionURL: 'ws://localhost:1234/ws',
  };

  trameViewport.connect(config);
}

run();
