import type { Curation } from "./curate.ts";
import type { PublicShelfBookDto, PublicShelfDto } from "./kiosk.ts";
import type { DrawerId } from "./question-set.ts";

/** 주인 확인에서 보이는 서랍 하나와 그 안의 책. */
export interface OwnerDrawerView {
  readonly drawer: DrawerId;
  readonly name: string;
  readonly books: readonly PublicShelfBookDto[];
}

/** 추천·2순위 서랍은 주인에게 보여 줄 상태 문장을 함께 가진다. */
export interface OwnerStatementDrawer extends OwnerDrawerView {
  readonly statement: string;
}

/** 주인 확인 view model. 점수 숫자는 없고, 다른 서랍으로 건넬 수 있게 모든 서랍을 담는다. */
export interface OwnerView {
  readonly recommended: OwnerStatementDrawer;
  readonly second: OwnerStatementDrawer;
  readonly similar: boolean;
  readonly drawers: readonly OwnerDrawerView[];
}

/**
 * 큐레이션 결과에 공개 서가를 붙여 주인 확인 view model을 만든다.
 * 추천 서랍은 `curation.ranking.first`, 2순위는 `second`다.
 */
export function ownerView(curation: Curation, shelf: PublicShelfDto): OwnerView {
  const drawers: OwnerDrawerView[] = curation.drawers.map(({ id, name }) => ({
    drawer: id,
    name,
    books: shelf.drawers.find(({ drawer }) => drawer === id)?.books ?? [],
  }));
  const find = (id: DrawerId): OwnerDrawerView => {
    const drawer = drawers.find((entry) => entry.drawer === id);
    if (drawer === undefined) throw new Error(`주인 확인에 없는 서랍입니다: ${id}`);
    return drawer;
  };

  return {
    recommended: { ...find(curation.ranking.first), statement: curation.statements.first },
    second: { ...find(curation.ranking.second), statement: curation.statements.second },
    similar: curation.ranking.similar,
    drawers,
  };
}
