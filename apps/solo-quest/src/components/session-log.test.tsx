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
});
