import { useEffect, useState } from 'react';

export default function LazyComponent() {
  const [number, setNumber] = useState(0);

  useEffect(() => { 
    console.log('bound');
    return () => { console.log('unbound'); }
  }, []);

  return (
    <div>
      <button onClick={() => {setNumber(number - 1)}}>-</button>
      {number}
      <button onClick={() => {setNumber(number + 1)}}>+</button>
    </div>
  )
}