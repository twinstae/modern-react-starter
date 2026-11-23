/**
 * PIN과 운영 비밀번호의 해시. 브라우저와 node 모두에 있는 Web Crypto만 쓴다.
 * 저장 형식은 `pbkdf2-sha256$반복$salt$hash`(16진수)다. 원문은 어디에도 남기지 않는다.
 */
const SCHEME = "pbkdf2-sha256";
const ITERATIONS = 100_000;
const KEY_BITS = 256;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string): Uint8Array | null => {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
};

async function derive(secret: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt.slice(), iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

/** 길이가 같으면 모든 바이트를 다 본다. 어디서 처음 틀렸는지가 시간으로 새지 않는다. */
const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index]! ^ b[index]!;
  return difference === 0;
};

export async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(secret, salt, ITERATIONS);
  return `${SCHEME}$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

/** 저장된 해시와 맞는지 본다. 모르는 형식은 틀린 것으로 본다. */
export async function matchesSecret(secret: string, stored: string): Promise<boolean> {
  const [scheme, iterationText, saltHex, hashHex] = stored.split("$");
  const iterations = Number(iterationText);
  const salt = fromHex(saltHex ?? "");
  const expected = fromHex(hashHex ?? "");
  if (scheme !== SCHEME || !Number.isInteger(iterations) || iterations < 1) return false;
  if (salt === null || expected === null || expected.length === 0) return false;
  return sameBytes(await derive(secret, salt, iterations), expected);
}

/** 0 이상 `max` 미만의 고른 난수. 나머지 쏠림이 없도록 넘치는 값은 버리고 다시 뽑는다. */
export function randomBelow(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0]! < limit) return buffer[0]! % max;
  }
}
