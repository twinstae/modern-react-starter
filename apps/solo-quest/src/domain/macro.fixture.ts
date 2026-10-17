import type { Macro } from "./session.ts";

/** 다섯 시스템의 판정을 매크로 식으로 적은 것. 테스트와 스토리가 함께 쓴다. */
export const SYSTEM_MACROS = {
  ironsworn: "d6+{능력치:1..4}+{수정치:0..4} max10 > 2d10 => 0 실패 | 1 약한 성공 | 2 강한 성공",
  cypher:
    "d20 >= {난이도:0..10}*3 => ..-1 실패 | 0.. 성공 ; 20 큰 이득, 19 작은 이득, 1 마스터 개입",
  gurps:
    "3d6 <= {기술:3..20} => ..-10 대실패 | -9..-1 실패 | 0.. 성공 ; 3..4 !대성공, 17 !실패, 18 !대실패",
  fate: "4dF+{기술:0..5} >= {상대:0..8} => ..-1 실패 | 0 동점 | 1..2 성공 | 3.. 멋진 성공",
  dungeonWorld: "2d6+{능력치:-1..3} => ..6 실패 | 7..9 약한 성공 | 10.. 강한 성공",
};

/** 다섯 시스템의 매크로를 세션 상태의 매크로로 등록한 것 */
export const SYSTEM_MACRO_LIST: Macro[] = [
  { id: "ironsworn", name: "행동 판정", definition: SYSTEM_MACROS.ironsworn },
  { id: "cypher", name: "과제 판정", definition: SYSTEM_MACROS.cypher },
  { id: "gurps", name: "성공 판정", definition: SYSTEM_MACROS.gurps },
  { id: "fate", name: "Fate 행동", definition: SYSTEM_MACROS.fate },
  { id: "dungeon-world", name: "위험을 무릅쓰기", definition: SYSTEM_MACROS.dungeonWorld },
];
