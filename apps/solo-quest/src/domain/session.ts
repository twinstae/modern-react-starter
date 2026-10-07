import {
  createRepository,
  defineReducer,
  defineSchema,
  Entity,
  mutation,
  type Adapter,
} from "ventyd";
import { v, valibot } from "ventyd/valibot";
import { v7 as uuidv7 } from "uuid";

import { RolledTerm, type RollResult } from "./dice.ts";
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
 * 이벤트 정의는 여기 `event` 한 곳이다. 이벤트를 추가하려면 여기에 본문을 적고 reducer를 고치면 된다.
 * 상태는 캐릭터 목록뿐이고, 대화는 상태를 바꾸지 않는다.
 */
export const sessionSchema = defineSchema("session", {
  schema: valibot({
    event: {
      started: v.object({ characters: v.array(Character) }),
      message_posted: v.object({ side: Side, as: v.string(), content: ShortText }),
      /** 굴린 결과가 확정된 판정. 재생할 때 다시 굴리지 않는다. */
      dice_rolled: v.object({
        side: Side,
        as: v.string(),
        notation: v.string(),
        terms: v.array(RolledTerm),
        total: v.pipe(v.number(), v.integer()),
        label: v.optional(ShortText),
      }),
    },
    state: v.object({ characters: v.array(Character) }),
  }),
  initialEventName: "session:started",
});

/** 저장된 이벤트에는 버전이 반드시 있다(ventyd 타입에서는 optional이다). */
export type SessionEvent = ReturnType<typeof sessionSchema.parseEvent> & { version: number };

/**
 * 서버가 받은 이벤트를 검증하는 스키마. 별도 정의 없이 ventyd 스키마의 `parseEvent`를 그대로 쓴다.
 * ventyd가 검사하지 않는 것(이 엔티티의 이벤트인지, 버전이 있는지)만 더한다.
 */
export const SessionEventSchema = v.pipe(
  v.unknown(),
  v.rawTransform(({ dataset, addIssue, NEVER }): SessionEvent => {
    try {
      const event = sessionSchema.parseEvent(dataset.value);
      if (event.entityName !== "session" || event.version === undefined) {
        addIssue({ message: "세션의 이벤트가 아니거나 버전이 없습니다" });
        return NEVER;
      }
      return { ...event, version: event.version };
    } catch (error) {
      addIssue({ message: error instanceof Error ? error.message : "이벤트가 올바르지 않습니다" });
      return NEVER;
    }
  }),
);

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

  /** 이미 굴린 결과를 판정으로 남긴다. 라벨이 없으면 생략한다. */
  rollDice = mutation(
    this,
    (dispatch, side: Side, as: string, notation: string, result: RollResult, label?: string) => {
      const parsedLabel = label === undefined ? undefined : v.safeParse(ShortText, label);
      if (parsedLabel && !parsedLabel.success)
        throw new RuleViolation(parsedLabel.issues[0].message);
      this.#assertActiveSpeaker(as);
      dispatch("session:dice_rolled", {
        side,
        as,
        notation,
        terms: result.terms,
        total: result.total,
        ...(parsedLabel && { label: parsedLabel.output }),
      });
    },
  );
}

export const createSessionRepository = (adapter: Adapter<typeof sessionSchema>) =>
  createRepository(Session, { adapter });
