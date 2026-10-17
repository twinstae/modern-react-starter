export type ParsedInput =
  | { type: "message"; content: string }
  | { type: "roll"; notation: string; label?: string }
  | { type: "error"; message: string };

/**
 * 판정 표기가 차지하는 앞부분: 첫 토큰, 이어지는 `max<N>`, 비교 연산자와 목표.
 * 비교 연산자 뒤의 목표가 없어도 표기에 넣어, 라벨로 넘기지 않고 표기 파서가 오류를 내게 한다.
 */
const NOTATION_HEAD = /^\S+(\s+max\d+(?=\s|$))?(\s+(>=|<=|>|<)(\s+\S+)?(?=\s|$))?/i;

/**
 * 입력창에 친 글을 해석한다. `/`로 시작하지 않으면 대화이고, `/r <표기> [라벨]`이면 판정이다.
 * 표기는 첫 토큰과, 뒤따르는 `max<N>`, `<비교> <목표>`까지이고 공백 하나로 이어 붙인다.
 * 표기가 올바른지는 보지 않는다(표기 파서의 일이다). 그 밖의 `/명령`은 오류다.
 */
export function parseInput(text: string): ParsedInput {
  if (!text.startsWith("/")) return { type: "message", content: text };

  const [command = ""] = text.split(/\s+/, 1);
  if (command !== "/r") return { type: "error", message: `알 수 없는 명령입니다: ${command}` };

  const args = text.slice(command.length).trim();
  const [head = ""] = NOTATION_HEAD.exec(args) ?? [];
  if (head === "") {
    return { type: "error", message: "굴릴 주사위 표기를 적어주세요. 예: /r 2d6+1" };
  }
  const notation = head.split(/\s+/).join(" ");
  const label = args.slice(head.length).trim();
  return label === "" ? { type: "roll", notation } : { type: "roll", notation, label };
}
