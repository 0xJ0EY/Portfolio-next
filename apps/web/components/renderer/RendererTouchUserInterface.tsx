import { ConfirmationData, MouseData, TouchData, UserInteractionEvent, UserInteractionEventBus } from "@/events/UserInteractionEvents";
import { useEffect, useState } from "react";
import { clamp } from "./util";

class ProgressCircleData {
  constructor(public x: number, public y: number, public progress: number) {}

  static fromConfirmationData(data: ConfirmationData, progress: number): ProgressCircleData {
    return new ProgressCircleData(data.x, data.y, progress);
  }
};

const ProgressCircle = (data: ProgressCircleData) => {
  const radius = 50;
  const strokeWidth = 20;

  const width = (radius + strokeWidth) * 2;
  const height = (radius + strokeWidth) * 2;

  const [x, y] = [data.x, data.y];

  const localStyle = {
    top: y - height / 2,
    left: x - width / 2,
    height,
    width,
    position: 'absolute',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none'
  } as React.CSSProperties;

  const svgStyle = {
    transform: 'rotate(-90deg)',
  };

  const progress = clamp(data.progress, 0, 1);

  const circumference = (2 * Math.PI) * radius;
  const offset = circumference * (1.0 - progress);

  return <>
    <div style={localStyle}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={svgStyle}>
        <circle r={radius} cx={width / 2} cy={height / 2} fill="transparent" stroke="#ffffff" strokeWidth={`${strokeWidth}px`}></circle>
        <circle r={radius} cx={width / 2} cy={height / 2} fill="transparent" stroke="#99e550" strokeWidth={`${strokeWidth}px`} strokeDasharray={`${circumference}px`} strokeDashoffset={`${offset}px`}></circle>
      </svg>
    </div>
  </>
}

export const HandleMouseProgressCircle = (eventBus: UserInteractionEventBus) => {
  const [viewStatus, setStatus] = useState<ProgressCircleData | null>(null);
  let localStatus: ConfirmationData | null = null;

  function clearStatus(): void {
    localStatus = null;
    setStatus(null);
  }

  function handleMouseEvent(data: MouseData): void {
    if (!localStatus) { return; }

    let status = localStatus;

    status.x = data.x;
    status.y = data.y;
  }

  function handleMouseConfirmationEvent(data: ConfirmationData): void {
    localStatus = data;
    setStatus(ProgressCircleData.fromConfirmationData(data, 0));
  }

  function handleCancelConfirmationMouseEvent(): void {
    clearStatus();
  }

  function handleUserInteractionEvent(evt: UserInteractionEvent): void {
    switch (evt.event) {
      case 'mouse_event': return handleMouseEvent(evt.data);
      case 'mouse_confirmation_event': return handleMouseConfirmationEvent(evt.data);
      case 'cancel_mouse_confirmation_event': return handleCancelConfirmationMouseEvent();
    }
  }

  function handleSuccess(): void {
    localStatus?.callbackSuccess();
    clearStatus();
  }

  function update() {
    if (localStatus === null) { return; }
  
    const now = Date.now();
    const delta = now - localStatus.creationTime;

    const progress = Math.min(delta / localStatus.durationInMS, 1.0);

    setStatus(ProgressCircleData.fromConfirmationData(localStatus, progress));

    if (progress === 1.0) { handleSuccess(); }
  }

  useEffect(() => {
    let unsubscribeHandler = eventBus.subscribe(handleUserInteractionEvent);

    const interval = setInterval(update, 0.5);

    return () => {
      unsubscribeHandler();
      clearInterval(interval);
    }
  }, []);

  if (viewStatus === null) { return <></>; }

  return ProgressCircle(viewStatus);
}

export const HandleTouchProgressCircle = (eventBus: UserInteractionEventBus) => {
    const [viewStatus, setStatus] = useState<ProgressCircleData | null>(null);
    let localStatus: ConfirmationData | null = null;
  
    function updateLocalStatus(data: ConfirmationData | null): void {
      localStatus = data;
    }

    function clearStatus(): void {
      updateLocalStatus(null);
      setStatus(null);
    }
    
    function handleTouchEvent(data: TouchData): void {
      if (!checkIfOnlyOneFinger(data)) { handleCancelation(); };
      if (!checkIfCloseByOrigin(data)) { handleCancelation(); };
    }
  
    function handleTouchConfirmationEvent(data: ConfirmationData): void {
      updateLocalStatus(data);
      setStatus(ProgressCircleData.fromConfirmationData(data, 0));
    }
  
    function checkIfOnlyOneFinger(evt: TouchData): boolean {
      return !evt.hasMoreTouchesDownThan(1);
    }
  
    function checkIfCloseByOrigin(evt: TouchData): boolean {
      if (localStatus === null) { return false; }
  
      const [ originX, originY ] = [localStatus.x, localStatus.y];
      const { x: eventX, y: eventY } = evt.pointerCoordinates();
  
      const deltaX = Math.abs(originX - eventX);
      const deltaY = Math.abs(originY - eventY);
    
      const threshold = 25;
      
      return deltaX < threshold && deltaY < threshold;
    }
    
    function handleSuccess(): void {
      localStatus?.callbackSuccess();
      clearStatus();
    };
  
    function handleCancelation(): void {
      if (localStatus?.callbackCancelation !== null) {
        localStatus?.callbackCancelation();
      }
      
      clearStatus();
    };
  
    function handleUserInteractionEvent(evt: UserInteractionEvent): void {
      switch (evt.event) {
        case 'touch_event': return handleTouchEvent(evt.data);
        case 'touch_confirmation_event': return handleTouchConfirmationEvent(evt.data);
      }
    }
  
    function update(): void {
      if (localStatus === null) { return; }
  
      const now = Date.now();
      const delta = now - localStatus.creationTime;
  
      const progress = Math.min(delta / localStatus.durationInMS, 1.0);

      setStatus(ProgressCircleData.fromConfirmationData(localStatus, progress));
  
      if (progress === 1.0) { handleSuccess(); }
    };
  
    useEffect(() => {
      let unsubscribeHandler = eventBus.subscribe(handleUserInteractionEvent);
  
      const interval = setInterval(update, 0.5);
  
      return () => {
        unsubscribeHandler();
        clearInterval(interval);
      }
    }, []);
 
    if (viewStatus === null) { return <></>}

    return ProgressCircle(viewStatus);
  }
  