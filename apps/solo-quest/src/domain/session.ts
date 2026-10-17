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

import { RolledCheck, RolledTerm, type RollResult } from "./dice.ts";
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

/** 화자가 될 수 있는 캐릭터. 보관된 캐릭터는 빠진다. */
export const activeCharacters = (characters: Character[]) =>
  characters.filter((character) => !character.archived);

/** 편마다 기본 화자 */
export const DEFAULT_SPEAKER: Record<Side, string> = { master: "gm", player: "player" };

/**
 * 세션 하나가 엔티티 하나다. 브라우저와 서버가 이 스키마를 공유한다.
 * 이벤트 정의는 여기 `event` 한 곳이다. 이벤트를 추가하려면 여기에 본문을 적고 reducer를 고치면 된다.
 * 상태는 캐릭터 목록뿐이다. 캐릭터를 더하고 보관하는 이벤트만 상태를 바꾸고, 대화와 판정은 바꾸지 않는다.
 */
export const sessionSchema = defineSchema("session", {
  schema: valibot({
    event: {
      started: v.object({ characters: v.array(Character) }),
      character_added: v.object({ characterId: v.string(), name: ShortText }),
      character_archived: v.object({ characterId: v.string() }),
      message_posted: v.object({ side: Side, as: v.string(), content: ShortText }),
      /** 굴린 결과가 확정된 판정. 재생할 때 다시 굴리지 않는다. */
      dice_rolled: v.object({
        side: Side,
        as: v.string(),
        notation: v.string(),
        terms: v.array(RolledTerm),
        total: v.pipe(v.number(), v.integer()),
        /** 비교 판정이면 있다. `terms`, `total`은 액션 쪽이다. */
        check: v.optional(RolledCheck),
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
    case "session:character_added":
      return {
        characters: [
          ...prevState.characters,
          { id: event.body.characterId, name: event.body.name, archived: false, isDefault: false },
        ],
      };
    case "session:character_archived":
      return {
        characters: prevState.characters.map((character) =>
          character.id === event.body.characterId ? { ...character, archived: true } : character,
        ),
      };
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

/** 짧은 글 규칙을 지킨 글을 돌려주고, 어기면 사용자에게 보여 줄 메시지로 RuleViolation을 던진다. */
function parseShortText(text: string): string {
  const parsed = v.safeParse(ShortText, text);
  if (!parsed.success) throw new RuleViolation(parsed.issues[0].message);
  return parsed.output;
}

export class Session extends Entity(sessionSchema, sessionReducer, { generateId: () => uuidv7() }) {
  /** 화자는 활성 캐릭터여야 한다. */
  #assertActiveSpeaker(characterId: string) {
    const speaker = this.state.characters.find((character) => character.id === characterId);
    if (!speaker || speaker.archived) throw new RuleViolation("말할 수 없는 캐릭터입니다");
  }

  /** 이름만 가진 활성 캐릭터를 더한다. id는 호출하는 쪽이 정한다. 이름은 짧은 글 규칙을 따른다. */
  addCharacter = mutation(this, (dispatch, characterId: string, name: string) => {
    const parsed = parseShortText(name);
    const taken = activeCharacters(this.state.characters).some(({ name }) => name === parsed);
    if (taken) throw new RuleViolation("같은 이름의 캐릭터가 이미 있습니다");
    dispatch("session:character_added", { characterId, name: parsed });
  });

  /** 캐릭터를 보관한다. 지워지지 않고 더 이상 화자가 될 수 없다. */
  archiveCharacter = mutation(this, (dispatch, characterId: string) => {
    const character = this.state.characters.find(({ id }) => id === characterId);
    if (!character) throw new RuleViolation("없는 캐릭터입니다");
    if (character.isDefault) throw new RuleViolation("기본 캐릭터는 보관할 수 없습니다");
    if (character.archived) throw new RuleViolation("이미 보관된 캐릭터입니다");
    dispatch("session:character_archived", { characterId });
  });

  postMessage = mutation(this, (dispatch, side: Side, as: string, text: string) => {
    const content = parseShortText(text);
    this.#assertActiveSpeaker(as);
    dispatch("session:message_posted", { side, as, content });
  });

  /** 이미 굴린 결과를 판정으로 남긴다. 라벨이 없으면 생략한다. */
  rollDice = mutation(
    this,
    (dispatch, side: Side, as: string, notation: string, result: RollResult, label?: string) => {
      const parsedLabel = label === undefined ? undefined : parseShortText(label);
      this.#assertActiveSpeaker(as);
      dispatch("session:dice_rolled", {
        side,
        as,
        notation,
        terms: result.terms,
        total: result.total,
        ...(result.check && { check: result.check }),
        ...(parsedLabel !== undefined && { label: parsedLabel }),
      });
    },
  );
}

export const createSessionRepository = (adapter: Adapter<typeof sessionSchema>) =>
  createRepository(Session, { adapter });
