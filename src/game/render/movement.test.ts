import { getZone } from "../data";

import { freeSpot, walkable } from "./movement";

const MAP = [
  "#########",
  "#.......#",
  "#.......#",
  "#..hhh..#",
  "#..hhh..#",
  "#.......#",
  "#.......#",
  "#########",
];

it("keeps a hero who stands on open, reachable ground", () => {
  expect(freeSpot(MAP, { x: 1, z: 1 }, 6.8, 1.1)).toEqual({ x: 6.8, z: 1.1 });
});

it("moves a hero out of a building to the nearest open tile", () => {
  const spot = freeSpot(MAP, { x: 1, z: 1 }, 4, 3);
  expect(walkable(MAP, spot.x, spot.z)).toBe(true);
  expect(Math.hypot(spot.x - 4, spot.z - 3)).toBeLessThan(2.3);
});

it("finds open ground anywhere in Kyiv", () => {
  const zone = getZone("kyiv");
  for (let z = 0; z < zone.map.length; z += 3)
    for (let x = 0; x < zone.map[0]!.length; x += 3) {
      const spot = freeSpot(zone.map, zone.spawn, x, z, zone.exits);
      expect(walkable(zone.map, spot.x, spot.z)).toBe(true);
    }
});
