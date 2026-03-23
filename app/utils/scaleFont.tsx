import { PixelRatio } from "react-native";

const scaleFont = (size : number) => {
  const scale = Math.max(1, PixelRatio.getFontScale());
  const clampedScale = Math.min(scale, 1.5);
  return Math.round(size * clampedScale);
};

export default scaleFont;