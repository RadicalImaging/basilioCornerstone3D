import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

function createPolyData(ROIContourData, lineWidth = 5) {
  const pointList = ROIContourData.contourPoints;
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

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setLineWidth(lineWidth);
  const color = ROIContourData.colorArray;
  if (color) {
    actor
      .getProperty()
      .setColor(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0);
  }
  return actor;
}

function createPolyDataActors(ROIContourData, lineWidth = 10) {
  const pointList = ROIContourData.contourPoints;
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
    const color = ROIContourData.colorArray;
    if (color) {
      actor
        .getProperty()
        .setColor(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0);
    }
    polygonList.push(actor);
  }

  return polygonList;
}

export { createPolyData, createPolyDataActors };
