/** `crypto.getRandomValues` 기반의 0 이상 1 미만 난수. 도메인이 아니라 앱 배선에서만 쓴다. */
export const browserRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
