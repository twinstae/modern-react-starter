/** 값을 JSON 파일로 내려받게 한다. 태블릿 브라우저의 "다운로드"에 저장된다. */
export function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // 내려받기가 시작된 뒤에 주소를 놓는다. 바로 놓으면 일부 브라우저가 받지 못한다.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
