import { useEffect, useState } from 'react';

// Returns `true` only after `value` has been truthy for `delay` ms.
// Use it to hide a spinner during fast loads — if the request resolves
// before the delay, the spinner never shows up at all.
export function useDeferredFlag(value, delay = 200) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!value) {
      setShown(false);
      return undefined;
    }
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return shown;
}
