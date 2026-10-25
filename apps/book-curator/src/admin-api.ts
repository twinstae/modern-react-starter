import {
  parseAdminMe,
  parseAdminShelf,
  type AdminCredentials,
  type AdminMe,
  type AdminShelf,
} from "./admin-dto.ts";
import { parseBook, type Book, type BookInput } from "./domain/book.ts";
import type { DrawerCode } from "./domain/question-set.ts";

const JSON_HEADERS = { "content-type": "application/json" };

const errorCode = async (response: Response): Promise<string | undefined> => {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof body.code === "string"
    ) {
      return body.code;
    }
  } catch {
    // 본문이 JSON이 아니면 상태 코드만으로 안내한다.
  }
  return undefined;
};

const failure = async (response: Response, fallback: string): Promise<Error> => {
  if (response.status === 401) return new Error("로그인이 풀렸어요. 다시 로그인해 주세요");

  const code = await errorCode(response);
  if (code === "NO_PUBLISHED_QUESTION_SET") {
    return new Error("공개된 질문 세트가 없어요. 질문 세트를 먼저 공개해 주세요");
  }
  if (code === "BOOK_NOT_FOUND") return new Error("서가에 없는 책이에요");
  if (code === "UNKNOWN_DRAWER") return new Error("없는 서랍이에요");
  if (response.status === 422) return new Error("입력 값을 다시 확인해 주세요");
  return new Error(fallback);
};

const parseBookResponse = async (response: Response): Promise<Book> =>
  parseBook(await response.json());

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

/** 운영자 서가. 책·서랍 속 책·서랍 이름·게이트를 한 번에 읽는다. */
export async function getAdminShelf(): Promise<AdminShelf> {
  const response = await fetch("/api/admin/shelf", { credentials: "include" });
  if (!response.ok) throw await failure(response, "서가를 읽지 못했어요");
  return parseAdminShelf(await response.json());
}

export async function createAdminBook(input: BookInput): Promise<Book> {
  const response = await fetch("/api/admin/books", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await failure(response, "책을 저장하지 못했어요");
  return parseBookResponse(response);
}

export async function updateAdminBook(id: string, input: BookInput): Promise<Book> {
  const response = await fetch(`/api/admin/books/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await failure(response, "책을 저장하지 못했어요");
  return parseBookResponse(response);
}

export async function setDrawerQuantity(
  drawer: DrawerCode,
  bookId: string,
  quantity: number,
): Promise<void> {
  const response = await fetch(`/api/admin/drawers/${drawer}/books/${encodeURIComponent(bookId)}`, {
    method: "PUT",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ quantity }),
  });
  if (response.status !== 204) throw await failure(response, "수량을 저장하지 못했어요");
}

export async function removeDrawerBook(drawer: DrawerCode, bookId: string): Promise<void> {
  const response = await fetch(`/api/admin/drawers/${drawer}/books/${encodeURIComponent(bookId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (response.status !== 204) throw await failure(response, "책을 빼지 못했어요");
}
