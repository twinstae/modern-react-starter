import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { Oracle } from "../domain/oracle.ts";
import { OracleManager } from "./oracle-manager.tsx";
import * as Stories from "./oracle-manager.stories.tsx";

/** 저장·삭제가 넘어온 값을 담아 두는 자리를 만들고, 그 자리를 함께 보는 스토리 args를 돌려준다. */
function setup() {
  const calls: { saved?: Oracle; removed?: string } = {};
  const args = {
    ...Stories.Seeded.args,
    onSave: async (oracle: Oracle) => {
      calls.saved = oracle;
      return undefined;
    },
    onRemove: async (oracleId: string) => {
      calls.removed = oracleId;
      return undefined;
    },
  };
  return { calls, args };
}

describe("OracleManager", () => {
  it("왼쪽에 분류와 묶음으로 나뉜 목록이 보인다", async () => {
    await runSiheom(
      given.render(<OracleManager {...Stories.Seeded.args} />),
      assertions.visible(query.heading("철의 맹세")),
      assertions.visible(query.heading("일반")),
      assertions.visible(query.button("행동 열기")),
      assertions.visible(query.button("문제 열기")),
      assertions.visible(query.heading("집안 규칙")),
      assertions.visible(query.heading("인물")),
      assertions.visible(query.button("이름 열기")),
    );
  });

  it("이름으로 찾으면 그 오라클만 남는다", async () => {
    await runSiheom(
      given.render(<OracleManager {...Stories.Seeded.args} />),
      actions.fill(query.textbox("오라클 찾기"), "문제"),
      assertions.visible(query.button("문제 열기")),
      assertions.not.visible(query.button("행동 열기")),
      assertions.not.visible(query.heading("집안 규칙")),
    );
  });

  it("오라클을 고르면 오른쪽에 상세가 열리고, 고쳐 저장하면 그 값이 넘어간다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      assertions.visible(query.region("행동 상세")),
      assertions.value(query.textbox("오라클 이름"), "행동"),
      assertions.value(query.combobox("분류"), "철의 맹세"),
      assertions.value(query.combobox("묶음"), "일반"),
      actions.fill(query.textbox("1번째 줄 결과"), "꾸민다 (고침)"),
      actions.click(query.button("저장")),
    );

    expect(calls.saved).toMatchObject({
      id: "action",
      name: "행동",
      category: "철의 맹세",
      group: "일반",
      sides: 100,
      kind: "ranges",
      rows: [
        { min: 1, max: 50, result: "꾸민다 (고침)" },
        { min: 51, max: 100, result: "불러낸다" },
      ],
    });
  });

  it("새 오라클은 주사위에 맞춘 한 칸씩 표로 시작한다", async () => {
    await runSiheom(
      given.render(<OracleManager {...Stories.Seeded.args} />),
      actions.click(query.button("새 오라클")),
      assertions.visible(query.region("새 오라클")),
      assertions.visible(query.textbox("1번 칸")),
      assertions.visible(query.textbox("100번 칸")),
    );
  });

  it("새 오라클은 구간으로 바꾸면 표 전체를 한 줄로 묶고, 그대로 저장할 수 있다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("새 오라클")),
      actions.fill(query.textbox("오라클 이름"), "날씨"),
      actions.click(query.combobox("방식")),
      actions.click(query.option("구간")),
      assertions.not.expanded(query.combobox("방식")),
      assertions.visible(query.textbox("1번째 줄 결과")),
      assertions.not.visible(query.textbox("2번째 줄 결과")),
      actions.fill(query.textbox("1번째 줄 결과"), "폭풍"),
      actions.click(query.button("저장")),
    );

    expect(calls.saved).toMatchObject({
      name: "날씨",
      kind: "ranges",
      sides: 100,
      rows: [{ min: 1, max: 100, result: "폭풍" }],
    });
  });

  it("붙여넣은 글을 표에 채운다", async () => {
    await runSiheom(
      given.render(<OracleManager {...Stories.Seeded.args} />),
      actions.click(query.button("새 오라클")),
      actions.click(query.button("표 붙여넣기 열기")),
      actions.fill(query.textbox("표 붙여넣기"), "가{Enter}나"),
      actions.click(query.button("붙여넣기 적용")),
      assertions.value(query.textbox("1번 칸"), "가"),
      assertions.value(query.textbox("2번 칸"), "나"),
      assertions.value(query.textbox("3번 칸"), ""),
    );
  });

  it("붙여넣은 글을 읽지 못하면 이유를 보여 준다", async () => {
    await runSiheom(
      given.render(<OracleManager {...Stories.Seeded.args} />),
      actions.click(query.button("새 오라클")),
      actions.click(query.combobox("방식")),
      actions.click(query.option("구간")),
      actions.click(query.button("표 붙여넣기 열기")),
      actions.fill(query.textbox("표 붙여넣기"), "가나다"),
      actions.click(query.button("붙여넣기 적용")),
      assertions.visible(query.alert('1번째 줄: 범위를 "53-54, 절벽"처럼 적어주세요: 가나다')),
    );
  });

  it("줄마다 설명과 링크를 적어 저장할 수 있다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      actions.fill(query.textbox("1번째 줄 설명"), "높은 곳에 있다"),
      actions.fill(
        query.textbox("1번째 줄 링크"),
        "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
      ),
      actions.click(query.button("저장")),
    );

    expect(calls.saved?.rows[0]).toStrictEqual({
      min: 1,
      max: 50,
      result: "꾸민다",
      description: "높은 곳에 있다",
      url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
    });
    // 곁들임을 적지 않은 줄에는 그 칸이 없다
    expect(calls.saved?.rows[1]).toStrictEqual({ min: 51, max: 100, result: "불러낸다" });
  });

  it("주소가 아닌 링크는 저장하지 않고 이유를 보여 준다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      actions.fill(query.textbox("1번째 줄 링크"), "trpg-stelo.netlify.app"),
      actions.click(query.button("저장")),
      assertions.visible(query.alert("1–50: 링크는 http://나 https://로 시작하는 주소여야 합니다")),
    );

    expect(calls.saved).toBeUndefined();
  });

  it("붙여넣은 표가 이어지지 않으면 저장하지 않고 이유를 보여 준다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      actions.fill(query.spinbutton("1번째 줄 끝"), "40"),
      actions.click(query.button("저장")),
      assertions.visible(query.alert("범위가 이어지지 않습니다: 41")),
    );

    expect(calls.saved).toBeUndefined();
  });

  it("지우는 일은 확인 창을 거친다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      actions.click(query.button("오라클 삭제")),
      assertions.visible(query.dialog("오라클 삭제")),
      actions.click(query.within(query.dialog("오라클 삭제"), query.button("삭제 확인"))),
      assertions.not.visible(query.region("행동 상세")),
    );

    expect(calls.removed).toBe("action");
  });

  it("확인 창에서 취소하면 지우지 않는다", async () => {
    const { calls, args } = setup();

    await runSiheom(
      given.render(<OracleManager {...args} />),
      actions.click(query.button("행동 열기")),
      actions.click(query.button("오라클 삭제")),
      actions.click(query.within(query.dialog("오라클 삭제"), query.button("취소"))),
      assertions.not.visible(query.dialog("오라클 삭제")),
    );

    expect(calls.removed).toBeUndefined();
  });
});
