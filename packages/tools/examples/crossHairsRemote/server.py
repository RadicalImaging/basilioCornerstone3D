r"""
        $ python vtk_server.py

    Any VTK Web executable script comes with a set of standard arguments that
    can be overriden if need be::
        --host localhost
             Interface on which the HTTP server will listen.

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another server
             to deliver the static content and the current process only focuses on the
             WebSocket connectivity of clients.

        --authKey wslink-secret
             Secret key that should be provided by the client to allow it to make any
             WebSocket communication. The client will assume if none is given that the
             server expects "wslink-secret" as the secret key.
"""

# import to process args
import sys
import os

# import vtk modules.
from wslink import register as exportRPC
from wslink.websocket import LinkProtocol, ServerProtocol
from wslink import server
import time
from PIL import Image
import argparse

class CS3DRemoteProtocol(LinkProtocol):
    def __init__(self):
        super(CS3DRemoteProtocol, self).__init__()
        self.servers = {}
        self.clients = {}
        self.tracking_views = {}

    def prepareImageMessage(self, view_id, contents):
        begin_time = int(round(time.time() * 1000))
        reply = {}
        reply["id"] = view_id
        reply["stale"] = 0
        reply["mtime"] = 0
        reply["size"] = [475, 500]
        reply["format"] = "jpeg"
        reply["global_id"] = '4029405940930243'
        reply["localTime"] = 0
        reply["memsize"] = len(contents)
        reply["image"] = self.addAttachment(contents)

        end_time = int(round(time.time() * 1000))
        reply["workTime"] = end_time - begin_time
        return reply

    @exportRPC("remotecs3d.update")
    def remoteUpdate(self, size, type, contents):
        print('CS3D remote', size, type)
        view_id = '1'
        reply = self.prepareImageMessage(view_id, contents)
        self.publish("viewport.image.push.subscription", reply)

    def renderImage(self, view_id):
        filename = "screenCapture.jpg"
        with open(filename, mode="rb") as file:
            contents = file.read()
            file.close()
        return self.prepareImageMessage(view_id, contents)

    @exportRPC("viewport.mouse.interaction")
    def mouse_interaction(self, event):
        print("Evento:", "viewport.mouse.interaction")
        print(event)
        self.publish("remotecs3d.events.push.subscription", event)

    @exportRPC("viewport.mouse.zoom.wheel")
    def wheel_interaction(self, event):
        print("Evento:", "viewport.mouse.zoom.wheel")
        print(event)
        return 0

    # @exportRPC("remotecs3d.events.push.subscription")
    # def cs3d_observer(self, view_id):
    #     print("Evento:", "remotecs3d.events.push.subscription")
    #     print(view_id)
    #     return {"success": True, "viewId": view_id}

    @exportRPC("viewport.image.push.observer.add")
    def push_observer(self, view_id):
        print("Evento:", "viewport.image.push.observer.add")
        print(view_id)

        self.tracking_views[view_id] = {
            "tags": [],
            "observerCount": 1,
            "mtime": 0,
            "enabled": True,
            "quality": 100,
        }
        return {"success": True, "viewId": view_id}

    @exportRPC("viewport.image.push.original.size")
    def set_original_size(self, view_id, width, height):
        print("Evento:", "viewport.image.push.original.size")
        print(view_id, width, height)
        return 0

    @exportRPC("viewport.image.push.invalidate.cache")
    def invalidate_cache(self, event):
        print("Evento:", "viewport.image.push.invalidate.cache")
        print(event)
        return 0

    @exportRPC("viewport.image.push")
    def image_push(self, options):
        print("Evento:", "viewport.image.push")
        print(options)
        reply = self.renderImage('1') #options['view'])
        self.publish("viewport.image.push.subscription", reply)
        return 0

    @exportRPC("viewport.image.push.quality")
    def set_view_quality(self, view_id, quality, ratio=1, update_linked_view=True):
        print("Evento:", "viewport.image.push.quality")
        print(view_id, quality, ratio, update_linked_view)
        return 0


class CS3DGateway(ServerProtocol):

    # Application configuration
    view = None
    authKey = "wslink-secret"

    def initialize(self):

        self.registerLinkProtocol(CS3DRemoteProtocol())
        # Update authentication key to use
        self.updateSecret(CS3DGateway.authKey)

# =============================================================================
# Main: Parse args and start server
# =============================================================================


if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(
        description="CS3D WSLINK server")

    # Add default arguments
    server.add_arguments(parser)

    # Extract arguments
    args = parser.parse_args()

    # Configure our current application
    CS3DGateway.authKey = args.authKey

    # Start server
    server.start_webserver(options=args, protocol=CS3DGateway)
