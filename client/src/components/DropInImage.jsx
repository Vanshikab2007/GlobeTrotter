import { useState } from 'react';

export default function DropInImage({ folder, name, style, fallbackStyle }) {
  const safeName = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [src, setSrc] = useState(`/images/${folder}/${safeName}.png`);
  const [failed, setFailed] = useState(false);

  function handleError() {
    if (src.endsWith('.png')) {
      setSrc(`/images/${folder}/${safeName}.jpg`);
    } else if (src.endsWith('.jpg')) {
      setSrc(`/images/${folder}/${safeName}.jpeg`);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    if (fallbackStyle) {
      return <div style={{ background: 'var(--ink-900)', ...fallbackStyle }} />;
    }
    return null;
  }

  return <img src={src} onError={handleError} style={style} alt={name} />;
}
