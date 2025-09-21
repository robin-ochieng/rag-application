"use client";
import React from "react";

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

export function PinIcon({ size = 16, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M16 3l5 5-7 7-4 1 1-4 7-7z" />
      <path d="M2 22l6-6" />
    </svg>
  );
}

export function BulbIcon({ size = 16, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M2 10a8 8 0 1 1 16 0c0 3-2 5-3 6H5c-1-1-3-3-3-6z" />
    </svg>
  );
}

export function CopyIcon({ size = 16, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function DotsIcon({ size = 16, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
