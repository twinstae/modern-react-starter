import type { Meta, StoryObj } from "@storybook/react-vite";
import { styled } from "styled-system/jsx";

import {
  BodyText,
  Button,
  Caption,
  Card,
  Eyebrow,
  Field,
  FieldError,
  Hint,
  Input,
  Label,
  MarkText,
  PageTitle,
  ReasonText,
  SectionTitle,
  Tab,
  TabList,
} from "./index.ts";

const Page = styled("div", {
  base: {
    minH: "100dvh",
    px: "page",
    py: "10",
    bg: "canvas",
    color: "fg.default",
  },
});

const Stack = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "4" },
});

const Row = styled("div", {
  base: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3" },
});

const Grid = styled("div", {
  base: { display: "grid", gap: "4", md: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } },
});

/** src/ui의 variant를 한 화면에서 비교하는 디자인 시스템 갤러리. */
export function DesignSystemGallery() {
  return (
    <Page>
      <Stack>
        <Eyebrow>BOOK SHOP 79-1 · DESIGN SYSTEM</Eyebrow>
        <PageTitle>종이, 초록 잉크, 빨간 스탬프</PageTitle>
        <BodyText color="fg.muted">
          화면은 `src/ui`의 variant만 조합합니다. 페이지는 배치와 문장에 집중합니다.
        </BodyText>
      </Stack>

      <SectionTitle mt="10">버튼</SectionTitle>
      <Row mt="3">
        <Button>시작하기</Button>
        <Button tone="owner">열쇠 건넴</Button>
        <Button tone="outline">책 고르기</Button>
        <Button tone="quiet">← 이전 질문</Button>
        <Button tone="link">다시 해 보기</Button>
        <Button disabled>저장 중</Button>
      </Row>

      <SectionTitle mt="10">카드와 활자</SectionTitle>
      <Grid mt="3">
        <Card tone="paper">
          <Eyebrow>큐레이터가 고른 서랍</Eyebrow>
          <SectionTitle>삶의 방식을 바꾸는 책</SectionTitle>
          <ReasonText>바꾸고 싶은 마음에는 작은 습관부터 건드리는 책이 잘 맞아요.</ReasonText>
        </Card>
        <Card tone="flat">
          <Eyebrow>운영 카드</Eyebrow>
          <BodyText>반복되는 운영 화면은 그림자를 줄인 flat 카드를 씁니다.</BodyText>
          <Caption color="fg.muted">수량 0은 “없음”으로 남아요.</Caption>
        </Card>
        <Card tone="owner">
          <Eyebrow tone="seal">주인 모드</Eyebrow>
          <MarkText>1번 · 열쇠 1</MarkText>
          <BodyText>주인 확인은 빨간 테두리로 손님 화면과 구분합니다.</BodyText>
        </Card>
      </Grid>

      <SectionTitle mt="10">입력</SectionTitle>
      <Grid mt="3">
        <Field>
          <Label>별명</Label>
          <Input placeholder="예: 토끼" />
          <Hint>실명이 아니어도 괜찮아요.</Hint>
        </Field>
        <Field>
          <Label>잘못된 값</Label>
          <Input aria-invalid="true" defaultValue="6" />
          <FieldError>0~5 사이 정수로 적어 주세요.</FieldError>
        </Field>
        <Field>
          <Label>긴 글</Label>
          <Input placeholder="권하는 이유를 적어 주세요." />
        </Field>
      </Grid>

      <SectionTitle mt="10">탭</SectionTitle>
      <TabList>
        <Tab aria-selected="true">서가</Tab>
        <Tab>서랍</Tab>
        <Tab>질문 세트</Tab>
        <Tab>주인 PIN</Tab>
      </TabList>
    </Page>
  );
}

const meta = {
  title: "Design System/Foundations",
  component: DesignSystemGallery,
} satisfies Meta<typeof DesignSystemGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DesignSystemGallery />,
  globals: { viewport: { value: "tabletLandscape" } },
};
