import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { SessionLog } from "./session-log.tsx";
import * as Stories from "./session-log.stories.tsx";

describe("SessionLog", () => {
  it("기록이 없으면 안내를 보여 준다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Empty.args} />),
      assertions.textContent(query.region("세션 로그"), "아직 기록이 없습니다"),
    );
  });

  it("기록 하나에 편과 화자 이름, 내용이 보인다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.One.args} />),
      assertions.textContent(query.listitem("마스터 GM"), "문이 열린다"),
    );
  });

  it("마스터 편과 플레이어 편 기록이 각자의 화자 이름으로 섞여 나온다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Ten.args} />),
      assertions.count(query.listitem(/^마스터 GM$/), 5),
      assertions.count(query.listitem(/^플레이어 Player$/), 5),
    );
  });

  it("마크다운 문법을 해석하지 않고 쓴 글자 그대로 보여 준다", async () => {
    // toHaveTextContent는 공백을 정규화하므로 줄바꿈 자체는 확인하지 못한다(pre-wrap 스타일이 맡는다)
    await runSiheom(
      given.render(<SessionLog {...Stories.PlainText.args} />),
      assertions.textContent(query.listitem("마스터 GM"), "첫 줄 **둘째 줄** `코드` # 제목"),
    );
  });

  it("판정 항목에 표기와 주사위별 값, 합계, 라벨이 보인다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Mixed.args} />),
      assertions.textContent(query.listitem("플레이어 Player"), "2d6+1"),
      assertions.textContent(query.listitem("플레이어 Player"), "[4, 6] + 1"),
      assertions.textContent(query.listitem("플레이어 Player"), "= 11"),
      assertions.textContent(query.listitem("플레이어 Player"), "자물쇠 따기"),
      assertions.textContent(query.listitem("마스터 경비병"), "d20-1"),
      assertions.textContent(query.listitem("마스터 경비병"), "[13] - 1"),
      assertions.textContent(query.listitem("마스터 경비병"), "= 12"),
    );
  });

  it("라벨이 없는 판정에는 라벨 자리가 없다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Mixed.args} />),
      // 라벨이 있는 판정 하나뿐이다
      assertions.count(query.note("판정 라벨"), 1),
    );
  });

  it("마스터 판정은 왼쪽, 플레이어 판정은 오른쪽에 정렬된다", async () => {
    await runSiheom(given.render(<SessionLog {...Stories.Mixed.args} />));

    const alignOf = (name: string) =>
      getComputedStyle(screen.getByRole("listitem", { name })).alignSelf;
    expect(alignOf("마스터 경비병")).toBe("flex-start");
    expect(alignOf("플레이어 Player")).toBe("flex-end");
  });

  it("같은 편의 같은 화자가 이어 말하면 이름을 다시 보이지 않는다", async () => {
    await runSiheom(given.render(<SessionLog {...Stories.Consecutive.args} />));

    // 내용 앞에 보이는 글자가 화자 이름이다. 이름을 숨겨도 항목의 접근성 이름에는 편과 화자가 남는다.
    const shown = Stories.Consecutive.args.entries.map((entry, index) => {
      const item = screen.getAllByRole("listitem")[index];
      return entry.kind === "message" ? item?.textContent?.split(entry.content)[0] : undefined;
    });
    expect(shown).toStrictEqual(["GM", "", "Player", "GM", "GM"]);
  });

  it("이름이 같아도 다른 캐릭터가 이어 말하면 묶음이 나뉘어 이름이 다시 보인다", async () => {
    await runSiheom(given.render(<SessionLog {...Stories.ArchivedSpeaker.args} />));

    const shown = Stories.ArchivedSpeaker.args.entries.map((entry, index) => {
      const item = screen.getAllByRole("listitem")[index];
      return entry.kind === "message" ? item?.textContent?.split(entry.content)[0] : undefined;
    });
    expect(shown).toStrictEqual(["경비병", "", "경비병", ""]);
  });
});
