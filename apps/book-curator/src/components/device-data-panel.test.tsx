import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { drawersFileOf } from "../domain/device-transfer.ts";
import type { Drawer } from "../domain/drawer.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { DeviceDataPanel } from "./device-data-panel.tsx";
import * as Stories from "./device-data-panel.stories.tsx";

const jsonFile = (value: unknown) =>
  new File([JSON.stringify(value)], "서랍.json", { type: "application/json" });

describe("DeviceDataPanel", () => {
  it("태블릿에 쌓인 기록 수를 보여 주고, 기록과 서랍을 파일로 내려받는다", async () => {
    const downloaded: string[] = [];

    await runSiheom(
      given.render(
        <DeviceDataPanel
          {...Stories.deviceDataPanelArgs}
          onDownloadRecords={() => downloaded.push("기록")}
          onDownloadDrawers={() => downloaded.push("서랍")}
        />,
      ),
      assertions.a11ySnapshot(query.article("기록 내려받기"), "device-data-panel.records.snap"),
      actions.click(query.button("기록 내려받기")),
      actions.click(query.button("서랍 내보내기")),
    );

    expect(downloaded).toStrictEqual(["기록", "서랍"]);
  });

  it("서랍 파일을 고르고 바꾸기를 확인하면 이 태블릿의 서랍이 파일의 서랍으로 바뀐다", async () => {
    const imported: (readonly Drawer[])[] = [];
    const drawers = SEED_DRAWERS.slice(0, 2);

    await runSiheom(
      given.render(
        <DeviceDataPanel
          {...Stories.deviceDataPanelArgs}
          onImportDrawers={async (next) => {
            imported.push(next);
            return undefined;
          }}
        />,
      ),
      actions.upload(query.label("서랍 파일"), jsonFile(drawersFileOf(drawers))),
      assertions.textContent(query.status("읽은 서랍"), "서랍 2개, 책 6권을 읽었어요."),
      actions.click(query.button("이 서랍으로 바꾸기")),
      assertions.visible(query.alertdialog("지금 서랍을 모두 바꿀까요?")),
      actions.click(query.button("바꾸기")),
      assertions.textContent(
        query.status("가져온 결과"),
        "서랍 2개를 가져왔어요. 서랍 탭에서 확인하고 공개해 주세요.",
      ),
    );

    expect(imported).toStrictEqual([drawers]);
  });

  it("서랍 파일이 아니면 까닭을 알리고 바꾸지 않는다", async () => {
    await runSiheom(
      given.render(<DeviceDataPanel {...Stories.deviceDataPanelArgs} />),
      actions.upload(query.label("서랍 파일"), jsonFile({ kind: "book-curator/records" })),
      assertions.textContent(query.alert("서랍 파일 오류"), "서랍 내보내기 파일이 아니에요"),
    );
  });
});
