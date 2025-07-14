import { useCallback, useRef } from "react";

export function useDebounce<T extends (...args: unknown[]) => void>(
    callback: T,
    delay: number
  ): T {
    const timeoutRef = useRef<number | undefined>(undefined);
  
    return useCallback(
      (...args: Parameters<T>) => {
        if (timeoutRef.current !== undefined) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => callback(...args), delay);
      },
      [callback, delay]
    ) as T;
  }