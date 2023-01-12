import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';

function createPolyData(roiData, addClippingPlanes = false) {
  const pointList = roiData.pointsList;
  const polygon = vtkPolyData.newInstance();
  const pointArray = [];
  let index = 0;

  const lines = vtkCellArray.newInstance();

  for (let i = 0; i < pointList.length; i++) {
    const points = pointList[i].points;
    const lineArray = [];
    for (let j = 0; j < points.length; j++) {
      pointArray.push(points[j].x);
      pointArray.push(points[j].y);
      pointArray.push(points[j].z);

      lineArray.push(index + j);
    }
    // Uniting the last point with the first
    lineArray.push(index);
    lines.insertNextCell(lineArray);
    index = index + points.length;
  }
  polygon.getPoints().setData(Float32Array.from(pointArray), 3);
  polygon.setLines(lines);

  const mapper = vtkMapper.newInstance();
  mapper.setInputData(polygon);

  if (addClippingPlanes) {
    const clipPlane1 = vtkPlane.newInstance();
    const clipPlane2 = vtkPlane.newInstance();
    let clipPlane1Position = 0;
    let clipPlane2Position = 0;
    const clipPlane1Normal = [-1, 1, 0];
    const clipPlane2Normal = [0, 0, 1];

    const sizeX = 0;
    const sizeY = 10;
    clipPlane1Position = sizeX / 4;
    clipPlane2Position = sizeY / 2;
    const clipPlane1Origin = [
      clipPlane1Position * clipPlane1Normal[0],
      clipPlane1Position * clipPlane1Normal[1],
      clipPlane1Position * clipPlane1Normal[2],
    ];
    const clipPlane2Origin = [
      clipPlane2Position * clipPlane2Normal[0],
      clipPlane2Position * clipPlane2Normal[1],
      clipPlane2Position * clipPlane2Normal[2],
    ];

    clipPlane1.setNormal(clipPlane1Normal);
    clipPlane1.setOrigin(clipPlane1Origin);
    clipPlane2.setNormal(clipPlane2Normal);
    clipPlane2.setOrigin(clipPlane2Origin);
    mapper.addClippingPlane(clipPlane1);
    mapper.addClippingPlane(clipPlane2);
  }

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  return actor;
}

function createPolyDataActors(
  roiData,
  lineWidth = 5,
  color = [1, 0, 0],
  addClippingPlanes = false
) {
  const pointList = roiData.pointsList;
  const polygonList = [];

  for (let i = 0; i < pointList.length; i++) {
    const polygon = vtkPolyData.newInstance();
    const lines = vtkCellArray.newInstance();
    const pointArray = [];
    const points = pointList[i].points;

    let index = 0;
    const lineArray = [];
    for (let j = 0; j < points.length; j++) {
      pointArray.push(points[j].x);
      pointArray.push(points[j].y);
      pointArray.push(points[j].z);

      lineArray.push(index + j);
    }
    // Uniting the last point with the first
    lineArray.push(index);
    lines.insertNextCell(lineArray);
    index = index + points.length;

    polygon.getPoints().setData(Float32Array.from(pointArray), 3);
    polygon.setLines(lines);
    const mapper = vtkMapper.newInstance();
    mapper.setInputData(polygon);
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setLineWidth(lineWidth);
    actor.getProperty().setColor(color[0], color[1], color[2]);

    polygonList.push(actor);
  }

  return polygonList;
}

export { createPolyData, createPolyDataActors };
