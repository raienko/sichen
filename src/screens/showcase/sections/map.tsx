import { useState } from "react";
import { View } from "react-native";

import Map, { type MapMarker } from "@/components/map";
import Text from "@/components/text";
import { useUserLocation, type Coordinate } from "@/features/maps";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/** Somewhere to stand when the user's position isn't available. */
const FALLBACK: Coordinate = { latitude: 38.7105, longitude: -9.1373 };

/** A few places scattered a few hundred metres around `origin`. */
function placesAround(origin: Coordinate): MapMarker[] {
  return [
    {
      id: "cafe",
      title: "Café",
      subtitle: "Coffee and pastries",
      dLat: 0.003,
      dLng: 0.002,
    },
    {
      id: "books",
      title: "Bookshop",
      subtitle: "Open until 20:00",
      dLat: -0.002,
      dLng: 0.004,
    },
    {
      id: "park",
      title: "Park",
      subtitle: "Playground and benches",
      dLat: 0.001,
      dLng: -0.004,
    },
  ].map(({ dLat, dLng, ...place }) => ({
    ...place,
    coordinate: {
      latitude: origin.latitude + dLat,
      longitude: origin.longitude + dLng,
    },
  }));
}

/** Places around the user, themed, with Directions handed to the platform's map app. */
export default function MapSection() {
  const theme = useTheme();
  const styles = useStyles();
  const location = useUserLocation();
  const [selected, setSelected] = useState<string>();

  const origin = location.coordinate ?? FALLBACK;

  return (
    <View style={styles.container}>
      <Text
        value="MapLibre on iOS, Android and the web, in a style generated from the theme. Pins are app buttons; Directions opens the platform's own map app."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Map
        label="Places near you"
        markers={placesAround(origin)}
        userLocation={location.coordinate}
        selectedId={selected}
        onSelectMarker={setSelected}
      />
      <Readout label="location" value={location.status} />
      <Readout label="selected" value={selected ?? "—"} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
    alignItems: "stretch",
  },
}));
