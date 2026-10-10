import { useState, useEffect, useCallback } from 'react';

export type TextSize = 'normal' | 'large' | 'xl';

const STORAGE_KEY = 'g-math-text-size';
const VALID_SIZES: TextSize[] = ['normal', 'large', 'xl'];

function getStoredSize(): TextSize {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_SIZES.includes(stored as TextSize)) {
      return stored as TextSize;
    }
  } catch {
    // localStorage unavailable
  }
  return 'normal';
}

function applyTextSize(size: TextSize) {
  document.documentElement.setAttribute('data-text-size', size);
}

// Apply stored preference immediately (before React hydration)
applyTextSize(getStoredSize());

export function useTextSize() {
  const [textSize, setTextSizeState] = useState<TextSize>(getStoredSize);

  useEffect(() => {
    applyTextSize(textSize);
  }, [textSize]);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const cycle = useCallback(() => {
    setTextSize(
      textSize === 'normal' ? 'large' : textSize === 'large' ? 'xl' : 'normal'
    );
  }, [textSize, setTextSize]);

  return { textSize, setTextSize, cycle };
}
