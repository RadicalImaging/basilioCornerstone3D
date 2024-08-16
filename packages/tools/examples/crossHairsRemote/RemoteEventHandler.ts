const mouseEvents = [
  'click',
  'dblclick',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
];

export default class RemoteEventHandler {
  lastEvent;
  isMouseDown;
  target;

  constructor() {
    this.lastEvent = undefined;
    this.isMouseDown = false;
    this.target = undefined;
  }

  public setTarget(element) {
    this.target = element;
  }

  public processEvent(event) {
    if (!this.target) {
      return;
    }
    event = event[0];
    let button;
    if (event['buttonLeft']) {
      button = 1;
    } else if (event['buttonMiddle']) {
      button = 4;
    } else if (event['buttonRight']) {
      button = 2;
    }

    const bounds = this.target.getBoundingClientRect();
    const screenX = Math.trunc(event.x * this.target.clientWidth);
    const screenY = Math.trunc((1 - event.y) * this.target.clientHeight);
    const clientX = screenX + bounds.left + window.scrollX;
    const clientY = screenY + bounds.top + window.scrollY;

    let eventName;
    if (event.action === 'down' && this.isMouseDown) {
      eventName = 'mousemove';
    } else {
      eventName = 'mouse' + event.action;
    }
    this.isMouseDown = event.action === 'down';
    this.lastEvent = event;

    if (mouseEvents.includes(eventName)) {
      const evt = new MouseEvent(eventName, {
        // These are the default values, set up for un-modified left clicks
        screenX, //The coordinates within the entire page
        screenY,
        clientX, //The coordinates within the viewport
        clientY,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        button, //0 = left, 1 = middle, 2 = right
        buttons: button,
        relatedTarget: this.target,
      });

      //Fire the event
      if (eventName === 'mouseup') {
        document.dispatchEvent(evt);
      } else {
        let target = this.target;
        if (document?.hasMouseMove) {
          target = document;
        }
        target.dispatchEvent(evt);
      }
    }
  }
}
