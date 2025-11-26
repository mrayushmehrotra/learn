import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 300) => {
  const [debounceValue, setDebounceValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(debounceValue);
    }, delay);

    return () => clearTimeout(handler);
  }, [debounceValue, delay]);

  return debounceValue;
};
