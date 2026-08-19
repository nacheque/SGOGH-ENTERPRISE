import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor hasta que el usuario
 * deje de escribir por una cantidad de milisegundos determinada.
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configuramos un timer cada vez que el valor cambia
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si el usuario vuelve a tipear antes de cumplirse el delay, reseteamos el timer
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}