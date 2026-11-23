import * as v from "valibot";

import {
  hasAdminPassword,
  setupAdminPassword,
  verifyAdminPassword,
} from "./application/admin-access.ts";
import {
  addBooks as addDrawerBooks,
  checkPublish,
  createDrawer as createStoredDrawer,
  publish,
  PublishBlockedError,
  updateBook as updateDrawerBook,
  updateDrawer as updateStoredDrawer,
} from "./application/drawer-admin.ts";
import {
  exportDrawers,
  exportRecords,
  importDrawers as replaceDrawers,
} from "./application/device-transfer.ts";
import { BookNotFoundError, DrawerNotFoundError } from "./application/drawer-ports.ts";
import { generateOwnerPin as generateStoredOwnerPin } from "./application/owner-access.ts";
import {
  toPublishCheckDto,
  type AdminAccess,
  type PublishCheckDto,
  type PublishedVersionSummaryDto,
} from "./admin-dto.ts";
import { device } from "./device.ts";
import { transferFileName } from "./domain/device-transfer.ts";
import type { BookInput, Drawer } from "./domain/drawer.ts";
import { downloadJson } from "./lib/download.ts";

/**
 * 운영 화면이 부르는 일들. 서버 없이 이 기기의 저장소 위에서 유스케이스를 바로 부른다.
 * 로그인 상태는 탭 메모리에만 있어, 새로 고치거나 앱을 다시 열면 다시 로그인한다.
 */
let signedIn = false;

export async function getAdminAccess(): Promise<AdminAccess> {
  if (!(await hasAdminPassword((await device()).adminAccess))) return "unset";
  return signedIn ? "signed-in" : "signed-out";
}

/** 처음 한 번 운영 비밀번호를 정하고 바로 들어간다. 실패하면 화면에 보일 까닭을 돌려준다. */
export async function setupAdmin(password: string): Promise<string | undefined> {
  try {
    const result = await setupAdminPassword((await device()).adminAccess, password);
    if (result === "already-set")
      return "이미 운영 비밀번호를 정했어요. 그 비밀번호로 들어가 주세요";
    signedIn = true;
    return undefined;
  } catch (error) {
    return adminErrorMessage(error);
  }
}

export async function signInAdmin(password: string): Promise<string | undefined> {
  try {
    const result = await verifyAdminPassword((await device()).adminAccess, password);
    if (result === "unset") return "아직 운영 비밀번호를 정하지 않았어요";
    if (result === "invalid") return "비밀번호가 맞지 않아요";
    signedIn = true;
    return undefined;
  } catch {
    return "비밀번호를 확인하지 못했어요. 다시 해 주세요";
  }
}

export function signOutAdmin(): void {
  signedIn = false;
}

/** 운영 화면의 오류를 화면 문구로 바꾼다. 모르는 오류는 다시 해 보라고만 한다. */
export function adminErrorMessage(error: unknown): string {
  if (error instanceof DrawerNotFoundError) return "없는 서랍이에요. 목록을 다시 열어 주세요";
  if (error instanceof BookNotFoundError) return "이 서랍에 없는 책이에요";
  if (error instanceof PublishBlockedError) return "점검을 통과하지 못해 공개하지 않았어요";
  if (error instanceof v.ValiError) return "입력 값을 다시 확인해 주세요";
  return "잠시 뒤 다시 시도해 주세요";
}

export const listDrawers = async (): Promise<Drawer[]> => (await device()).drawers.list();

export const createDrawer = async (name: string): Promise<Drawer> =>
  createStoredDrawer((await device()).drawers, name, crypto.randomUUID());

export const updateDrawer = async (
  id: string,
  change: { readonly name?: string; readonly questions?: readonly string[] },
): Promise<Drawer> => updateStoredDrawer((await device()).drawers, id, change);

export const deleteDrawer = async (id: string): Promise<void> =>
  (await device()).drawers.remove(id);

/** 여러 권을 한 번에 올린다. CSV 업로드와 한 권 추가가 함께 쓴다. */
export const addBooks = async (id: string, books: readonly BookInput[]): Promise<Drawer> =>
  addDrawerBooks((await device()).drawers, id, books, () => crypto.randomUUID());

export const updateBook = async (id: string, bookId: string, input: BookInput): Promise<Drawer> =>
  updateDrawerBook((await device()).drawers, id, bookId, input);

export const removeBook = async (id: string, bookId: string): Promise<Drawer> =>
  (await device()).drawers.removeBook(id, bookId);

export const getPublishCheck = async (): Promise<PublishCheckDto> =>
  toPublishCheckDto(checkPublish(await (await device()).drawers.list()));

export const publishDrawers = async (): Promise<{ version: number }> => {
  const { drawers, versions } = await device();
  const { version } = await publish(drawers, versions);
  return { version };
};

export const listPublishedVersions = async (): Promise<PublishedVersionSummaryDto[]> =>
  (await (await device()).versions.list()).map(({ version, questionSet }) => ({
    version,
    drawerCount: questionSet.drawers.length,
    questionCount: questionSet.questions.length,
  }));

/** 새 주인 PIN을 만든다. 해시만 남으므로 이때만 원문을 볼 수 있다. */
export const generateOwnerPin = async (): Promise<string> =>
  generateStoredOwnerPin((await device()).ownerAccess);

/** 이 태블릿에 쌓인 기록의 수. 기록 탭이 내려받기 전에 보여 준다. */
export const getRecordCounts = async (): Promise<{ events: number; handovers: number }> => {
  const { events, handovers } = await device();
  return { events: (await events.list()).length, handovers: (await handovers.list()).length };
};

export const downloadRecords = async (): Promise<void> => {
  const { events, handovers } = await device();
  const now = new Date().toISOString();
  downloadJson(transferFileName("기록", now), await exportRecords(events, handovers, now));
};

export const downloadDrawers = async (): Promise<void> => {
  downloadJson(
    transferFileName("서랍", new Date().toISOString()),
    await exportDrawers((await device()).drawers),
  );
};

/** 가져온 서랍으로 이 기기의 서랍을 모두 바꾼다. 실패하면 화면에 보일 까닭을 돌려준다. */
export const importDrawers = async (drawers: readonly Drawer[]): Promise<string | undefined> => {
  try {
    await replaceDrawers((await device()).drawers, drawers);
    return undefined;
  } catch (error) {
    return adminErrorMessage(error);
  }
};
