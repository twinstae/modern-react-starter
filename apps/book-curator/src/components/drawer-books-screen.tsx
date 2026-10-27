import type { DrawerBookView } from "../domain/owner-view.ts";
import {
  Badge,
  Button,
  Caption,
  Card,
  CardHeader,
  CardTitle,
  Eyebrow,
  Grid,
  InlineText,
  List,
  ListItem,
  MarkText,
  MutedText,
  PageTitle,
  ReasonText,
  Row,
  Screen,
  Stack,
} from "../ui/index.ts";

/** 화면이 책을 구분해 기록을 부를 수 있도록 서랍 속 책 view에 id만 더한다(I-9). */
export interface DrawerBooksScreenBook extends DrawerBookView {
  readonly bookId: string;
}

/**
 * 열쇠를 받은 손님에게 그 서랍의 책만 보여 준다. 책마다 제목·저자·권하는 이유·함께
 * 생각해 볼 질문을 같은 무게로 두고, 수량 0은 "없음"으로 남긴다(R-9, I-9).
 * 주인용 산 책 기록은 작게 두고, 주인 토큰이 없으면 누를 수 없다(I-15).
 */
export function DrawerBooksScreen({
  drawer,
  books,
  canRecordPurchase,
  recordedBookIds = [],
  notice = null,
  onPurchase,
  onFinish,
}: {
  drawer: { readonly name: string; readonly mark: string | null };
  books: readonly DrawerBooksScreenBook[];
  canRecordPurchase: boolean;
  recordedBookIds?: readonly string[];
  notice?: string | null;
  onPurchase: (bookId: string) => void;
  onFinish: () => void;
}) {
  return (
    <Screen
      tone="customer"
      aria-label="서랍 속 책 안내"
      display="flex"
      flexDirection="column"
      gap="5"
      px="page"
      py="8"
      textAlign="left"
    >
      <Stack gap="1" textAlign="center" alignItems="center">
        <Eyebrow>열쇠를 받았어요</Eyebrow>
        <Row alignItems="baseline" justifyContent="center" flexWrap="wrap" gap="3">
          <PageTitle>{drawer.name}</PageTitle>
          {drawer.mark === null ? null : <MarkText>{drawer.mark}</MarkText>}
        </Row>
      </Stack>

      <Grid
        columns="three"
        gap="4"
        width="full"
        maxW="72rem"
        mx="auto"
        alignItems="stretch"
        aria-label="서랍 속 책"
      >
        {books.length === 0 ? (
          <Card tone="paper">
            <CardTitle>아직 이 서랍이 비어 있어요</CardTitle>
            <MutedText>책방 주인에게 말씀해 주세요.</MutedText>
          </Card>
        ) : (
          books.map((book) => (
            <Card key={book.bookId} tone="paper">
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <Badge aria-label={`${book.title} 수량`}>
                  {book.quantity === 0 ? "없음" : `${book.quantity}권`}
                </Badge>
              </CardHeader>
              <MutedText>{book.author}</MutedText>
              <ReasonText>{book.reason}</ReasonText>
              <Caption color="fg.muted">{book.question}</Caption>
            </Card>
          ))
        )}
      </Grid>

      <Card tone="flat" aria-label="산 책 기록">
        <Eyebrow tone="seal">산 책 기록 · 주인만</Eyebrow>
        <MutedText>산 책이 있으면 작게 기록해 주세요. 수량이 함께 줄어요.</MutedText>
        {notice === null ? null : (
          <MutedText role="status" aria-label="산 책 기록 안내">
            {notice}
          </MutedText>
        )}
        <List layout="three" gap="2">
          {books.map((book) => {
            const recorded = recordedBookIds.includes(book.bookId);
            return (
              <ListItem key={book.bookId}>
                <span>
                  {book.title}
                  {recorded ? (
                    <InlineText role="status" tone="pine" weight="extra">
                      {" "}
                      · 기록했어요
                    </InlineText>
                  ) : null}
                </span>
                <Button
                  tone="outline"
                  size="sm"
                  aria-label={`${book.title} 이 책 기록`}
                  disabled={!canRecordPurchase || book.quantity === 0}
                  onClick={() => onPurchase(book.bookId)}
                >
                  이 책 기록
                </Button>
              </ListItem>
            );
          })}
        </List>
      </Card>

      <Stack alignItems="center" gap="2">
        <Button type="button" size="lg" onClick={onFinish}>
          처음으로
        </Button>
      </Stack>
    </Screen>
  );
}
