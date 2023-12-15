import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';

export default function InfoApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const [time, _] = useState(Date.now());

  function onClickButton() {
    application.apis.sound.play('/sounds/meow.mp3', 0.25);
  }

  useEffect(() => { 
    return () => { }
  }, []);

  return (
    <>
      <button onClick={onClickButton}>click me</button>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: `url(http://192.168.178.134:8080/waifu?t=${time})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}></div>
    </>
  )
} 