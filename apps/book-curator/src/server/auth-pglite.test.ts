import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { openDatabase, type Database } from "../persistence/database.ts";
import { createAuth } from "./auth.ts";
import { createTestServer, signInOperator, TEST_OPERATOR } from "./test-client.ts";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

describe("PGlite 위의 운영자 인증", () => {
  it("drizzle 어댑터로 가입한 운영자가 로그인해 운영 API를 부른다", async () => {
    const auth = createAuth(drizzleAdapter(db, { provider: "pg" }));
    const { app } = createTestServer({ auth });

    const cookie = await signInOperator(auth);
    const client = createApiClient(app, { headers: { cookie } });
    const response = await client.admin.me.get();

    expect(response.status).toBe(200);
    expect(response.data?.user.email).toBe(TEST_OPERATOR.email);
  });
});
