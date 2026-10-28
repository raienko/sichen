import { useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Pagination",
  component: Component,
};

export default meta;

export const FewPages = () => {
  const [page, setPage] = useState(1);

  return <Component label="Orders" value={page} total={5} onChange={setPage} />;
};

/** Step through it: the width never changes and the ends stay reachable. */
export const ManyPages = () => {
  const styles = useStyles();
  const [page, setPage] = useState(10);

  return (
    <View style={styles.stack}>
      <Component
        label="Search results"
        value={page}
        total={40}
        onChange={setPage}
      />
      <Text value={`Page ${page} of 40`} type="footnote" />
    </View>
  );
};

export const Compact = () => {
  const [page, setPage] = useState(3);

  return (
    <Component
      label="Search results"
      value={page}
      total={40}
      onChange={setPage}
      compact
    />
  );
};

export const Siblings = () => {
  const styles = useStyles();
  const [page, setPage] = useState(10);

  return (
    <View style={styles.stack}>
      <Component
        label="Results"
        value={page}
        total={40}
        onChange={setPage}
        siblings={0}
      />
      <Component
        label="Results"
        value={page}
        total={40}
        onChange={setPage}
        siblings={2}
      />
    </View>
  );
};

/** A bar for one page is a control that cannot do anything. */
export const OnePage = () => (
  <Component label="Orders" value={1} total={1} onChange={() => {}} />
);

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing.x16,
  },
}));
