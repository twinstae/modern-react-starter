import { parseAdminMe, type AdminCredentials, type AdminMe } from "./admin-dto.ts";
import { api } from "./api-client.ts";
import type { BookInput } from "./domain/drawer.ts";
import { ApiError, unwrap } from "./unwrap.ts";

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

/**
 * 운영 API 오류를 화면 문구로 바꾼다. 서버가 보낸 코드가 있으면 그 코드로 고르고,
 * 모르는 오류는 다시 해 보라고만 한다.
 */
export function adminErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "잠시 뒤 다시 시도해 주세요";
  if (error.status === 401) return "로그인이 풀렸어요. 다시 로그인해 주세요";
  const code =
    typeof error.value === "object" && error.value !== null && "code" in error.value
      ? error.value.code
      : undefined;
  if (code === "DRAWER_NOT_FOUND") return "없는 서랍이에요. 목록을 다시 열어 주세요";
  if (code === "BOOK_NOT_FOUND") return "이 서랍에 없는 책이에요";
  if (code === "PUBLISH_BLOCKED") return "점검을 통과하지 못해 공개하지 않았어요";
  if (error.status === 422) return "입력 값을 다시 확인해 주세요";
  return "잠시 뒤 다시 시도해 주세요";
}

const drawer = (id: string) => api.admin.drawers({ id });

export const listDrawers = () => unwrap(api.admin.drawers.get());

export const createDrawer = (name: string) => unwrap(api.admin.drawers.post({ name }));

export const updateDrawer = (
  id: string,
  change: { readonly name?: string; readonly questions?: readonly string[] },
) =>
  unwrap(
    drawer(id).patch({
      ...(change.name === undefined ? {} : { name: change.name }),
      ...(change.questions === undefined ? {} : { questions: [...change.questions] }),
    }),
  );

export const deleteDrawer = async (id: string): Promise<void> => {
  await unwrap(drawer(id).delete());
};

/** 여러 권을 한 번에 올린다. CSV 업로드와 한 권 추가가 함께 쓴다. */
export const addBooks = (id: string, books: readonly BookInput[]) =>
  unwrap(drawer(id).books.post({ books: [...books] }));

export const updateBook = (id: string, bookId: string, input: BookInput) =>
  unwrap(drawer(id).books({ bookId }).put(input));

export const removeBook = (id: string, bookId: string) =>
  unwrap(drawer(id).books({ bookId }).delete());

export const getPublishCheck = () => unwrap(api.admin["publish-check"].get());

export const publishDrawers = () => unwrap(api.admin.publish.post());

export const listPublishedVersions = () => unwrap(api.admin["published-versions"].get());

/** 새 주인 PIN을 만든다. 이 응답에서만 원문을 볼 수 있다. */
export const generateOwnerPin = async (): Promise<string> =>
  (await unwrap(api.admin["owner-pin"].post())).pin;
