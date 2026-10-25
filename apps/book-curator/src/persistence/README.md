# persistence

책과 서랍 속 책의 저장소 구현이 있다.

- `memory-shelf-store.ts`: 프로세스 메모리 구현. 앱 테스트와 계약 테스트가 쓴다.
- `schema.ts`, `migrations/`, `database.ts`, `drizzle-*.ts`: PGlite(drizzle) 구현.
  `openDatabase(dataDir?)`가 마이그레이션까지 한다. dataDir를 주지 않으면 메모리 DB다.
- `shelf-store.contract.ts`: 메모리와 PGlite가 함께 통과하는 계약. `*.test.ts`가 아니라
  두 테스트 파일이 이 함수를 부른다. 계약을 복사해 두 벌 쓰지 않는다.
- 책 관련도·핵심 단어는 jsonb에 `$type`으로 저장하고, 행을 읽을 때 `parseBook`으로
  다시 파싱한다. 서랍 속 책 행도 `parseDrawerStockEntry`를 거친다.
