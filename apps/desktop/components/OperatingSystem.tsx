import { ApplicationManager } from "@/applications/ApplicationManager";
import { WindowCompositor } from "./WindowManagement/WindowCompositor";
import { DragAndDropService } from "@/apis/DragAndDrop/DragAndDrop";
import { createBaseFileSystem } from "@/apis/FileSystem/FileSystem";
import React, { MutableRefObject, useEffect, useRef } from "react";
import { MenuBar } from "./MenuBar";
import { Desktop } from "./Desktop/Desktop";
import { Dock } from "./Dock/Dock";
import { FileSystem } from '@/apis/FileSystem/FileSystem';
import styles from './OperatingSystem.module.css';
import { DragAndDropView } from "./DragAndDropView";
import { parseResponseFromParent, sendRequestToParent } from "rpc";
import { Camera } from "@/data/Camera";
import { PointerCoordinates, TouchData } from "@/data/TouchData";
import { clamp, isPhoneSafari, isTouchMoveCamera, isTouchZoom } from "./util";

const NodeNameButton = 'BUTTON';

const fileSystem = createBaseFileSystem();
const dragAndDrop = new DragAndDropService();

export type SystemAPIs = { dragAndDrop: DragAndDropService, fileSystem: FileSystem };
const apis: SystemAPIs = { dragAndDrop, fileSystem };

const windowCompositor = new WindowCompositor();
const applicationManager = new ApplicationManager(windowCompositor, fileSystem, apis);

function handleParentResponsesClosure(
  initialCamera: MutableRefObject<Camera | null>,
  camera: MutableRefObject<Camera | null>
) {
  return function(event: MessageEvent) {
    const response = parseResponseFromParent(event);
    if (!response.ok) { return; }

    const value = response.value;

    if (value.method === 'camera_zoom_distance_response') {
      initialCamera.current = Camera.handleParentResponse(value);
      camera.current = Camera.handleParentResponse(value);
    }    
  }
}

function findButtonNodeInDOM(value: HTMLElement): HTMLElement | null {
  let element: HTMLElement | null = value;

  while (element !== null) {
    if (element.nodeName === NodeNameButton) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

export const OperatingSystem = () => {
  const ref = useRef<HTMLDivElement>(null);
  const touchOrigin = useRef<TouchData | null>(null);

  const initialCamera = useRef<Camera | null>(null);
  const camera = useRef<Camera | null>(null);

  const targetedButton = useRef<HTMLElement | null>(null);

  function handlePhoneSafariButtonClickStart(evt: TouchEvent) {
    if (!isPhoneSafari()) { return; }
    // Always reset the targeted button
    targetedButton.current = null;

    // If it is the first touch, record the node if it is a button
    if (evt.touches.length !== 1) { return; }

    targetedButton.current = findButtonNodeInDOM(evt.target as HTMLElement);
  }

  function handlePhoneSafariButtonClickRelease(evt: TouchEvent) {
    if (!isPhoneSafari()) { return; }
    if (evt.target === null) { return; }
    if (findButtonNodeInDOM(evt.target as HTMLElement) !== targetedButton.current) { return; }

    evt.target.dispatchEvent(new Event('click', { bubbles: true }));
  }

  function handleGestureStart(evt: Event): void {
    evt.preventDefault();
  }

  function handleTouchStartEvent(evt: TouchEvent) {
    if (isPhoneSafari()) { evt.preventDefault(); }

    sendRequestToParent({ method: 'camera_zoom_distance_request' });

    handlePhoneSafariButtonClickStart(evt);

    if (evt.touches.length === 2) {
      touchOrigin.current = TouchData.fromTouchEvent('start', evt);
    }
  }

  function handleMoveCameraEvent(camera: Camera, coords: PointerCoordinates): [number, number] {
    if (touchOrigin.current === null) { return [0, 0]; }

    const sensitivity = 0.005;
    const originCoords = touchOrigin.current.pointerCoordinates();

    let vertical   = (coords.y - originCoords.y) * sensitivity;
    let horizontal = -(coords.x - originCoords.x) * sensitivity;

    return [camera.horizontalOffset + horizontal, camera.verticalOffset + vertical];
  }

  function handleZoomCameraEvent(camera: Camera, origin: TouchData, data: TouchData): number {
    const { min, max, current } = camera.zoom;
    
    const bb1 = origin.boundingBox();
    const bb2 = data.boundingBox();

    const zoomOffset = (bb2.diagonal() - bb1.diagonal()) * 0.01;
    const zoomDistance = current - zoomOffset;

    const clampedZoomDistance = clamp(zoomDistance, min, max);

    console.log(zoomOffset, clampedZoomDistance);

    return clampedZoomDistance;
  }

  function handleTouchMoveEvent(evt: TouchEvent) {
    evt.preventDefault();

    const data = TouchData.fromTouchEvent('move', evt);

    // We provide our own zooming of the page, by zoom/move the camera instead of the page
    // And it is not useful to send the single touches to the host window, so we don't
    if (evt.touches.length !== 2) { return; }
    if (touchOrigin.current === null) { return; }
    if (camera.current === null || initialCamera.current === null) { return; }

    const cam = camera.current;
    const initialCam = initialCamera.current;

    const origin = touchOrigin.current;
    
    if (isTouchMoveCamera(data)) {
      [cam.horizontalOffset, cam.verticalOffset] = handleMoveCameraEvent(initialCam, data.pointerCoordinates());
    }

    if (isTouchZoom(data)) {
      cam.currentZoom = handleZoomCameraEvent(initialCam, origin, data);
    }

    // Send *potential* camera state to parent
    sendRequestToParent({
      method: 'set_possible_camera_parameters_request',
      currentZoom: cam.currentZoom,
      horizontalOffset: cam.horizontalOffset,
      verticalOffset: cam.verticalOffset,
    });
  }

  function handleTouchEndEvent(evt: TouchEvent) {
    evt.preventDefault();

    handlePhoneSafariButtonClickRelease(evt);

    if (evt.touches.length !== 0) { return; }
    if (camera.current === null) { return; }

    const cam = camera.current;

    sendRequestToParent({
      method: 'set_camera_parameters_request',
      currentZoom: cam.currentZoom,
      verticalOffset: cam.verticalOffset,
      horizontalOffset: cam.horizontalOffset,
    });
  }

  function disableBrowserZoomTouchInteraction(element: HTMLElement): void {
    element.addEventListener('gesturestart', handleGestureStart, { passive: false });
    element.addEventListener('touchstart', handleTouchStartEvent, { passive: false });
    element.addEventListener('touchmove', handleTouchMoveEvent, { passive: true });
    element.addEventListener('touchend', handleTouchEndEvent, { passive: true });
  }

  function enableBrowserZoomTouchInteraction(element: HTMLElement): void {
    element.removeEventListener('gesturestart', handleGestureStart);
    element.removeEventListener('touchstart', handleTouchStartEvent);
    element.removeEventListener('touchmove', handleTouchMoveEvent);
    element.removeEventListener('touchend', handleTouchEndEvent);
  }

  useEffect(() => {
    applicationManager.open('/Applications/Finder.app');
    applicationManager.open('/Applications/About.app');

    console.log('phone safari: ', isPhoneSafari());

    if (ref.current) {
      disableBrowserZoomTouchInteraction(ref.current)
    }

    const handleParentEvent = handleParentResponsesClosure(initialCamera, camera);
    window.addEventListener('message', handleParentEvent, false);

    return () => {
      // Needs to be done, due to this class also opening files in the application manager
      applicationManager.reset();
      windowCompositor.reset();

      if (ref.current) {
        enableBrowserZoomTouchInteraction(ref.current);
      }

      window.removeEventListener('message', handleParentEvent, false);
    }
  }, []);

  return <>
   <div ref={ref} className={styles.operatingSystem}>
      <MenuBar manager={applicationManager}/>
      <Desktop apis={apis} manager={applicationManager} windowCompositor={windowCompositor} />
      <Dock manager={applicationManager} windowCompositor={windowCompositor}></Dock>
      <DragAndDropView apis={apis}/>
    </div>
  </>
}
