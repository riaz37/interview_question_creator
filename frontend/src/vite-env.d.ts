/// <reference types="vite/client" />

// Add type declarations for file formats
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

// Extend the Window interface if needed
interface Window {
  // Add any global browser APIs or extensions here
  [key: string]: unknown;
}
