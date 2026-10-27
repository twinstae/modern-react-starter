import { adminErrorMessage } from "../../admin-api.ts";
import { MutedText, WarningText } from "../../ui/index.ts";

export const messageOf = adminErrorMessage;

/** loader가 서버 상태를 읽는 동안 보여 줄 안내. 라우트마다 무엇을 읽는지만 다르다. */
export const pendingText = (text: string) =>
  function Pending() {
    return <MutedText role="status">{text}</MutedText>;
  };

/** loader가 실패했을 때의 안내. 다시 열면 loader가 다시 읽는다. */
export function LoadError({ error }: { error: unknown }) {
  return <WarningText role="alert">{messageOf(error)}</WarningText>;
}
