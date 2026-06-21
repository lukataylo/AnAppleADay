// Optional on-device ML native modules. They are not installed in the managed
// app so it runs in Expo Go without them; the capture hook loads them at
// runtime when present in a dev client build. Declared as any so the project
// typechecks either way. To enable real capture:
//   pnpm --filter @apple/mobile add react-native-vision-camera \
//     react-native-vision-camera-face-detector react-native-worklets-core expo-audio
//   pnpm --filter @apple/mobile exec expo prebuild
declare module "expo-audio";
declare module "react-native-vision-camera";
declare module "react-native-vision-camera-face-detector";
declare module "react-native-worklets-core";
