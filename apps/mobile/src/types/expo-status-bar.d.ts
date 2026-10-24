declare module 'expo-status-bar' {
  import type { ComponentType } from 'react';
  export interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    animated?: boolean;
    hidden?: boolean;
    backgroundColor?: string;
    translucent?: boolean;
  }
  export const StatusBar: ComponentType<StatusBarProps>;
}
