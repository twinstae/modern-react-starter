import { parseAdminMe, type AdminMe } from "./admin-dto.ts";
import type { AdminCredentials } from "./components/admin-login.tsx";

const JSON_HEADERS = { "content-type": "application/json" };

/** 운영자 세션을 읽는다. 로그인하지 않았으면 401이라 null을 돌려준다. */
export async function getAdminMe(): Promise<AdminMe | null> {
  const response = await fetch("/api/admin/me", { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`운영자 세션 오류 ${response.status}`);
  return parseAdminMe(await response.json());
}

/** better-auth 이메일 로그인. 쿠키는 httpOnly라 브라우저가 들고 있고, 화면은 다시 세션을 읽는다. */
export async function signInAdmin({
  email,
  password,
}: AdminCredentials): Promise<string | undefined> {
  try {
    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) return undefined;
    if (response.status === 401) return "이메일이나 비밀번호가 맞지 않아요";
    return "로그인하지 못했어요. 잠시 뒤 다시 해 주세요.";
  } catch {
    return "로그인하지 못했어요. 잠시 뒤 다시 해 주세요.";
  }
}

export async function signOutAdmin(): Promise<void> {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
}

/** PIN을 정하거나 바꾼다. 성공하면 undefined, 실패하면 화면에 보일 문구를 돌려준다. */
export async function saveOwnerPin(pin: string): Promise<string | undefined> {
  try {
    const response = await fetch("/api/admin/owner-pin", {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ pin }),
    });
    if (response.status === 204) return undefined;
    if (response.status === 401) return "로그인이 풀렸어요. 다시 로그인해 주세요";
    if (response.status === 422) return "PIN은 숫자 4~6자리로 입력해 주세요";
    return "PIN을 저장하지 못했어요. 잠시 뒤 다시 해 주세요.";
  } catch {
    return "PIN을 저장하지 못했어요. 잠시 뒤 다시 해 주세요.";
  }
}
