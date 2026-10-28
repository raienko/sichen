/** A point on the map, in the order people say it: latitude first. */
export type Coordinate = {
  latitude: number;
  longitude: number;
};

/**
 * MapLibre's own order — longitude first, like GeoJSON. Kept out of every
 * public API: a swapped pair is a valid number pair that lands somewhere
 * else on the planet, and nothing would catch it.
 */
export type LngLat = [longitude: number, latitude: number];

export function toLngLat({ latitude, longitude }: Coordinate): LngLat {
  return [longitude, latitude];
}
