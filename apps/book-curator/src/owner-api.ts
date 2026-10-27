import * as v from "valibot";

import {
  parseHandoverRecord,
  type HandoverInput,
  type HandoverRecord,
} from "./domain/owner-record.ts";

/** 주인 토큰이 만료됐을 때 던진다. 라우트는 이 오류를 조용한 안내로 바꾼다. */
export class OwnerTokenExpiredError extends Error {
  constructor() {
    super("주인 확인 시간이 끝났어요");
    this.name = "OwnerTokenExpiredError";
  }
}

export interface OwnerUnlock {
  readonly token: string;
  readonly expiresAt: string;
}

export type OwnerUnlockResult =
  | { readonly ok: true; readonly unlock: OwnerUnlock }
  | { readonly ok: false; readonly message: string };

const OwnerUnlockSchema = v.strictObject({
  token: v.pipe(v.string(), v.minLength(1)),
  expiresAt: v.pipe(v.string(), v.minLength(1)),
});

const JSON_HEADERS = { "content-type": "application/json" };

const withToken = (token: string) => ({
  ...JSON_HEADERS,
  authorization: `Bearer ${token}`,
});

const unlockFailure = (status: number): string => {
  if (status === 401) return "PIN이 맞지 않아요";
  if (status === 423) return "PIN을 여러 번 틀려 잠시 잠겼어요. 1분 뒤 다시 넣어 주세요.";
  if (status === 409) return "아직 주인 PIN을 정하지 않았어요. 운영 화면에서 먼저 정해 주세요.";
  return "PIN을 확인하지 못했어요. 잠시 뒤 다시 해 주세요.";
};

/** PIN을 서버에 보내 10분짜리 주인 토큰을 받는다. 토큰은 라우트 메모리에만 둔다. */
export async function unlockOwner(pin: string): Promise<OwnerUnlockResult> {
  try {
    const response = await fetch("/api/owner/unlock", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ pin }),
    });
    if (!response.ok) return { ok: false, message: unlockFailure(response.status) };
    return { ok: true, unlock: v.parse(OwnerUnlockSchema, await response.json()) };
  } catch {
    return { ok: false, message: "PIN을 확인하지 못했어요. 잠시 뒤 다시 해 주세요." };
  }
}

/** 열쇠를 건넨 서랍을 남긴다. 추천과 건넨 서랍은 호출하는 쪽이 함께 보낸다(R-7). */
export async function postHandover(token: string, input: HandoverInput): Promise<HandoverRecord> {
  const response = await fetch("/api/owner/handover", {
    method: "POST",
    headers: withToken(token),
    body: JSON.stringify(input),
  });
  if (response.status === 401) throw new OwnerTokenExpiredError();
  if (!response.ok) throw new Error(`열쇠 건넴 기록 오류 ${response.status}`);
  return parseHandoverRecord(await response.json());
}
