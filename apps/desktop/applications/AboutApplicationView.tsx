import { WindowContext } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';
import { Application, ApplicationContext } from './ApplicationManager';

export default function AboutApplicationView(props: { application: Application, context: ApplicationContext, windowContext: WindowContext }) {
  const { application, context, windowContext } = props;
  const [number, setNumber] = useState(0);

  useEffect(() => { 
    return () => { }
  }, []);

  return (
    <div>
      <button onClick={() => {setNumber(number - 1)}}>-</button>
      {number}
      <button onClick={() => {setNumber(number + 1)}}>+</button>
      <button onClick={() => application.on({ kind: 'close' }, context, windowContext)}>Send event</button>
    </div>
  )
}