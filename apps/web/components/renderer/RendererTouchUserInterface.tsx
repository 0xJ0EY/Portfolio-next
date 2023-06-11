import { TouchConfirmationData, TouchData, UserInteractionEvent, UserInteractionEventBus } from "@/events/UserInteractionEvents";
import { useEffect, useState } from "react";

export const RendererTouchUserInterface = (userInteractionEventBus: UserInteractionEventBus) => {
    const [viewStatus, setStatus] = useState<TouchConfirmationData | null>(null);
    let localStatus: TouchConfirmationData | null = null;
  
    const updateStatus = (data: TouchConfirmationData | null): void => {
      localStatus = data;
      setStatus(data);
    }
    
    const handleTouchEvent = (data: TouchData): void => {
      if (!checkIfOnlyOneFinger(data)) { handleCancelation(); };
      if (!checkIfCloseByOrigin(data)) { handleCancelation(); };
    }
  
    const handleTouchConfirmationEvent = (data: TouchConfirmationData): void => {
      updateStatus(data); 
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
      updateStatus(null);
    };
  
    const handleCancelation = (): void => {
      if (localStatus?.callbackCancelation !== null) {
        localStatus?.callbackCancelation();
      }
      
      updateStatus(null);
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
  
    if (viewStatus === null) { return <>no status</>}
  
    return <>{viewStatus.x} {viewStatus.y}</>
  }
  