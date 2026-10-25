import * as v from "valibot";

import { BookSchema } from "./domain/book.ts";
import { DrawerCodeSchema } from "./domain/question-set.ts";
import { DrawerStockSchema, ShelfGateSchema } from "./domain/shelf.ts";

/** 운영자 서가 응답. 서랍 이름·표시는 공개 버전에서 읽기 전용으로 온다. */
export const AdminShelfSchema = v.strictObject({
  drawers: v.array(
    v.strictObject({
      code: DrawerCodeSchema,
      name: v.pipe(v.string(), v.minLength(1)),
      mark: v.nullable(v.pipe(v.string(), v.minLength(1))),
    }),
  ),
  books: v.array(BookSchema),
  stock: DrawerStockSchema,
  gate: ShelfGateSchema,
});

export type AdminShelf = v.InferOutput<typeof AdminShelfSchema>;

export function parseAdminShelf(value: unknown): AdminShelf {
  return v.parse(AdminShelfSchema, value);
}

/** 운영자 세션 응답의 경계 스키마. 서버 응답과 화면이 같은 스키마를 쓴다. */
export const AdminMeSchema = v.strictObject({
  user: v.strictObject({
    id: v.string(),
    name: v.string(),
    email: v.string(),
  }),
});

export type AdminMe = v.InferOutput<typeof AdminMeSchema>;

/** 로그인 폼이 운영 API로 넘기는 값. 비밀번호는 화면 밖으로 저장하지 않는다. */
export interface AdminCredentials {
  email: string;
  password: string;
}

export function parseAdminMe(value: unknown): AdminMe {
  return v.parse(AdminMeSchema, value);
}
