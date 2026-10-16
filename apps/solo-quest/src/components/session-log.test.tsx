import { describe, it } from "vitest";
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
      assertions.textContents(query.list("세션 로그"), [/^GM문이 열린다/]),
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
      assertions.textContents(query.list("세션 로그"), [/^GM첫 줄 \*\*둘째 줄\*\* `코드` # 제목/]),
    );
  });

  it("판정 항목에 표기와 주사위별 값, 합계, 라벨이 보인다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Mixed.args} />),
      assertions.textContents(query.list("세션 로그"), [
        /^GM자물쇠가 걸려 있다/,
        /^Player자물쇠 따기2d6\+1 · \[4, 6\] \+ 1 = 11/,
        /^경비병d20-1 · \[13\] - 1 = 12/,
      ]),
    );
  });

  it("라벨이 없는 판정에는 라벨 자리가 없다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Mixed.args} />),
      // 라벨이 있는 판정 하나뿐이다
      assertions.count(query.note("판정 라벨"), 1),
    );
  });

  it("같은 편의 같은 화자가 이어 말하면 이름을 다시 보이지 않는다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Consecutive.args} />),
      // 내용 앞에 보이는 글자가 화자 이름이다. 이름을 숨겨도 항목의 접근성 이름에는 편과 화자가 남는다.
      assertions.textContents(query.list("세션 로그"), [
        /^GM문이 열린다/,
        /^안은 어둡다/,
        /^Player들어간다/,
        /^GM바닥이 삐걱인다/,
        /^GM혼잣말/,
      ]),
    );
  });

  it("이름이 같아도 다른 캐릭터가 이어 말하면 묶음이 나뉘어 이름이 다시 보인다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.ArchivedSpeaker.args} />),
      assertions.textContents(query.list("세션 로그"), [
        /^경비병멈춰라/,
        /^누구냐/,
        /^경비병교대할 시간이다/,
        /^조용하군/,
      ]),
    );
  });

  it("보관된 캐릭터의 지난 기록에도 편과 이름이 보인다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.ArchivedSpeaker.args} />),
      assertions.count(query.listitem(/^마스터 경비병$/), 4),
    );
  });

  it("저장 중인 기록과 저장하지 못한 기록에는 각각 표시가 보이고, 저장된 기록에는 없다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Unsaved.args} />),
      assertions.textContents(query.list("세션 로그"), [
        /^GM문이 열린다/,
        /^Player안으로 들어간다.*저장 중$/,
        /^GM안은 어둡다.*실패$/,
      ]),
    );
  });
});
