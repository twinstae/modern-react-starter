import {
  parseAdminMe,
  parseAdminShelf,
  parsePublishedQuestionSetVersions,
  parsePublishQuestionSetResult,
  parseQuestionSetDraft,
  parseQuestionSetDraftList,
  parseQuestionSetDraftReport,
  type AdminCredentials,
  type AdminMe,
  type AdminShelf,
  type PublishedQuestionSetVersionDto,
  type PublishQuestionSetResultDto,
  type QuestionSetDraftDto,
  type QuestionSetDraftReportDto,
  type QuestionSetDraftSummaryDto,
} from "./admin-dto.ts";
import { parseBook, type Book, type BookInput } from "./domain/book.ts";
import { toQuestionSetDto, type DrawerCode, type QuestionSet } from "./domain/question-set.ts";

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
  if (code === "DRAFT_NOT_FOUND") return new Error("없는 질문 세트 초안이에요");
  if (code === "INVALID_QUESTION_SET") {
    return new Error("질문 세트를 저장할 수 없어요. 빈 문장과 겹친 핵심 단어를 확인해 주세요");
  }
  if (code === "PUBLISH_BLOCKED") return new Error("점검을 통과하지 못해 공개하지 않았어요");
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

const questionSetBody = (name: string | undefined, questionSet: QuestionSet) => ({
  ...(name === undefined ? {} : { name }),
  questionSet: toQuestionSetDto(questionSet),
});

/** 초안 목록. 고치는 중인 질문 세트 전체는 담지 않고 고르는 데 필요한 값만 읽는다. */
export async function listQuestionSetDrafts(): Promise<QuestionSetDraftSummaryDto[]> {
  const response = await fetch("/api/admin/question-sets/drafts", { credentials: "include" });
  if (!response.ok) throw await failure(response, "질문 세트 초안 목록을 읽지 못했어요");
  return parseQuestionSetDraftList(await response.json());
}

export async function createQuestionSetDraft(
  name: string,
  questionSet?: QuestionSet,
): Promise<QuestionSetDraftDto> {
  const response = await fetch("/api/admin/question-sets/drafts", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(
      questionSet === undefined ? { name } : { name, questionSet: toQuestionSetDto(questionSet) },
    ),
  });
  if (!response.ok) throw await failure(response, "질문 세트 초안을 만들지 못했어요");
  return parseQuestionSetDraft(await response.json());
}

export async function clonePublishedQuestionSetDraft(): Promise<QuestionSetDraftDto> {
  const response = await fetch("/api/admin/question-sets/drafts/from-published", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw await failure(response, "공개 버전을 복제하지 못했어요");
  return parseQuestionSetDraft(await response.json());
}

export async function getQuestionSetDraft(id: string): Promise<QuestionSetDraftDto> {
  const response = await fetch(`/api/admin/question-sets/drafts/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!response.ok) throw await failure(response, "질문 세트 초안을 읽지 못했어요");
  return parseQuestionSetDraft(await response.json());
}

export async function saveQuestionSetDraft(
  id: string,
  name: string,
  questionSet: QuestionSet,
): Promise<QuestionSetDraftDto> {
  const response = await fetch(`/api/admin/question-sets/drafts/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(questionSetBody(name, questionSet)),
  });
  if (!response.ok) throw await failure(response, "질문 세트 초안을 저장하지 못했어요");
  return parseQuestionSetDraft(await response.json());
}

export async function getQuestionSetDraftReport(id: string): Promise<QuestionSetDraftReportDto> {
  const response = await fetch(`/api/admin/question-sets/drafts/${encodeURIComponent(id)}/report`, {
    credentials: "include",
  });
  if (!response.ok) throw await failure(response, "질문 세트 점검을 읽지 못했어요");
  return parseQuestionSetDraftReport(await response.json());
}

export async function publishQuestionSetDraft(id: string): Promise<PublishQuestionSetResultDto> {
  const response = await fetch(
    `/api/admin/question-sets/drafts/${encodeURIComponent(id)}/publish`,
    { method: "POST", credentials: "include" },
  );
  if (!response.ok) throw await failure(response, "질문 세트를 공개하지 못했어요");
  return parsePublishQuestionSetResult(await response.json());
}

export async function listPublishedQuestionSetVersions(): Promise<
  PublishedQuestionSetVersionDto[]
> {
  const response = await fetch("/api/admin/question-sets/versions", { credentials: "include" });
  if (!response.ok) throw await failure(response, "공개 버전 목록을 읽지 못했어요");
  return parsePublishedQuestionSetVersions(await response.json());
}
