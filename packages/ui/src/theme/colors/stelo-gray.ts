import { defineSemanticTokens } from "@pandacss/dev";

// trpg-stelo의 회색 면과 글자색. 변형(solid, subtle...)은 gray 팔레트가 이 단계들을 가리켜서 따라온다.
export const steloGray = defineSemanticTokens.colors({
  "1": { value: { _light: "#ffffff", _dark: "#121212" } },
  "2": { value: { _light: "#faf9f8", _dark: "#171716" } },
  "3": { value: { _light: "#f4f3f1", _dark: "#1d1c1b" } },
  "4": { value: { _light: "#ebe9e6", _dark: "#2a2928" } },
  "5": { value: { _light: "#e3e1de", _dark: "#2e2e2e" } },
  "6": { value: { _light: "#dcdcdc", _dark: "#383736" } },
  "7": { value: { _light: "#cfcdca", _dark: "#474645" } },
  "8": { value: { _light: "#b5b3b0", _dark: "#5f5e5c" } },
  "9": { value: { _light: "#8d8b88", _dark: "#7a7978" } },
  "10": { value: { _light: "#767676", _dark: "#8f8f8f" } },
  "11": { value: { _light: "#5c5c5c", _dark: "#a8a8a8" } },
  "12": { value: { _light: "#141414", _dark: "#eaeaea" } },
  a1: { value: { _light: "#00000003", _dark: "#ffffff12" } },
  a2: { value: { _light: "#49240007", _dark: "#fffff417" } },
  a3: { value: { _light: "#3724000e", _dark: "#fff6ed1d" } },
  a4: { value: { _light: "#331f0019", _dark: "#fff9f32a" } },
  a5: { value: { _light: "#27170021", _dark: "#ffffff2e" } },
  a6: { value: { _light: "#00000023", _dark: "#fffaf638" } },
  a7: { value: { _light: "#180e0035", _dark: "#fffbf847" } },
  a8: { value: { _light: "#100a004f", _dark: "#fffcf75f" } },
  a9: { value: { _light: "#0b060077", _dark: "#fffdfb7a" } },
  a10: { value: { _light: "#00000089", _dark: "#ffffff8f" } },
  a11: { value: { _light: "#000000a3", _dark: "#ffffffa8" } },
  a12: { value: { _light: "#000000eb", _dark: "#ffffffea" } },
});
