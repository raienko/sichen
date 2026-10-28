import type { ReactNode } from "react";
import { View } from "react-native";

import BackButton from "@/components/back-button";
import Button from "@/components/button";
import Header from "@/components/header";
import Icon from "@/components/icon";
import Input from "@/components/input";
import List, { type ListItemData } from "@/components/list";
import Spacer from "@/components/spacer";
import TabBar from "@/components/tab-bar";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Screen",
  component: Component,
};

export default meta;

/** A screen fills its parent, so each story gets a phone-sized one. */
function Stage({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.stage, wide ? styles.wide : null]}>{children}</View>
  );
}

const ROWS: ListItemData[] = Array.from({ length: 40 }, (_, index) => ({
  key: String(index),
  title: `Order #${1040 - index}`,
  subtitle: `${(index % 4) + 1} items`,
  right: <Icon name="chevron-right" />,
}));

function Paragraphs({ count = 12 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <Text
      key={index}
      value={`Paragraph ${index + 1}. Only this column scrolls; the header stays pinned above it.`}
    />
  ));
}

export const Default = () => (
  <Stage>
    <Component scrollable header={<Header title="Orders" />}>
      <Paragraphs />
    </Component>
  </Stage>
);

export const HeaderAndFooter = () => (
  <Stage>
    <Component
      scrollable
      header={<Header title="New address" left={<BackButton />} />}
      footer={<Button value="Save address" type="primary" />}
    >
      <Input label="Full name" value="Ana Silva" onChange={() => {}} />
      <Input label="Street" value="12 Harbour Road" onChange={() => {}} />
      <Input label="City" value="Lisbon" onChange={() => {}} />
    </Component>
  </Stage>
);

/** The list scrolls itself, edge to edge, so the screen does neither. */
export const ListContent = () => (
  <Stage>
    <Component padded={false} header={<Header title="Orders" />}>
      <List data={ROWS} />
    </Component>
  </Stage>
);

/** The bar is the navigator's; the screen only leaves room for it. */
export const TabScreen = () => {
  const styles = useStyles();
  return (
    <Stage>
      <Component scrollable header={<Header title="Home" />}>
        <Paragraphs />
        <Spacer size="tab-bar" />
      </Component>
      <View style={styles.bar}>
        <TabBar
          value="home"
          onChange={() => {}}
          items={[
            { key: "home", label: "Home", icon: "home" },
            { key: "browse", label: "Browse", icon: "grid" },
            { key: "profile", label: "Profile", icon: "user" },
          ]}
        />
      </View>
    </Stage>
  );
};

export const WithAside = () => (
  <Stage wide>
    <Component
      scrollable
      header={<Header title="Inbox" />}
      aside={
        <View>
          <Text value="[APP NAME]" type="title3" />
          <Text value="Inbox" />
          <Text value="Orders" />
          <Text value="Customers" />
        </View>
      }
    >
      <Paragraphs />
    </Component>
  </Stage>
);

export const Centered = () => (
  <Stage>
    <Component
      layout="centered"
      header={<Header left={<BackButton />} />}
      footer={<Button value="Resend link" type="tertiary" />}
    >
      <Text value="Check your email" type="title1" />
      <Text value="We sent a sign-in link. It expires in 15 minutes." />
      <Button value="Open mail app" type="primary" />
    </Component>
  </Stage>
);

const useStyles = createStyles(({ units }) => ({
  stage: {
    width: units(390),
    height: units(720),
  },
  wide: {
    width: units(1024),
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
