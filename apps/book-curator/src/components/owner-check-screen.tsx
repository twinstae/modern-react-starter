import type { PublicShelfBookDto } from "../domain/kiosk.ts";
import type { OwnerView } from "../domain/owner-view.ts";
import type { DrawerId } from "../domain/question-set.ts";
import {
  Badge,
  BodyText,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Disclosure,
  DisclosureSummary,
  Eyebrow,
  Grid,
  InfoBox,
  InlineText,
  List,
  ListItem,
  MutedText,
  PageHeader,
  PageTitle,
  ReasonText,
  Screen,
  Section,
  SectionTitle,
  Split,
  Stack,
} from "../ui/index.ts";

function OwnerBookList({ books }: { books: readonly PublicShelfBookDto[] }) {
  if (books.length === 0) {
    return <MutedText>아직 이 서랍에 책이 없어요.</MutedText>;
  }

  return (
    <List gap="1">
      {books.map((book) => (
        <ListItem
          key={book.bookId}
          align="baseline"
          py="1"
          pb="1"
          borderBottomWidth="1px"
          borderColor="paper.300"
          fontFamily="body"
          fontSize="kiosk-caption"
        >
          <span>
            <InlineText weight="strong">{book.title}</InlineText>{" "}
            <InlineText tone="muted">
              {book.publisher === "" ? book.author : `${book.author} · ${book.publisher}`}
            </InlineText>
          </span>
        </ListItem>
      ))}
    </List>
  );
}

/**
 * 주인 확인. 손님 결과와 달리 빨간 seal 테두리와 "주인 모드" 표시로 화면이 다르다.
 * 추천 서랍을 크게 두고, 2순위·비슷함·모든 서랍의 책을 보여 준다.
 * 주인은 추천과 다른 서랍을 골라 열쇠를 건넬 수 있다(R-7). 서랍 코드는 화면에 쓰지 않는다.
 */
export function OwnerCheckScreen({
  view,
  notice = null,
  onHandover,
  onCancel,
}: {
  view: OwnerView;
  notice?: string | null;
  onHandover: (drawer: DrawerId) => void;
  onCancel: () => void;
}) {
  const others = view.drawers.filter(
    ({ drawer }) => drawer !== view.recommended.drawer && drawer !== view.second.drawer,
  );

  return (
    <Screen
      tone="owner"
      aria-label="주인 확인"
      display="flex"
      flexDirection="column"
      gap="1"
      px="page"
      py="1"
      textAlign="left"
    >
      <PageHeader divider={false} align="center" gap="3">
        <Stack gap="1">
          <Badge tone="seal">주인 모드</Badge>
          <PageTitle fontSize="1.6rem">열쇠를 건넬 서랍을 골라 주세요</PageTitle>
        </Stack>
        <Button tone="link" onClick={onCancel}>
          손님 화면으로
        </Button>
      </PageHeader>

      {notice === null ? null : (
        <InfoBox role="status" aria-label="주인 확인 안내">
          {notice}
        </InfoBox>
      )}

      <Split gap="3">
        <Card tone="owner" gap="2" p="3" aria-labelledby="owner-recommended-name">
          <Eyebrow>추천 서랍</Eyebrow>
          <CardHeader>
            <CardTitle id="owner-recommended-name">{view.recommended.name}</CardTitle>
          </CardHeader>
          <ReasonText>{view.recommended.statement}</ReasonText>
          <OwnerBookList books={view.recommended.books} />
          <Button
            type="button"
            tone="owner"
            size="lg"
            fullWidth
            onClick={() => onHandover(view.recommended.drawer)}
          >
            이 서랍 열쇠 건넴
          </Button>
        </Card>

        <Stack gap="3">
          <Card tone="flat" p="3" aria-labelledby="owner-second-name">
            <Eyebrow>2순위 서랍</Eyebrow>
            <CardHeader>
              <SectionTitle id="owner-second-name">{view.second.name}</SectionTitle>
            </CardHeader>
            <BodyText>{view.second.statement}</BodyText>
            <OwnerBookList books={view.second.books} />
            <Button
              type="button"
              tone="outline"
              alignSelf="flex-start"
              onClick={() => onHandover(view.second.drawer)}
            >
              {view.second.name} 열쇠 건넴
            </Button>
          </Card>

          {view.similar ? (
            <MutedText>두 서랍이 비슷하게 보여요. 손님과 함께 골라도 좋아요.</MutedText>
          ) : null}
        </Stack>
      </Split>

      {others.length === 0 ? null : (
        <Section aria-label="다른 서랍" gap="2">
          <Eyebrow>다른 서랍</Eyebrow>
          <Grid columns="two" gap="2">
            {others.map((drawer) => (
              <Card key={drawer.drawer} tone="flat" padding="sm">
                <CardHeader>
                  <SectionTitle>{drawer.name}</SectionTitle>
                </CardHeader>
                <Disclosure>
                  <DisclosureSummary>책 {drawer.books.length}권 보기</DisclosureSummary>
                  <OwnerBookList books={drawer.books} />
                </Disclosure>
                <Button
                  type="button"
                  tone="outline"
                  alignSelf="flex-start"
                  onClick={() => onHandover(drawer.drawer)}
                >
                  {drawer.name} 열쇠 건넴
                </Button>
              </Card>
            ))}
          </Grid>
        </Section>
      )}
    </Screen>
  );
}
