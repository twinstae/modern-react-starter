import { createStart } from "@tanstack/react-start";

/**
 * 이 앱은 SPA다. 라우트의 beforeLoad·loader를 서버에서 돌리지 않는다. 서버에는 운영자
 * 쿠키도 브라우저 origin도 없어, 세션을 읽는 guard가 서버에서 돌면 상대 URL fetch가
 * 실패하고 그 오류가 화면으로 내려간다.
 */
export const startInstance = createStart(() => ({ defaultSsr: false }));
