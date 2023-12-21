import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';

function getTargetUrl(time: number): string {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local';

  if (env === 'local') {
    return `http://192.168.178.134:8080/waifu?t=${time}`;
  } else {
    return `https://waifu.joeyderuiter.me/waifu?t=${time}`;
  }
}

export default function InfoApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const [time, _] = useState(Date.now());
  const url = getTargetUrl(time);
  
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
        background: `url(${url})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}></div>
    </>
  )
} 