import { useState, useEffect } from 'react';

export default function DropInImage({ folder, name, coverOverride, style, fallbackStyle }) {
  const safeName = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [src, setSrc] = useState(coverOverride || `/images/${folder}/${safeName}.png`);
  const [failed, setFailed] = useState(false);

  // If coverOverride changes (e.g. user just uploaded a new photo), update src
  useEffect(() => {
    if (coverOverride) {
      setSrc(coverOverride);
      setFailed(false);
    }
  }, [coverOverride]);

  function handleError() {
    if (coverOverride && src === coverOverride) {
      // If the override failed, fall back to the drop-in default
      setSrc(`/images/${folder}/${safeName}.png`);
    } else if (src.endsWith('.png')) {
      setSrc(`/images/${folder}/${safeName}.jpg`);
    } else if (src.endsWith('.jpg')) {
      setSrc(`/images/${folder}/${safeName}.jpeg`);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    if (fallbackStyle) {
      return <div style={{ background: 'var(--surface-sunken)', ...fallbackStyle }} />;
    }
    return null;
  }

  return <img src={src} onError={handleError} style={style} alt={name} />;
}
