// Plays the vertical slice end to end in a dev build (`yarn web`), through the
// real UI where it matters and through the dev-only `__game` handle to skip
// walking. Usage: node scripts/e2e/playthrough.mjs [baseUrl] [classId]
// Prints a step log and exits non-zero on the first failure or page error.
// Playwright is not a project dependency: point NODE_PATH at a global install.
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.argv[2] ?? "http://localhost:8081/";
const classId = process.argv[3] ?? "lytsar";
// The kurgan quest's branch: "spare" (no fight) or "slay" (a battle).
const kurgan = process.argv[4] ?? "spare";
const CLASS_NAMES = {
  lytsar: "Lytsar",
  plastun: "Plastun",
  kharakternyk: "Kharakternyk",
};
const MASTERS = {
  lytsar: "sviatoslav",
  plastun: "karmaliuk",
  kharakternyk: "olha",
};

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const log = (...a) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const game = (fn, arg) => page.evaluate(fn, arg);
const save = () => game(() => globalThis.__game.store.get().save);
const scene = () => game(() => globalThis.__game.store.get().scene.name);
function check(cond, msg) {
  if (!cond) throw new Error(`Check failed: ${msg}`);
  log("ok:", msg);
}
async function click(text, opts = {}) {
  await page
    .getByText(text, { exact: true, ...opts })
    .first()
    .click();
}
async function shot(name) {
  await page.screenshot({ path: `${process.env.SHOTS ?? "."}/${name}.png` });
}

/** Fights a pack through the battle UI with auto-battle on; returns the outcome. */
async function fight(packId, { manualFirst = false } = {}) {
  // null: a battle something else (a quest choice) already started.
  if (packId)
    await game((id) => globalThis.__game.actions.startBattle(id), packId);
  await page.getByText("Round 1").waitFor({ timeout: 10000 });
  if (manualFirst) {
    // One round by hand: select the first foe in the scene, put Strike in
    // slot 1 from the action popup, defend against melee, Ready.
    const foes = await game(() =>
      globalThis.__game.store
        .get()
        .battle.state.actors.filter((a) => a.side === 1)
        .map((a) => ({ id: a.id, name: a.name.en })),
    );
    await page.getByLabel(foes[0].name).first().click();
    await page.getByLabel("Slot 1", { exact: true }).click();
    await page.getByLabel("Strike", { exact: true }).click();
    await page.getByLabel("Defence: Melee").first().click();
    const plan = await game(() => globalThis.__game.store.get().battle.plan);
    check(
      plan.attacks.length === 1 &&
        plan.attacks[0].skillId === "strike" &&
        plan.attacks[0].targetId === foes[0].id &&
        plan.defense.melee === 1,
      "manual plan built through the slot popup",
    );
    await page.getByRole("button", { name: /^Ready,/ }).click();
    await page
      .getByText("Round 2")
      .or(page.getByText("Victory"))
      .or(page.getByText("The death god deals"))
      .first()
      .waitFor({ timeout: 60000 });
  }
  const auto = (await save()).settings.autoBattle;
  if (!auto && (await scene()) === "battle")
    await page.getByRole("button", { name: "Auto", exact: true }).click();
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    const s = await game(() => {
      const st = globalThis.__game.store.get();
      return {
        scene: st.scene.name,
        phase: st.battle?.phase,
        result: st.battle?.state.result,
      };
    });
    if (s.scene === "death") return "lost";
    if (s.phase === "over") {
      const result = s.result;
      await click("Continue");
      await page.waitForFunction(
        () => globalThis.__game.store.get().scene.name === "world",
      );
      return result;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Battle ${packId} never ended`);
}

async function talk(npcId) {
  await game(
    (id) => globalThis.__game.actions.openPanel({ name: "npc", npcId: id }),
    npcId,
  );
  await page.waitForTimeout(300);
}
async function closePanel() {
  await game(() => globalThis.__game.actions.openPanel(null));
}
async function enter(zone, spawn) {
  await game(
    ([z, s]) => globalThis.__game.actions.enterZone(z, s),
    [zone, spawn],
  );
  await page.waitForTimeout(500);
}
/** Debug grind: sets the level, gold and potions so the boss comes fast. */
async function grantLevels(target) {
  await game((lvl) => {
    const { store } = globalThis.__game;
    const s = store.get().save;
    store.set({
      save: {
        ...s,
        gold: s.gold + 2000,
        hero: { ...s.hero, level: lvl, xp: 0, potions: { hp: 6, mana: 6 } },
      },
    });
  }, target);
}

try {
  await page.goto(base);
  await game(() => localStorage.clear());
  await page.reload();
  await page.getByText("New hero").first().waitFor({ timeout: 60000 });
  await shot("01-title");
  await click("New hero");
  await page.getByText("A new cossack").waitFor();
  await page.getByLabel("Random name").click();
  await page
    .getByText(new RegExp(`^${CLASS_NAMES[classId]} ·`))
    .first()
    .click();
  await shot("02-create");
  await click("Ride out");
  await page.waitForFunction(
    () => globalThis.__game.store.get().scene.name === "world",
  );
  check((await save()).hero.classId === classId, `created a ${classId}`);
  await page.waitForTimeout(2000);
  await shot("03-kyiv");
  // The tutorial: read the first hint, then skip the rest.
  await click("Got it");
  check(
    (await save()).settings.hints.includes("move"),
    "tutorial hint dismissed",
  );
  await click("Skip tutorial");
  check((await save()).settings.tutorial === false, "tutorial skipped");

  // Sirko: first main quest. Karmaliuk: both side quests.
  await talk("sirko");
  await shot("04-sirko");
  await click("Accept");
  check((await save()).quests.q_smoke?.status === "active", "q_smoke accepted");
  await closePanel();
  await talk("karmaliuk");
  await page.getByText("Accept").first().click();
  await page.getByText("Accept").first().click();
  const q = (await save()).quests;
  check(
    q.q_upyrs?.status === "active" && q.q_mavka?.status === "active",
    "side quests accepted",
  );
  await closePanel();

  // Merchant.
  await talk("merchant");
  await shot("05-merchant");
  await closePanel();

  await enter("vyshhorod", { x: 3, z: 17 });
  check((await save()).world.zoneId === "vyshhorod", "rode out to Vyshhorod");
  await shot("06-zone");

  // q_smoke: 6 orcs. The first fight has a hand-planned round.
  let first = true;
  let rounds = 0;
  while ((await save()).quests.q_smoke.status === "active" && rounds < 12) {
    rounds += 1;
    const pack = rounds % 2 ? "p_grunts_a" : "p_grunts_b";
    const r = await fight(pack, { manualFirst: first });
    first = false;
    log("fight", pack, "→", r, "lv", (await save()).hero.level);
    if (r === "lost") break;
  }
  if ((await scene()) === "death") {
    // Exercise the death flow right here.
    await shot("07-death");
    await page.getByLabel("1").first().click();
    await click("Rise again in Kyiv");
    await page.waitForFunction(
      () => globalThis.__game.store.get().scene.name === "world",
    );
    check((await save()).world.zoneId === "kyiv", "rose again in Kyiv");
  }
  check((await save()).quests.q_smoke.status === "ready", "q_smoke ready");

  await enter("kyiv", { x: 26, z: 11 });
  await talk("sirko");
  await click("Complete");
  const s1 = await save();
  check(s1.quests.q_smoke.status === "done", "q_smoke turned in");
  check(s1.quests.q_shrine?.status !== "done", "q_shrine offered next");
  await shot("08-sirko-2");
  await click("Accept");
  check(
    (await save()).quests.q_shrine?.status === "active",
    "q_shrine accepted",
  );
  await closePanel();

  // Grand master: learn the first affordable skill.
  await talk(MASTERS[classId]);
  await shot("09-master");
  const learnBtn = page.getByText(/^Learn \d+$/).first();
  if (await learnBtn.count()) {
    const before = (await save()).hero.learned.length;
    await learnBtn.click();
    check(
      (await save()).hero.learned.length === before + 1,
      "learned a skill from the grand master",
    );
  } else log("no learnable skill at this level");
  await closePanel();

  // Shrine.
  await enter("vyshhorod", { x: 3, z: 17 });
  await game(() => globalThis.__game.actions.examine("shrine"));
  check((await save()).quests.q_shrine.status === "ready", "shrine explored");
  await closePanel();

  // Kurgan: spare, or slay (a battle that pays out on a win).
  await game(() => globalThis.__game.actions.examine("kurgan"));
  await page.waitForTimeout(300);
  await shot("10-kurgan");
  if (kurgan === "spare") {
    await click("Spare the mavky");
    const s2 = await save();
    check(
      s2.quests.q_mavka.status === "done" &&
        s2.quests.q_mavka.choice === "spare",
      "kurgan: spared",
    );
    check(
      s2.inventory.some((i) => i.uniqueId === "mavka_thread"),
      "got Mavka's thread",
    );
  } else {
    const relics = (await save()).relics.ascent;
    await click("Slay them");
    await page.getByText("Round 1").waitFor({ timeout: 10000 });
    const r = await fight(null);
    const s2 = await save();
    if (r === "won") {
      check(s2.quests.q_mavka.choice === "slay", "kurgan: slain");
      check(s2.relics.ascent >= relics + 1, "slay reward paid");
    } else {
      check(s2.quests.q_mavka.status === "active", "kurgan: retry allowed");
    }
  }

  await enter("kyiv", { x: 26, z: 11 });
  await talk("sirko");
  await click("Complete");
  await click("Accept");
  check((await save()).quests.q_likho?.status === "active", "q_likho accepted");
  await closePanel();

  // Tree: allocate a point through the UI.
  await game(() => globalThis.__game.actions.openPanel({ name: "tree" }));
  await page.waitForTimeout(300);
  await shot("11-tree");
  await closePanel();

  // Boss at level 9.
  // Boss at level 9 with every class skill bought from the grand master.
  await grantLevels(9);
  await talk(MASTERS[classId]);
  for (;;) {
    const btn = page.getByText(/^Learn \d+$/).first();
    if (!(await btn.count())) break;
    await btn.click();
  }
  check((await save()).hero.learned.length >= 6, "learned the class skills");
  await closePanel();
  await enter("vyshhorod", { x: 3, z: 17 });
  let r = "lost";
  for (let attempt = 1; attempt <= 3 && r !== "won"; attempt++) {
    await game(() => globalThis.__game.actions.heal());
    r = await fight("p_likho");
    log(`boss attempt ${attempt} →`, r);
    await shot(`12-boss-${attempt}`);
    if (r === "lost") {
      // Death: pick a card, rise in Kyiv, ride back out.
      await page.getByText("The death god deals").waitFor();
      const before = await save();
      await page.getByLabel("3").first().click();
      await click("Rise again in Kyiv");
      await page.waitForFunction(
        () => globalThis.__game.store.get().scene.name === "world",
      );
      const after = await save();
      check(
        after.world.zoneId === "kyiv" && after.hero.level === before.hero.level,
        "death: back in Kyiv, no level lost",
      );
      check(after.gold >= 0, "death: no gold debt");
      await enter("vyshhorod", { x: 3, z: 17 });
    }
  }
  if (r === "won") {
    const s3 = await save();
    check(s3.quests.q_likho.status === "ready", "q_likho ready after the boss");
    check(
      s3.inventory.some((i) => i.uniqueId === "likho_eye") ||
        (s3.hero.equipment &&
          Object.values(s3.hero.equipment).some(
            (i) => i?.uniqueId === "likho_eye",
          )),
      "Likho's Eye dropped",
    );
    await enter("kyiv", { x: 26, z: 11 });
    await talk("sirko");
    await click("Complete");
    check(
      (await save()).quests.q_likho.status === "done",
      "slice main quest done",
    );
  }

  check(errors.length === 0, `no page errors (${errors.length})`);
} catch (e) {
  console.error(e);
  await shot("fail").catch(() => {});
  console.error(errors.join("\n"));
  process.exitCode = 1;
} finally {
  if (errors.length) console.error("Page errors:\n" + errors.join("\n"));
  await browser.close();
}
