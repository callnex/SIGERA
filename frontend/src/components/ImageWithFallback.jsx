import { useEffect, useState } from "react";

export default function ImageWithFallback({ src, fallback = null, alt = "", ...props }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return fallback;
  }

  return <img {...props} src={src} alt={alt} onError={() => setFailed(true)} />;
}
