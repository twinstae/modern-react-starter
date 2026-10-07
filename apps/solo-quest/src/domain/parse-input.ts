export type ParsedInput =
  | { type: "message"; content: string }
  | { type: "roll"; notation: string; label?: string }
  | { type: "error"; message: string };

/**
 * 입력창에 친 글을 해석한다. `/`로 시작하지 않으면 대화이고, `/r <표기> [라벨]`이면 판정이다.
 * 표기가 올바른지는 보지 않는다(표기 파서의 일이다). 그 밖의 `/명령`은 오류다.
 */
export function parseInput(text: string): ParsedInput {
  if (!text.startsWith("/")) return { type: "message", content: text };

  const [command = ""] = text.split(/\s+/, 1);
  if (command !== "/r") return { type: "error", message: `알 수 없는 명령입니다: ${command}` };

  const args = text.slice(command.length).trim();
  const [notation = ""] = args.split(/\s+/, 1);
  if (notation === "") {
    return { type: "error", message: "굴릴 주사위 표기를 적어주세요. 예: /r 2d6+1" };
  }
  const label = args.slice(notation.length).trim();
  return label === "" ? { type: "roll", notation } : { type: "roll", notation, label };
}
