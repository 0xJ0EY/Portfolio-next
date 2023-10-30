import { TouchConfirmationData, TouchData, UserInteractionEvent, UserInteractionEventBus } from "@/events/UserInteractionEvents";
import { useEffect, useState } from "react";
import { clamp } from "./util";

class ConfirmationData {
  constructor(public x: number, public y: number, public progress: number) {}

  static fromTouchConfirmationData(data: TouchConfirmationData, progress: number): ConfirmationData {
    return new ConfirmationData(data.x, data.y, progress);
  }
};

const ProgressCircle = (data: ConfirmationData) => {
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
        <circle r={radius} cx={width / 2} cy={height / 2} fill="transparent" stroke="#e0e0e0" strokeWidth={`${strokeWidth}px`}></circle>
        <circle r={radius} cx={width / 2} cy={height / 2} fill="transparent" stroke="#60e6a8" strokeWidth={`${strokeWidth}px`} strokeDasharray={`${circumference}px`} strokeDashoffset={`${offset}px`}></circle>
      </svg>
    </div>
  </>
}

export const RendererTouchUserInterface = (userInteractionEventBus: UserInteractionEventBus) => {
    const [viewStatus, setStatus] = useState<ConfirmationData | null>(null);
    let localStatus: TouchConfirmationData | null = null;
  
    const updateLocalStatus = (data: TouchConfirmationData | null): void => {
      localStatus = data;
    }

    const clearStatus = (): void => {
      updateLocalStatus(null);
      setStatus(null);
    }
    
    const handleTouchEvent = (data: TouchData): void => {
      if (!checkIfOnlyOneFinger(data)) { handleCancelation(); };
      if (!checkIfCloseByOrigin(data)) { handleCancelation(); };
    }
  
    const handleTouchConfirmationEvent = (data: TouchConfirmationData): void => {
      updateLocalStatus(data);
      setStatus(ConfirmationData.fromTouchConfirmationData(data, 0));
    }
  
    const checkIfOnlyOneFinger = (evt: TouchData): boolean => {
      return !evt.hasMoreTouchesDownThan(1);
    }
  
    const checkIfCloseByOrigin = (evt: TouchData): boolean => {
      if (localStatus === null) { return false; }
  
      const [ originX, originY ] = [localStatus.x, localStatus.y];
      const { x: eventX, y: eventY } = evt.pointerCoordinates();
  
      const deltaX = Math.abs(originX - eventX);
      const deltaY = Math.abs(originY - eventY);
    
      const threshold = 25;
      
      return deltaX < threshold && deltaY < threshold;
    }
    
    const handleSuccess = (): void => {
      localStatus?.callbackSuccess();
      clearStatus();
    };
  
    const handleCancelation = (): void => {
      if (localStatus?.callbackCancelation !== null) {
        localStatus?.callbackCancelation();
      }
      
      clearStatus();
    };
  
    const handleUserInteractionEvent = (evt: UserInteractionEvent) => {
      switch (evt.event) {
        case 'touch_event': return handleTouchEvent(evt.data);
        case 'touch_confirmation_event': return handleTouchConfirmationEvent(evt.data);
      }
    }
  
    const update = () => {
      if (localStatus === null) { return; }
  
      const now = Date.now();
      const delta = now - localStatus.creationTime;
  
      const progress = Math.min(delta / localStatus.durationInMS, 1.0);

      setStatus(ConfirmationData.fromTouchConfirmationData(localStatus, progress));
  
      if (progress === 1.0) { handleSuccess(); }
    };
  
    useEffect(() => {
      let unsubscribeHandler = userInteractionEventBus.subscribe(handleUserInteractionEvent);
  
      const interval = setInterval(update, 0.5);
  
      return () => {
        unsubscribeHandler();
        clearInterval(interval);
      }
    }, []);
 
    if (viewStatus === null) { return <></>}

    return ProgressCircle(viewStatus);
  }
  