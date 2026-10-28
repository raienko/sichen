import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import Divider from "@/components/divider";
import If from "@/components/if";
import ListItem from "@/components/list-item";
import Pagination from "@/components/pagination";
import Section from "@/components/section";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PER_PAGE = 4;

const ORDERS = Array.from({ length: 38 }, (_, index) => ({
  id: 1000 + index,
  status: ["Delivered", "Shipped", "Refunded", "Processing"][index % 4]!,
}));

const PAGE_COUNT = Math.ceil(ORDERS.length / PER_PAGE);

/** The window, the gaps, the compact form, and a real paged list. */
export default function PaginationSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [page, setPage] = useState(1);
  const [long, setLong] = useState(10);
  const [compact, setCompact] = useState(3);
  const [dot, setDot] = useState(2);

  const shown = ORDERS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <View style={styles.container}>
      <Text
        value="The control for moving through data that arrives a page at a time. Not the same thing as Carousel's dots, and deliberately not built from them — those track a drag, these are numbered controls."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="Paging a real list">
        <Card padded={false}>
          <View style={styles.list}>
            {shown.map((order, index) => (
              <View key={order.id}>
                <ListItem
                  title={`Order #${order.id}`}
                  subtitle={order.status}
                />
                <If condition={index < shown.length - 1}>
                  <Divider inset="x16" />
                </If>
              </View>
            ))}
          </View>
        </Card>
        <Pagination
          label="Orders"
          value={page}
          total={PAGE_COUNT}
          onChange={setPage}
        />
        <Readout
          label="showing"
          value={`${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, ORDERS.length)} of ${ORDERS.length}`}
        />
      </Section>

      <Section title="Many pages">
        <Pagination
          label="Search results"
          value={long}
          total={40}
          onChange={setLong}
        />
        <Readout label="page" value={`${long} of 40`} />
        <Text
          value="Step through it: the first and last page are always reachable, an ellipsis only appears where it hides two or more pages, and the bar keeps exactly seven slots at every position — so the button under your cursor does not move."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="Compact">
        <Pagination
          label="Search results"
          value={compact}
          total={40}
          onChange={setCompact}
          compact
        />
        <Text
          value="Two arrows and a summary, for a narrow screen or a footer with no room for eleven controls."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="Dots">
        <Text
          value="The other shape of “which of these am I on”: a small, known set where the count matters more than the index. No arrows, no gaps — every position is a dot. Carousel uses this variant, passing its own animated progress so a dot grows while your finger is still moving."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <Pagination
          variant="dots"
          label="Slides"
          value={dot}
          total={5}
          onChange={setDot}
        />
        <Readout label="dot" value={`${dot} of 5`} />
      </Section>

      <Section title="One page">
        <Pagination label="Orders" value={1} total={1} onChange={() => {}} />
        <Text
          value="Nothing above this line: a bar for a single page is a control that cannot do anything, and it is the state a real screen spends most of its time in."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x24,
  },
  list: {
    paddingVertical: spacing.x4,
  },
}));
