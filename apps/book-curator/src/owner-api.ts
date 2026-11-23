import { unlockOwner as unlockStoredOwner } from "./application/owner-access.ts";
import { recordHandover } from "./application/owner-records.ts";
import { device } from "./device.ts";
import type { HandoverInput, HandoverRecord } from "./domain/owner-record.ts";

export interface OwnerUnlock {
  readonly expiresAt: string;
}

export type OwnerUnlockResult =
  | { readonly ok: true; readonly unlock: OwnerUnlock }
  | { readonly ok: false; readonly message: string };

/** PIN을 이 기기의 해시와 맞춰 보고, 맞으면 주인 확인을 10분 연다. 열린 상태는 차례 메모리에만 둔다. */
export async function unlockOwner(pin: string): Promise<OwnerUnlockResult> {
  try {
    const result = await unlockStoredOwner(
      (await device()).ownerAccess,
      pin,
      new Date().toISOString(),
    );
    if (result.status === "unlocked") return { ok: true, unlock: { expiresAt: result.expiresAt } };
    if (result.status === "invalid") return { ok: false, message: "PIN이 맞지 않아요" };
    if (result.status === "locked") {
      return { ok: false, message: "PIN을 여러 번 틀려 잠시 잠겼어요. 1분 뒤 다시 넣어 주세요." };
    }
    return {
      ok: false,
      message: "아직 주인 PIN을 정하지 않았어요. 운영 화면에서 먼저 정해 주세요.",
    };
  } catch {
    return { ok: false, message: "PIN을 확인하지 못했어요. 다시 해 주세요." };
  }
}

/** 열쇠를 건넨 서랍을 남긴다. 추천과 건넨 서랍은 호출하는 쪽이 함께 넘긴다(R-7). */
export async function saveHandover(input: HandoverInput): Promise<HandoverRecord> {
  return recordHandover((await device()).handovers, input);
}
