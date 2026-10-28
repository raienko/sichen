import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Card from "@/components/card";
import Input from "@/components/input";
import ListItem from "@/components/list-item";
import Section from "@/components/section";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/** The grouping primitive: a heading, the copy around it, and the gaps. */
export default function SectionSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [street, setStreet] = useState("");

  return (
    <View style={styles.container}>
      <Text
        value="A titled group of related things: a block of settings, a fieldset, a list with an action beside it. It owns the structure and the spacing — Card owns the surface, and the two compose."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="Notifications" description="Choose what reaches you.">
        <Switch value={push} onChange={setPush} label="Push" />
        <Switch value={email} onChange={setEmail} label="Email" />
      </Section>

      <Section
        title="Recent orders"
        action={<Button value="See all" size="small" onPress={() => {}} />}
      >
        <ListItem title="Order #12" subtitle="Delivered" />
        <ListItem title="Order #11" subtitle="Refunded" />
      </Section>

      <Section title="Address" footer="Used for delivery only.">
        <Input
          type="text"
          label="Street"
          value={street}
          onChange={setStreet}
          placeholder="221B Baker Street"
        />
      </Section>

      <Section title="Inside a Card" description="It draws no surface itself.">
        <Card>
          <Section title="Payment" description="Charged monthly.">
            <ListItem title="Visa ending 4242" />
          </Section>
        </Card>
      </Section>

      <Section title="Nesting counts the levels">
        <Text
          value="This section announces at level 2. Everything below it counts down from there without anyone passing a number — a hand-written level is right when it is written and wrong the first time a screen is rearranged."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <Section title="Level 3">
          <Section title="Level 4">
            <Section title="Level 5">
              <Text
                value="The size follows the level too, until there is nothing smaller left that is still a heading."
                type="caption1"
                style={{ color: theme.colors.textSecondary }}
              />
            </Section>
          </Section>
        </Section>
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x24,
  },
}));
