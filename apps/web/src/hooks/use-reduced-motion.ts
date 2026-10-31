import { useEffect, useState, useRef } from 'react';

export const use_reduced_motion = (): boolean => {
  const [reduced, setReduced] = useState<boolean>(false);
  const motionRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if the user prefers-reduced-motion media query matches
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial state
    setReduced(mql.matches);
    motionRef.current = !mql.matches;

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
      motionRef.current = !e.matches;
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', listener);
    } else {
      mql.addListener(listener);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
      } else {
        mql.removeListener(listener);
      }
    };
  }, []);

  return reduced;
};