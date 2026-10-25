import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import { saveOwnerPin, signInAdmin, signOutAdmin } from "../admin-api.ts";
import { AdminLogin } from "../components/admin-login.tsx";
import { PinEntry } from "../components/pin-entry.tsx";
import { adminQueries } from "../queries.ts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: "page",
    py: "12",
    bg: "canvas",
    color: "fg.default",
  },
});

const Card = styled("section", {
  base: {
    width: "full",
    maxW: "36rem",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
    md: { p: "8" },
  },
});

const Eyebrow = styled("p", {
  base: {
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.12em",
  },
});

const Title = styled("h1", {
  base: {
    mt: "2",
    fontFamily: "heading",
    fontSize: "2xl",
    fontWeight: "600",
    wordBreak: "keep-all",
  },
});

const Note = styled("p", {
  base: { mt: "3", color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "4",
    mt: "6",
    pb: "4",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
  },
});

const Email = styled("p", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    overflowWrap: "anywhere",
  },
});

const QuietButton = styled("button", {
  base: {
    minH: "10",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Section = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "2", mt: "6" },
});

const SectionTitle = styled("h2", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Status = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

/**
 * 운영자 화면의 첫 조각. 세션이 없으면 로그인만, 있으면 운영자 이메일과 PIN 설정을 보여 준다.
 * 서가·서랍·질문 세트 운영 화면은 다음 티켓이 이 자리에 더한다.
 */
function AdminPage() {
  const queryClient = useQueryClient();
  const me = useQuery({
    ...adminQueries.me(),
    // 서버 렌더링에는 브라우저 쿠키가 없다. 브라우저에서 붙은 뒤에 세션을 읽는다.
    enabled: typeof window !== "undefined",
  });
  const [pinSaved, setPinSaved] = useState(false);

  const reloadSession = () => queryClient.invalidateQueries({ queryKey: ["admin", "me"] });

  if (me.isPending) {
    return (
      <Screen>
        <Note role="status">운영자 세션을 확인하고 있어요.</Note>
      </Screen>
    );
  }

  if (me.isError) {
    return (
      <Screen>
        <Card>
          <Title>운영자 세션을 읽지 못했어요</Title>
          <Note>잠시 뒤 다시 열어 주세요.</Note>
          <QuietButton type="button" onClick={() => void me.refetch()}>
            다시 시도
          </QuietButton>
        </Card>
      </Screen>
    );
  }

  if (me.data === null) {
    return <AdminLogin onSubmit={signInAdmin} onSuccess={() => void reloadSession()} />;
  }

  return (
    <Screen>
      <Card>
        <Eyebrow>BOOK SHOP 79-1</Eyebrow>
        <Title>운영자 화면</Title>
        <Row>
          <Email>{me.data.user.email}</Email>
          <QuietButton
            type="button"
            onClick={async () => {
              await signOutAdmin();
              await reloadSession();
            }}
          >
            로그아웃
          </QuietButton>
        </Row>
        <Section>
          <SectionTitle>주인 PIN</SectionTitle>
          <Note>태블릿에서 주인 확인을 열 때 쓰는 PIN이에요. 정하거나 바꿀 수 있어요.</Note>
          <PinEntry
            title="주인 PIN"
            submitLabel="PIN 저장"
            onSubmit={async (pin) => {
              setPinSaved(false);
              const failure = await saveOwnerPin(pin);
              if (failure === undefined) setPinSaved(true);
              return failure;
            }}
          />
          {pinSaved ? <Status role="status">PIN을 저장했어요.</Status> : null}
        </Section>
      </Card>
    </Screen>
  );
}
