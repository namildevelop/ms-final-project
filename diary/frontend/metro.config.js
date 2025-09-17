const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// SVG를 컴포넌트로 import하려면 아래 설정 필요 (설치 전이면 무시돼도 OK)
try {
  config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
  config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
} catch (e) {}

module.exports = config;
