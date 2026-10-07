import type { Side } from "../domain/session.ts";

/** 화면에 보이는 편의 이름. 접근성 이름에도 쓰인다. */
export const SIDE_LABEL: Record<Side, string> = { master: "마스터", player: "플레이어" };
