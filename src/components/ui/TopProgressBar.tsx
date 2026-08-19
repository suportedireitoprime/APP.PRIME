import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

let activeRequests = 0;
let subscribers: ((isLoading: boolean) => void)[] = [];

const notify = () => {
  const isLoading = activeRequests > 0;
  subscribers.forEach((sub) => sub(isLoading));
};

export const startProgress = () => {
  activeRequests++;
  notify();
};

export const stopProgress = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

export const TopProgressBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Para garantir que a barra não fique presa na navegação
    stopProgress();
  }, [location.pathname]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const handleStateChange = (loading: boolean) => {
      if (loading) {
        setIsLoading(true);
        setVisible(true);
        setProgress(5);
        // Anima a barra progressivamente até 90%
        intervalId = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(intervalId);
              return 90;
            }
            const inc = (100 - prev) * 0.05;
            return prev + inc;
          });
        }, 200);
      } else {
        clearInterval(intervalId);
        setProgress(100);
        
        // Mantém 100% por um instante, e depois some
        timeoutId = setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
          }, 300); // Aguarda o fade out do CSS
        }, 300);
      }
    };

    subscribers.push(handleStateChange);
    return () => {
      subscribers = subscribers.filter((sub) => sub !== handleStateChange);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isLoading && !visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 w-full h-[3px] z-[99999] pointer-events-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out shadow-[0_0_10px_theme('colors.primary.DEFAULT')]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
