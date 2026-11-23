# persistence

`application/*-ports.ts` 포트의 구현이 있다. 서버는 없고, 앱은 태블릿 브라우저의 IndexedDB에만
저장한다(ADR 0006).

- `memory-*.ts`: 프로세스 메모리 구현. 유스케이스 테스트와 계약 테스트가 쓴다.
- `indexeddb-database.ts`: 기기 DB `book-curator`를 연다. 처음 열면 표를 만든다.
- `indexeddb-stores.ts`: 서랍·공개 버전·이벤트·열쇠 건넴·주인 PIN·운영 비밀번호 저장소.
  값은 DTO로 넣고 읽을 때 다시 파싱한다. 넣은 순서가 읽는 순서인 표는 자동 증가 키를 쓴다.
- `*.contract.ts`: 메모리와 IndexedDB가 함께 통과하는 계약. `*.test.ts`가 아니라 두 테스트
  파일이 이 함수를 부른다. 계약을 복사해 두 벌 쓰지 않는다. IndexedDB 쪽은
  `fake-indexeddb`로 node에서 돈다.
