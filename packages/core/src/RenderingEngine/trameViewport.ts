import Viewport from './Viewport';
import { ViewportInput } from '../types/IViewport';
import wslink from './wslink';
import vtkRemoteView from '@kitware/vtk.js/Rendering/Misc/RemoteView';

import type { Point3, Point2 } from '../types';

interface RemoteConnection {
  connection;
  viewId;
  viewStream;
  view;
  session;
}

export default class TrameViewport extends Viewport {
  remoteConnection: RemoteConnection;

  ////////////////////////////////////////////////////////////////////////////////
  private getWorldToCanvasRatio() {
    return 1.0;
  }

  private getCanvasToWorldRatio() {
    return 1.0;
  }

  /**
   * Converts a VideoViewport canvas coordinate to a video coordinate.
   *
   * @param canvasPos - to convert to world
   * @returns World position
   */
  public canvasToWorld = (
    canvasPos: Point2,
    destPos: Point3 = [0, 0, 0]
  ): Point3 => {
    const pan: Point2 = [0, 0]; // In world coordinates
    const worldToCanvasRatio: number = this.getWorldToCanvasRatio();

    const panOffsetCanvas: Point2 = [
      pan[0] * worldToCanvasRatio,
      pan[1] * worldToCanvasRatio,
    ];

    const subCanvasPos: Point2 = [
      canvasPos[0] - panOffsetCanvas[0],
      canvasPos[1] - panOffsetCanvas[1],
    ];

    // Replace the x,y values only in place in the world position
    // as the z is unchanging for video display
    destPos.splice(
      0,
      2,
      subCanvasPos[0] / worldToCanvasRatio,
      subCanvasPos[1] / worldToCanvasRatio
    );
    return destPos;
  };

  /**
   * Converts `[x, y, 0]` world video coordinate to canvas CSS coordinates.
   *
   * @param  worldPos - world coord to convert to canvas
   * @returns Canvas position
   */
  public worldToCanvas = (worldPos: Point3): Point2 => {
    const pan: Point2 = [0, 0];
    const worldToCanvasRatio: number = this.getWorldToCanvasRatio();

    const canvasPos: Point2 = [
      (worldPos[0] + pan[0]) * worldToCanvasRatio,
      (worldPos[1] + pan[1]) * worldToCanvasRatio,
    ];

    return canvasPos;
  };

  public getFrameOfReferenceUID = (): string => {
    return 'REMOTE';
  };

  ////////////////////////////////////////////////////////////////////////////////

  protected configureElement() {
    this.element.style.position = 'relative';
    this.element.style.overflow = 'hidden';
  }

  protected configureConnection() {
    this.remoteConnection = {
      connection: wslink.createClient(),
      viewId: '',
      viewStream: '',
      view: '',
      session: '',
    };
    this.remoteConnection.connection.onConnectionError((httpReq) => {
      const message =
        (httpReq && httpReq.response && httpReq.response.error) ||
        `Connection error`;
      console.error(message);
      console.log(httpReq);
    });

    // Close
    this.remoteConnection.connection.onConnectionClose((httpReq) => {
      const message =
        (httpReq && httpReq.response && httpReq.response.error) ||
        `Connection close`;
      console.error(message);
      console.log(httpReq);
    });
  }

  constructor(props: ViewportInput) {
    super(props);
    this.configureConnection();
  }

  public connect = (config, isTrameConnection = false): void => {
    this.remoteConnection.connection
      .connect(config)
      .then(async (validClient) => {
        let remoteObject = undefined;
        if (isTrameConnection) {
          remoteObject = await this.remoteConnection.connection
            .getRemote()
            .Trame.getState();
        }
        this.remoteConnection.viewId = remoteObject?.state?.viewId || '1';
        this.remoteConnection.viewStream = this.remoteConnection.connection
          .getImageStream()
          .createViewStream(this.remoteConnection.viewId);

        this.remoteConnection.view = vtkRemoteView.newInstance({
          rpcWheelEvent: 'viewport.mouse.zoom.wheel',
          viewStream: this.remoteConnection.viewStream,
        });
        const session = validClient.getConnection().getSession();
        this.remoteConnection.view.setSession(session);
        this.remoteConnection.view.setContainer(this.element.children[0]);
        // make the canvas from remoteView be the first one canvas
        this.element.children[0].insertBefore(
          this.element.children[0].children[2],
          this.element.children[0].children[0]
        );
        this.remoteConnection.view.setInteractiveRatio(0.7); // the scaled image compared to the clients view resolution
        this.remoteConnection.view.setInteractiveQuality(50); // jpeg quality

        this.element.addEventListener(
          'resize',
          this.remoteConnection.view.resize
        );
      })
      .catch((error) => {
        console.error(error);
      });
  };
}
