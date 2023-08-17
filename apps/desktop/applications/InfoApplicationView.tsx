import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';

export default function InfoApplicationView(props: WindowProps) {
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