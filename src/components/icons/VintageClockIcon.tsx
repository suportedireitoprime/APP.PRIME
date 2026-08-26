import React from 'react';
import { LucideProps } from 'lucide-react';

export const VintageClockIcon = (props: LucideProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M5 3L2 6"/>
    <path d="M19 3l3 3"/>
    <path d="M10 3h4"/>
    <path d="M12 1v2"/>
  </svg>
);
