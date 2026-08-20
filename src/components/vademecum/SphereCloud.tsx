import React, { useState, useEffect, useRef, useMemo } from 'react';
import { haptic } from '@/lib/nativeHaptics';

interface SphereCloudProps {
  tags: string[];
  onSelect: (tag: string) => void;
  radius?: number;
}

export function SphereCloud({ tags, onSelect, radius = 140 }: SphereCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  
  const points = useMemo(() => {
    const n = tags.length;
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2; 
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pts.push({ x, y, z, tag: tags[i] });
    }
    return pts;
  }, [tags]);

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0.003, y: 0.003 });

  useEffect(() => {
    let animationFrameId: number;
    const update = () => {
      if (!isDragging.current) {
        setRotationX(prev => prev + velocity.current.x);
        setRotationY(prev => prev + velocity.current.y);
        
        // Slight friction to auto-rotation speed over time to keep it smooth
        velocity.current.x = velocity.current.x * 0.99 + 0.002 * 0.01;
        velocity.current.y = velocity.current.y * 0.99 + 0.002 * 0.01;
      }
      animationFrameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    setRotationX(prev => prev - dy * 0.01);
    setRotationY(prev => prev + dx * 0.01);
    velocity.current = { x: -dy * 0.005, y: dx * 0.005 };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center w-full my-4 touch-none"
      style={{ height: radius * 2.2 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {points.map((pt, i) => {
        // Rotate around Y
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.x * sinY + pt.z * cosY;
        // Rotate around X
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = pt.y * sinX + z1 * cosX;
        
        // Z2 goes from -1 to 1. If 1, it's in front.
        const scale = (z2 + 2) / 2.5; 
        const opacity = Math.max(0.15, (z2 + 1.5) / 2.5);
        const zIndex = Math.round(z2 * 100);
        
        return (
          <div
            key={i}
            className="absolute whitespace-nowrap px-3.5 py-2 rounded-xl bg-secondary/80 border border-white/5 text-[12px] font-medium text-foreground/90 backdrop-blur-md shadow-xl select-none flex items-center justify-center"
            style={{
              transform: `translate3d(${x1 * radius}px, ${y2 * radius}px, 0) scale(${scale})`,
              opacity,
              zIndex,
              willChange: 'transform, opacity',
              cursor: isDragging.current ? 'grabbing' : 'pointer',
              transition: isDragging.current ? 'none' : 'opacity 0.1s ease',
            }}
            onClick={(e) => {
               // Ignore click if moving fast
               if (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01) return;
               haptic.selection();
               onSelect(pt.tag);
            }}
          >
            {pt.tag}
          </div>
        );
      })}
    </div>
  );
}
