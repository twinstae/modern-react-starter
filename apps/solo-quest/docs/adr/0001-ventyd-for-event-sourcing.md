# 이벤트 소싱에 ventyd를 쓴다

세션은 이벤트 로그와 그로부터 계산한 세션 상태로 이루어진다. 엔티티, reducer, mutation, 어댑터를 직접 만드는 대신 daangn/ventyd를 쓴다.
ventyd는 valibot과 Standard Schema 위에 만들어져 이 템플릿의 스택과 맞고, 어댑터만 바꿔 저장소를 갈아 끼울 수 있으며, `expectedVersion`으로 낙관적 동시성 제어를 지원한다.

## Consequences

- 엔티티 하나가 스트림 하나다. 세션 = 엔티티로 두고, 여러 엔티티를 합친 시간순 조회는 하지 않는다.
- ventyd에는 특정 시점 상태 재구성의 공개 API가 없다. 필요해지면 reducer를 직접 reduce한다.
- ventyd가 스냅샷을 이벤트 개수 기준으로 저장하므로, "세션이 끝날 때 상태를 넘겨준다"는 ventyd 스냅샷이 아니라 다음 세션의 시작 이벤트 본문으로 표현한다.
