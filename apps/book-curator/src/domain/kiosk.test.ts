import { describe, expect, it } from "vite-plus/test";

import {
  parseKioskCurrent,
  toKioskCurrentDto,
  toPublicQuestionSetDto,
} from "./kiosk.ts";
import { SEED_QUESTION_SET } from "./seed-question-set.ts";

describe("키오스크 묶음", () => {
  it("공개 버전이 없으면 준비 중이다", () => {
    expect(toKioskCurrentDto(null)).toStrictEqual({ status: "preparing" });
    expect(parseKioskCurrent({ status: "preparing" })).toStrictEqual({ status: "preparing" });
  });

  it("공개 질문 세트에서 관리자용 기준 응답과 주인용 서랍 표시를 뺀다", () => {
    const publicSet = toPublicQuestionSetDto(SEED_QUESTION_SET);

    expect(publicSet).not.toHaveProperty("baselines");
    expect(publicSet.drawers).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ code, name, order, statement }) => ({
        code,
        name,
        order,
        statement,
      })),
    );
    expect(publicSet.drawers.every((drawer) => !("mark" in drawer))).toBe(true);
  });

  it("공개 묶음을 받으면 기준 응답이 빈 질문 세트로 파싱한다", () => {
    const bundle = parseKioskCurrent(toKioskCurrentDto({ version: 2, questionSet: SEED_QUESTION_SET }));

    expect(bundle.status).toBe("ready");
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.version).toBe(2);
    expect(bundle.questionSet.questions).toStrictEqual(SEED_QUESTION_SET.questions);
    expect(bundle.questionSet.baselines).toStrictEqual([]);
  });

  it("응답 모양에 모르는 필드가 있으면 거부한다", () => {
    expect(() =>
      parseKioskCurrent({
        status: "ready",
        version: 1,
        questionSet: toPublicQuestionSetDto(SEED_QUESTION_SET),
        nickname: "토끼",
      }),
    ).toThrow();
  });
});
