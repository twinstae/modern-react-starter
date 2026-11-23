/** 운영 비밀번호의 해시 하나를 두는 저장소. 기기에 운영자는 한 명이다. */
export interface AdminAccessStore {
  read(): Promise<string | null>;
  save(passwordHash: string): Promise<void>;
}
