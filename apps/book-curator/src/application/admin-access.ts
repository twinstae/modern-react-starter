import { parseAdminPassword } from "../domain/admin-password.ts";
import type { AdminAccessStore } from "./admin-access-ports.ts";
import { hashSecret, matchesSecret } from "./secret-hash.ts";

/** 운영 비밀번호를 아직 정하지 않았는지. 정하지 않았으면 운영 화면은 정하는 화면을 연다. */
export async function hasAdminPassword(store: AdminAccessStore): Promise<boolean> {
  return (await store.read()) !== null;
}

/**
 * 처음 한 번 운영 비밀번호를 정한다. 이미 있으면 바꾸지 않는다. 손님이 정하는 화면을 다시
 * 열어 비밀번호를 덮어쓸 수 없게 하기 위해서다.
 */
export async function setupAdminPassword(
  store: AdminAccessStore,
  password: string,
): Promise<"saved" | "already-set"> {
  const parsed = parseAdminPassword(password);
  if (await hasAdminPassword(store)) return "already-set";
  await store.save(await hashSecret(parsed));
  return "saved";
}

export async function verifyAdminPassword(
  store: AdminAccessStore,
  password: string,
): Promise<"ok" | "invalid" | "unset"> {
  const stored = await store.read();
  if (stored === null) return "unset";
  return (await matchesSecret(password, stored)) ? "ok" : "invalid";
}
