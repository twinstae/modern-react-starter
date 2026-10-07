import { Temporal } from "temporal-polyfill";

/** Instant(ISO 문자열)를 사용자 로캘의 날짜와 시각으로 보여 준다. */
export const formatInstant = (iso: string) =>
  Temporal.Instant.from(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Instant(ISO 문자열)를 사용자 로캘의 시각만으로 짧게 보여 준다. */
export const formatTime = (iso: string) =>
  Temporal.Instant.from(iso).toLocaleString(undefined, { timeStyle: "short" });
