import { useEffect, useState } from 'react';

function useThemeColor(token) {
  const [color, setColor] = useState('');

  useEffect(() => {
    setColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
  }, [token]);

  return color;
}

export default useThemeColor;