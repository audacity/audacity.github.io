import { useState, useEffect } from 'react';
import platform from 'platform';

const useBrowserOS = () => {
  // Define the state with an explicit string type or null
  const [browserOS, setBrowserOS] = useState<string | null>(null);

  useEffect(() => {
    // Set the OS using the platform library, ensuring it's a string
    const detectedOS = platform.os?.family ?? 'Unknown OS';
    setBrowserOS(detectedOS);
  }, []);

  return browserOS;
};

export default useBrowserOS;