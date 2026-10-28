import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "components/Match",
  component: Component,
};

export default meta;

const branches = [
  <Component.Case key="loading" when="loading">
    <Text value="Loading — the first branch matched" />
  </Component.Case>,
  <Component.Case key="rest" when={["idle", "ready"]}>
    <Text value="Idle or ready — one Case, two values" />
  </Component.Case>,
  <Component.Default key="default">
    <Text value="Nothing matched — the Default branch" />
  </Component.Default>,
];

export const Matched = {
  args: { value: "loading", children: branches },
};

export const MatchedByArray = {
  args: { value: "ready", children: branches },
};

export const Fallback = {
  args: { value: "error", children: branches },
};
