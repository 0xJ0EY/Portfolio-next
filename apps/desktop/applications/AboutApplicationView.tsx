import { WindowContext } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';
import { Application } from './ApplicationManager';

export default function AboutApplicationView(props: { application: Application, windowContext: WindowContext }) {
  const { application, windowContext } = props;
  const [number, setNumber] = useState(0);

  useEffect(() => { 
    return () => { }
  }, []);

  return (
    <div>
      <button onClick={() => {setNumber(number - 1)}}>-</button>
      {number}
      <button onClick={() => {setNumber(number + 1)}}>+</button>
      <button onClick={() => application.on({ kind: 'application-quit' }, windowContext)}>Send event</button>
    </div>
  )
}