import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

import { parseOwnerPin } from "../domain/owner-pin.ts";
import type { OwnerAccessStore } from "./owner-access-ports.ts";

/** 주인 토큰은 10분만 산다. 태블릿 메모리에만 두고 저장소·쿠키에 넣지 않는다. */
export const OWNER_TOKEN_TTL_MS = 10 * 60 * 1_000;
/** 연속 5번 틀리면 60초 동안 잠근다. */
export const OWNER_LOCK_FAILURES = 5;
export const OWNER_LOCK_MS = 60 * 1_000;

const SCRYPT_KEY_BYTES = 32;

export type UnlockResult =
  | { status: "unlocked"; token: string; expiresAt: string }
  | { status: "no-pin" }
  | { status: "locked" }
  | { status: "invalid" };

const nowMs = (now: string) => Date.parse(now);

const at = (ms: number): string => new Date(ms).toISOString();

function scryptKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_BYTES, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/** PIN은 salt를 붙여 scrypt로 해시한다. 저장 형식은 `scrypt$salt$hash`다. */
async function hashOwnerPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptKey(pin, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

async function matchesOwnerPin(pin: string, stored: string): Promise<boolean> {
  const [scheme, salt, expectedHex] = stored.split("$");
  if (scheme !== "scrypt" || salt === undefined || expectedHex === undefined) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scryptKey(pin, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const hashOwnerToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** 주인 토큰 원문. 32바이트 난수라 추측할 수 없고, 저장소에는 해시만 남는다. */
const createOwnerToken = (): string => randomBytes(32).toString("base64url");

/** 새 주인 PIN. 숫자 6자리 난수다. */
const createOwnerPin = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0");

/**
 * 주인 PIN을 새로 만든다. 운영자가 정하지 않고 생성한 값을 한 번만 보여 준다.
 * 저장소에는 해시만 남으므로 잊으면 다시 생성한다. 실패 횟수와 잠금도 함께 푼다.
 */
export async function generateOwnerPin(
  store: OwnerAccessStore,
  newPin: () => string = createOwnerPin,
): Promise<string> {
  const pin = newPin();
  await setOwnerPin(store, pin);
  return pin;
}

/** 운영자가 PIN을 정하거나 바꾼다. PIN을 바꾸면 실패 횟수와 잠금을 함께 푼다. */
export async function setOwnerPin(store: OwnerAccessStore, pin: string): Promise<void> {
  const parsed = parseOwnerPin(pin);
  await store.save({
    pinHash: await hashOwnerPin(parsed),
    failedAttempts: 0,
    lockedUntil: null,
  });
}

/**
 * PIN을 확인해 짧은 주인 토큰을 만든다. 틀리면 실패 횟수를 남기고, 한도를 넘으면 잠근다.
 * 잠긴 동안에는 맞는 PIN도 받지 않는다. 시각은 주입받아 테스트가 시간을 움직일 수 있다.
 */
export async function unlockOwner(
  store: OwnerAccessStore,
  pin: string,
  now: string,
  generateToken: () => string = createOwnerToken,
): Promise<UnlockResult> {
  let parsed: string;
  try {
    parsed = parseOwnerPin(pin);
  } catch {
    return { status: "invalid" };
  }

  const access = await store.read();
  if (access === null) return { status: "no-pin" };

  const currentMs = nowMs(now);
  let failedAttempts = access.failedAttempts;
  let lockedUntil = access.lockedUntil;

  if (lockedUntil !== null) {
    if (nowMs(lockedUntil) > currentMs) return { status: "locked" };
    // 잠금 시간이 지났으면 실패 횟수도 처음부터 센다.
    failedAttempts = 0;
    lockedUntil = null;
  }

  if (!(await matchesOwnerPin(parsed, access.pinHash))) {
    failedAttempts += 1;
    if (failedAttempts >= OWNER_LOCK_FAILURES) {
      await store.save({
        ...access,
        failedAttempts,
        lockedUntil: at(currentMs + OWNER_LOCK_MS),
      });
      return { status: "locked" };
    }
    await store.save({ ...access, failedAttempts, lockedUntil: null });
    return { status: "invalid" };
  }

  const token = generateToken();
  const expiresAt = at(currentMs + OWNER_TOKEN_TTL_MS);
  await store.save({ ...access, failedAttempts: 0, lockedUntil: null });
  await store.addToken(hashOwnerToken(token), expiresAt);
  return { status: "unlocked", token, expiresAt };
}

/** 주인 API가 받은 베어러 토큰이 아직 살아 있는지 확인한다. */
export async function verifyOwnerToken(
  store: OwnerAccessStore,
  token: string,
  now: string,
): Promise<boolean> {
  if (token === "") return false;
  return store.hasValidToken(hashOwnerToken(token), now);
}
