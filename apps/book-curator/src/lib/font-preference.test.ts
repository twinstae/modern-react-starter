import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  applyFontPreference,
  DEFAULT_FONT_ID,
  FONT_STORAGE_KEY,
  parseFontPreference,
  readFontPreference,
  saveFontPreference,
} from "./font-preference.ts";

afterEach(() => {
  localStorage.removeItem(FONT_STORAGE_KEY);
  delete document.documentElement.dataset.font;
});

describe("font preference", () => {
  it("모르는 값은 기본 글꼴로 읽는다", () => {
    expect(parseFontPreference("unknown")).toBe(DEFAULT_FONT_ID);
    expect(parseFontPreference(null)).toBe(DEFAULT_FONT_ID);
  });

  it("고른 글꼴을 저장하고, 다음에 그 글꼴로 읽는다", () => {
    saveFontPreference("microorganism");

    expect(readFontPreference()).toBe("microorganism");
    expect(document.documentElement.dataset.font).toBe("microorganism");
  });

  it("적용만 하면 저장하지 않는다", () => {
    applyFontPreference("noto");

    expect(document.documentElement.dataset.font).toBe("noto");
    expect(readFontPreference()).toBe(DEFAULT_FONT_ID);
  });
});
