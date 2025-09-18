declare module '@env' {
  export const KAKAO_MAPS_JAVASCRIPT_KEY: string;
  export const GOOGLE_MAPS_API_KEY: string;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}