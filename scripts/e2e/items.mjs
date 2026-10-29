// Vendor, stash and relic flows through the real UI in a dev build
// (`yarn web`): buy a potion, take off and sell the zhupan, a Relic of
// Ascent on the sabre, stash it and take it back, equip it again.
// Usage: node scripts/e2e/items.mjs [baseUrl] [width] [height]
// Playwright is not a project dependency: point NODE_PATH at a global install.
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.argv[2] ?? "http://localhost:8081/";
const W = Number(process.argv[3] ?? 1280);
const H = Number(process.argv[4] ?? 800);
const TAG = `items-${W}x${H}`;

const b = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const save = () => p.evaluate(() => globalThis.__game.store.get().save);
const ok = (c, m) => {
  console.log(c ? "ok:" : "FAIL:", m);
  if (!c) process.exitCode = 1;
};
const shot = (n) =>
  p.screenshot({ path: `${process.env.SHOTS ?? "."}/${TAG}-${n}.png` });
try {
  await p.goto(base);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.getByText("New hero").first().click();
  await p.getByText("Ride out").click();
  await p.waitForTimeout(800);
  await p.evaluate(() => globalThis.__game.actions.setTutorial(false));

  // Merchant: buy a healing draught.
  await p.evaluate(() =>
    globalThis.__game.actions.openPanel({ name: "npc", npcId: "merchant" }),
  );
  await p.waitForTimeout(400);
  await shot("1-vendor");
  const g0 = (await save()).gold,
    h0 = (await save()).hero.potions.hp;
  await p
    .getByText(/^Buy 15$/)
    .first()
    .click();
  let s = await save();
  ok(
    s.gold === g0 - 15 && s.hero.potions.hp === h0 + 1,
    `bought a potion (${g0}→${s.gold})`,
  );

  // Take off the zhupan, sell it.
  await p.getByLabel("Zhupan").first().click();
  await p.getByText("Take off").click();
  s = await save();
  ok(
    !s.hero.equipment.chest && s.inventory.length === 1,
    "took off the zhupan",
  );
  await p.getByLabel("Zhupan").first().click();
  await shot("2-selected");
  const g1 = s.gold;
  await p.getByText(/^Sell \d+$/).click();
  s = await save();
  ok(s.inventory.length === 0 && s.gold > g1, `sold it (${g1}→${s.gold})`);
  await p.evaluate(() => globalThis.__game.actions.openPanel(null));

  // Relic of Ascent on the equipped weapon (normal → magic).
  await p.evaluate(() =>
    globalThis.__game.actions.openPanel({ name: "inventory" }),
  );
  await p.waitForTimeout(400);
  await p.getByLabel("Sabre").first().click();
  await p.getByLabel("Relic of Ascent").click();
  s = await save();
  ok(
    s.hero.equipment.weapon.rarity === "magic" && s.relics.ascent === 0,
    `ascent: weapon is ${s.hero.equipment.weapon.rarity}`,
  );
  await shot("3-relic");
  // Unequip the weapon, then to the stash and back.
  await p.getByText("Take off").click();
  s = await save();
  ok(
    !s.hero.equipment.weapon && s.inventory.length === 1,
    "took off the weapon",
  );
  await p.evaluate(() =>
    globalThis.__game.actions.openPanel({ name: "npc", npcId: "stash" }),
  );
  await p.waitForTimeout(400);
  const weaponName = s.inventory[0].uid;
  const name = /sabre/i;
  await p.getByLabel(name).first().click();
  await p.getByText("To stash").click();
  s = await save();
  ok(s.stash.length === 1 && s.inventory.length === 0, "moved to stash");
  await shot("4-stash");
  await p.getByLabel(name).first().click();
  await p.getByText("Take", { exact: true }).click();
  s = await save();
  ok(s.stash.length === 0 && s.inventory.length === 1, "took it back");
  await p.getByLabel(name).first().click();
  await p.getByText("Equip", { exact: true }).click();
  s = await save();
  ok(s.hero.equipment.weapon?.uid === weaponName, "equipped it again");
  await shot("5-end");
} catch (e) {
  console.log("ERROR", e.message.split("\n")[0]);
  await shot("fail");
  process.exitCode = 1;
}
if (errs.length) {
  console.log("page errors:", errs);
  process.exitCode = 1;
}
await b.close();
