import { SVGProps } from 'react';

export function FlashcardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
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
      <path d="M8 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
      <rect x="4" y="6" width="12" height="16" rx="2" />
      <path d="M16 16v-2a4 4 0 0 0-4-4H8" />
      <path d="M10 8l-2 2 2 2" />
    </svg>
  );
}
