import * as v from "valibot";

/** 화면 글꼴 선택지. 값은 `styles.css`의 `html[data-font]` 선택자와 같아야 한다. */
export const FONT_IDS = ["kimyui", "microorganism", "noto"] as const;

const FontIdSchema = v.picklist(FONT_IDS);

export type FontId = v.InferOutput<typeof FontIdSchema>;

export const DEFAULT_FONT_ID: FontId = "noto";

export const FONT_STORAGE_KEY = "book-curator.font";

export const FONT_OPTIONS = [
  { id: "kimyui", label: "나눔손글씨 김유이체" },
  { id: "microorganism", label: "미생체" },
  { id: "noto", label: "Noto Sans KR" },
] as const satisfies readonly { readonly id: FontId; readonly label: string }[];

/** 저장소에 남은 값은 경계다. 모르는 값은 기본 글꼴로 되돌린다. */
export function parseFontPreference(value: unknown): FontId {
  const parsed = v.safeParse(FontIdSchema, value);
  return parsed.success ? parsed.output : DEFAULT_FONT_ID;
}

export function readFontPreference(): FontId {
  if (typeof window === "undefined") return DEFAULT_FONT_ID;
  try {
    return parseFontPreference(window.localStorage.getItem(FONT_STORAGE_KEY));
  } catch {
    return DEFAULT_FONT_ID;
  }
}

export function applyFontPreference(id: FontId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = id;
}

/** 태블릿 브라우저에만 저장한다. 다음 방문에도 같은 글꼴로 열린다. */
export function saveFontPreference(id: FontId) {
  try {
    window.localStorage.setItem(FONT_STORAGE_KEY, id);
  } catch {
    // 저장소를 쓸 수 없어도 이번 화면에는 적용한다.
  }
  applyFontPreference(id);
}

/**
 * 첫 페인트 전에 저장된 글꼴을 붙이는 인라인 스크립트. 서버가 그린 HTML은 기본 글꼴이라
 * 화면이 잠깐 바뀌는 것을 막는다.
 */
export const FONT_BOOTSTRAP_SCRIPT = `(function(){try{var id=localStorage.getItem(${JSON.stringify(
  FONT_STORAGE_KEY,
)});if(${JSON.stringify(FONT_IDS)}.indexOf(id)<0)id=${JSON.stringify(
  DEFAULT_FONT_ID,
)};document.documentElement.dataset.font=id;}catch(e){document.documentElement.dataset.font=${JSON.stringify(
  DEFAULT_FONT_ID,
)};}})();`;
