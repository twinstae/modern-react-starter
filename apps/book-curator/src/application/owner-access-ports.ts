/** 저장된 주인 잠금 상태. PIN 원문은 어디에도 두지 않고 해시만 둔다. */
export interface OwnerAccess {
  pinHash: string;
  failedAttempts: number;
  /** 잠긴 동안의 마지막 시각(ISO). 잠겨 있지 않으면 null. */
  lockedUntil: string | null;
}

/** 주인 PIN의 저장소. 한 가게에 PIN은 하나이므로 접근 상태는 한 줄이다. */
export interface OwnerAccessStore {
  read(): Promise<OwnerAccess | null>;
  save(access: OwnerAccess): Promise<void>;
}
