import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { createTestServer, signInOperator, TEST_OPERATOR } from "./test-client.ts";

describe("운영자 인증", () => {
  it("로그인하지 않으면 운영 API는 401이다", async () => {
    const { api } = createTestServer();

    const response = await api.admin.me.get();

    expect(response.status).toBe(401);
    expect(response.error?.status).toBe(401);
  });

  it("시드한 운영자로 로그인하면 운영 API를 부를 수 있다", async () => {
    const { app, auth } = createTestServer();
    const cookie = await signInOperator(auth);
    const client = createApiClient(app, { headers: { cookie } });

    const response = await client.admin.me.get();

    expect(response.status).toBe(200);
    expect(response.data?.user.name).toBe(TEST_OPERATOR.name);
    expect(response.data?.user.email).toBe(TEST_OPERATOR.email);
    expect(typeof response.data?.user.id).toBe("string");
  });

  it("손님 API는 로그인 없이된다", async () => {
    const { api } = createTestServer();

    expect((await api.kiosk.current.get()).status).toBe(200);
    expect((await api.health.get()).status).toBe(200);
    expect((await api.events.post({ events: sampleFunnelEvents() })).status).toBe(204);
  });
});
