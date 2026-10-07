import { defineReducer, defineSchema, Entity, mutation, type InferEventFromSchema } from "ventyd";
import { v, valibot } from "ventyd/valibot";
import { v7 as uuidv7 } from "uuid";

import { ShortText } from "./short-text.ts";

const Character = v.object({
  id: v.string(),
  name: v.string(),
  archived: v.boolean(),
  isDefault: v.boolean(),
});

export type Character = v.InferOutput<typeof Character>;

/** 편: 기록이 마스터 쪽에서 나왔는지 플레이어 쪽에서 나왔는지 */
export const Side = v.picklist(["master", "player"]);

export type Side = v.InferOutput<typeof Side>;

/** 세션이 시작될 때 항상 있는 기본 캐릭터. 보관할 수 없다. */
export const DEFAULT_CHARACTERS: Character[] = [
  { id: "gm", name: "GM", archived: false, isDefault: true },
  { id: "player", name: "Player", archived: false, isDefault: true },
];

/** 편마다 기본 화자 */
export const DEFAULT_SPEAKER: Record<Side, string> = { master: "gm", player: "player" };

/**
 * 세션 하나가 엔티티 하나다. 브라우저와 서버가 이 스키마를 공유한다.
 * 상태는 캐릭터 목록뿐이고, 대화는 상태를 바꾸지 않는다.
 */
export const sessionSchema = defineSchema("session", {
  schema: valibot({
    event: {
      started: v.object({ characters: v.array(Character) }),
      message_posted: v.object({ side: Side, as: v.string(), content: ShortText }),
    },
    state: v.object({ characters: v.array(Character) }),
  }),
  initialEventName: "session:started",
});

export type SessionEvent = InferEventFromSchema<typeof sessionSchema>;

const sessionReducer = defineReducer(sessionSchema, (prevState, event) => {
  switch (event.eventName) {
    case "session:started":
      return { characters: event.body.characters };
    default:
      return prevState;
  }
});

/** 불변 규칙을 어긴 mutation. 사용자에게 보여 줄 수 있는 메시지를 가진다. */
export class RuleViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleViolation";
  }
}

export class Session extends Entity(sessionSchema, sessionReducer, { generateId: () => uuidv7() }) {
  /** 화자는 활성 캐릭터여야 한다. */
  #assertActiveSpeaker(characterId: string) {
    const speaker = this.state.characters.find((character) => character.id === characterId);
    if (!speaker || speaker.archived) throw new RuleViolation("말할 수 없는 캐릭터입니다");
  }

  postMessage = mutation(this, (dispatch, side: Side, as: string, text: string) => {
    const content = v.safeParse(ShortText, text);
    if (!content.success) throw new RuleViolation(content.issues[0].message);
    this.#assertActiveSpeaker(as);
    dispatch("session:message_posted", { side, as, content: content.output });
  });
}
