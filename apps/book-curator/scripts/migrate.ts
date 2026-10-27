import { connectDatabase } from "../src/persistence/database.ts";

/** 스키마가 바뀐 커밋을 배포하기 전에 운영 Postgres에 한 번 돌린다. */
const url = process.env.POSTGRES_URL;
if (url === undefined || url === "") {
  throw new Error("POSTGRES_URL을 환경 변수로 넣어 주세요");
}

const db = await connectDatabase(url, { migrateFirst: true });
await db.$client.end();
console.log("운영 DB 마이그레이션을 마쳤습니다.");
