import { useState, useEffect } from 'react';
import {
  DEFAULT_VADEMECUM_FONT_SIZE,
  VADEMECUM_FONT_SIZE_KEY,
  VADEMECUM_FONT_FAMILY_KEY,
  VADEMECUM_LINE_HEIGHT_KEY,
  VADEMECUM_BIONIC_READING_KEY,
  VADEMECUM_READING_GUIDE_KEY,
  type VadeMecumFontFamily,
  type VadeMecumLineHeight,
} from './artigoConstants';

export function useArtigoTypography() {
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(VADEMECUM_FONT_SIZE_KEY);
      if (saved && saved !== '18') return Number(saved);
      return DEFAULT_VADEMECUM_FONT_SIZE;
    } catch {
      return DEFAULT_VADEMECUM_FONT_SIZE;
    }
  });

  const [fontFamily, setFontFamily] = useState<VadeMecumFontFamily>(() => {
    try {
      const saved = localStorage.getItem(VADEMECUM_FONT_FAMILY_KEY);
      if (saved === 'serif' || saved === 'mono' || saved === 'sans') return saved;
      return 'sans';
    } catch {
      return 'sans';
    }
  });

  const [lineHeight, setLineHeight] = useState<VadeMecumLineHeight>(() => {
    try {
      const saved = localStorage.getItem(VADEMECUM_LINE_HEIGHT_KEY);
      if (saved === '1.6' || saved === '1.8' || saved === '2.1') return saved;
      return '1.8';
    } catch {
      return '1.8';
    }
  });

  const [bionicReading, setBionicReading] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VADEMECUM_BIONIC_READING_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [readingGuide, setReadingGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VADEMECUM_READING_GUIDE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VADEMECUM_FONT_SIZE_KEY, String(fontSize));
    } catch {}
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(VADEMECUM_FONT_FAMILY_KEY, fontFamily);
    } catch {}
  }, [fontFamily]);

  useEffect(() => {
    try {
      localStorage.setItem(VADEMECUM_LINE_HEIGHT_KEY, lineHeight);
    } catch {}
  }, [lineHeight]);

  useEffect(() => {
    try {
      localStorage.setItem(VADEMECUM_BIONIC_READING_KEY, String(bionicReading));
    } catch {}
  }, [bionicReading]);

  useEffect(() => {
    try {
      localStorage.setItem(VADEMECUM_READING_GUIDE_KEY, String(readingGuide));
    } catch {}
  }, [readingGuide]);

  return {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    bionicReading,
    setBionicReading,
    readingGuide,
    setReadingGuide,
  };
}
