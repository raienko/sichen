import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import { device, installId, timezone, userAgent } from "@/features/device";
import { toIsoDate, toIsoDateTime, useFormat } from "@/features/format";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { days, minutes } from "@/utils";

import Readout from "./readout";

/**
 * Every formatter on the same values, in the active language — switch the
 * language in Localization and these follow — plus what the device reports
 * about itself (and sends with every API request).
 */
export default function FormattingSection() {
  const theme = useTheme();
  const styles = useStyles();
  const format = useFormat();
  const [now, setNow] = useState(() => Date.now());

  const fiveMinutesAgo = now - minutes(5);
  const tomorrow = now + days(1);

  return (
    <View style={styles.container}>
      <Text
        value="The same values through every formatter, in the current language — switch it under Localization and these follow."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Button value="now" onPress={() => setNow(Date.now())} />

      <Text value="Dates" type="headline" />
      <Readout label="date" value={format.date(now)} />
      <Readout label="date long" value={format.date(now, { style: "long" })} />
      <Readout label="time" value={format.time(now)} />
      <Readout label="time UTC" value={format.time(now, { timeZone: "utc" })} />
      <Readout
        label="time Tokyo"
        value={format.time(now, { timeZone: "Asia/Tokyo" })}
      />
      <Readout label="dateTime" value={format.dateTime(now)} />
      <Readout
        label="relative −5 min"
        value={format.relative(fiveMinutesAgo, now)}
      />
      <Readout label="relative +1 day" value={format.relative(tomorrow, now)} />
      <Readout label="toIsoDate" value={toIsoDate(now)} />
      <Readout label="toIsoDateTime" value={toIsoDateTime(now)} />

      <Text value="Numbers" type="headline" />
      <Readout label="number" value={format.number(1234567.891)} />
      <Readout label="currency EUR" value={format.currency(1234.5, "EUR")} />
      <Readout label="currency UAH" value={format.currency(1234.5, "UAH")} />
      <Readout label="percent" value={format.percent(0.427, { decimals: 1 })} />
      <Readout label="compact" value={format.compact(1_250_000)} />
      <Readout label="fileSize" value={format.fileSize(1_258_291)} />
      <Readout label="duration" value={format.duration(3_909_000)} />
      <Readout label="initials" value={format.initials("Ada Lovelace")} />

      <Text value="Device" type="headline" />
      <Readout
        label="app"
        value={`${device.appVersion} (${device.buildNumber})`}
      />
      <Readout label="os" value={`${device.osName} ${device.osVersion}`} />
      <Readout label="model" value={device.model} />
      <Readout label="timezone" value={timezone()} />
      <Readout label="installId" value={installId()} />
      <Readout label="userAgent" value={userAgent()} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
