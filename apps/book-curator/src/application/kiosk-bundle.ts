import { parseKioskCurrent, toKioskCurrentDto, type KioskBundle } from "../domain/kiosk.ts";
import type { PublishedVersionStore } from "./published-version-ports.ts";

/** 손님이 시작할 때 받는 묶음. 가장 최근 공개 버전이고, 없으면 "준비 중"이다. */
export async function currentKioskBundle(versions: PublishedVersionStore): Promise<KioskBundle> {
  return parseKioskCurrent(toKioskCurrentDto(await versions.current()));
}
