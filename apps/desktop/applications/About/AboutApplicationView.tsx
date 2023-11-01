import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState, useRef, RefObject } from 'react';

export default function AboutApplicationView(props: WindowProps) {
  useEffect(() => { }, []);

  return (
    <div className="contentOuter">
      <div className="content">
        <h1>Joey de Ruiter</h1>
        <h3>Software engineer</h3>
      </div>
    </div>
  )
}