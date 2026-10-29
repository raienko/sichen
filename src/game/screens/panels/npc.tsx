import { StyleSheet, View } from "react-native";

import {
  getClass,
  getNpc,
  getQuest,
  getSkill,
  RULES,
  content,
} from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { skillAvailability } from "../../sim/hero";
import { offeredBy, readyFor } from "../../sim/quests";
import { Divider, GButton, GIcon, Label, Row, Sheet } from "../../ui/kit";
import { palette } from "../../ui/palette";

import { InventoryPanel } from "./inventory";
import { SkillLine } from "./skills";

export function NpcPanel({
  save,
  npcId,
  onClose,
}: {
  save: SaveData;
  npcId: string;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const npc = getNpc(npcId);
  if (npc.roles.includes("merchant"))
    return <InventoryPanel save={save} mode="vendor" onClose={onClose} />;
  if (npc.roles.includes("stash"))
    return <InventoryPanel save={save} mode="stash" onClose={onClose} />;

  const offers = offeredBy(save.quests, npcId);
  const ready = readyFor(save.quests, npcId);
  const teaches = content.classes.find((c) => c.masterNpc === npcId);
  const mine = teaches?.id === save.hero.classId;

  return (
    <Sheet title={tr(npc.name)} icon="comment" onClose={onClose}>
      <Label value={tr(npc.title)} type="caption1" color={palette.muted} />
      {npc.bark.en ? (
        <Label
          value={`“${tr(npc.bark)}”`}
          type="callout"
          color={palette.text}
        />
      ) : null}

      {ready.map((q) => (
        <View key={q.id} style={styles.quest}>
          <Row gap={8}>
            <GIcon name={q.icon} color={palette.good} />
            <Label value={tr(q.name)} type="headline" style={styles.flex} />
          </Row>
          <Row gap={10} wrap>
            <Label
              value={`+${q.reward.xp} XP`}
              type="caption1"
              color={palette.xp}
            />
            <Label
              value={`+${q.reward.gold}`}
              type="caption1"
              color={palette.gold}
            />
            <GButton
              label={t("npc.turnIn")}
              icon="check"
              tone="primary"
              compact
              onPress={() => actions.turnInQuest(q.id)}
            />
          </Row>
        </View>
      ))}
      {offers.map((q) => (
        <View key={q.id} style={styles.quest}>
          <Row gap={8}>
            <GIcon name={q.icon} color={palette.gold} />
            <Label value={tr(q.name)} type="headline" style={styles.flex} />
          </Row>
          <Label value={tr(q.goal)} type="footnote" color={palette.muted} />
          <GButton
            label={t("npc.accept")}
            icon="scroll"
            compact
            onPress={() => actions.acceptQuest(q.id)}
          />
        </View>
      ))}

      {teaches ? (
        <>
          <Divider />
          <Row gap={8}>
            <GIcon name={teaches.icon} color={palette.gold} />
            <Label value={tr(teaches.name)} type="headline" />
          </Row>
          {mine ? (
            teaches.skills.map((id) => {
              const state = skillAvailability(save.hero, id, save.quests);
              const skill = getSkill(id);
              if (state === "hidden") {
                return (
                  <Row key={id} gap={8}>
                    <GIcon name="lock" color={palette.faint} />
                    <Label
                      value={t("npc.hidden")}
                      type="footnote"
                      color={palette.faint}
                    />
                  </Row>
                );
              }
              return (
                <View key={id} style={styles.skillRow}>
                  <SkillLine skillId={id} level={save.hero.level} />
                  {state === "learned" ? (
                    <Label
                      value={t("npc.learned")}
                      type="caption1"
                      color={palette.good}
                    />
                  ) : state === "level" ? (
                    <Label
                      value={t("npc.needLevel", {
                        level: skill.learn?.level ?? 1,
                      })}
                      type="caption1"
                      color={palette.faint}
                    />
                  ) : (
                    <GButton
                      label={`${t("npc.learn")} ${skill.learn?.gold ?? 0}`}
                      icon="coins"
                      compact
                      tone="primary"
                      disabled={save.gold < (skill.learn?.gold ?? 0)}
                      onPress={() => actions.learn(id)}
                    />
                  )}
                </View>
              );
            })
          ) : (
            <Label
              value={`${tr(getClass(save.hero.classId).name)} ≠ ${tr(teaches.name)}`}
              type="footnote"
              color={palette.faint}
            />
          )}
        </>
      ) : null}

      {npc.roles.includes("healer") ? (
        <>
          <GButton label={t("npc.heal")} icon="heart" onPress={actions.heal} />
          <GButton
            label={`${t("npc.respec")} · ${RULES.respecPrice}`}
            icon="arrow-rotate-left"
            disabled={save.gold < RULES.respecPrice}
            onPress={actions.respecTree}
          />
        </>
      ) : null}

      {!teaches &&
      offers.length === 0 &&
      ready.length === 0 &&
      !npc.roles.includes("healer") ? (
        <Label value={t("npc.nothing")} type="footnote" color={palette.faint} />
      ) : null}
    </Sheet>
  );
}

/** A quest object in the world: a place to explore, or a choice to make. */
export function InteractPanel({
  save,
  interactableId,
  onClose,
}: {
  save: SaveData;
  interactableId: string;
  onClose: () => void;
}) {
  const { tr } = useT();
  const thing = content.zones
    .flatMap((z) => z.interactables)
    .find((i) => i.id === interactableId);
  const choiceQuest = Object.entries(save.quests)
    .filter(([, st]) => st.status === "active")
    .map(([id]) => getQuest(id))
    .find(
      (q) =>
        q.objective.type === "choice" &&
        q.objective.interactableId === interactableId,
    );
  return (
    <Sheet title={thing ? tr(thing.name) : ""} icon="eye" onClose={onClose}>
      {choiceQuest && choiceQuest.objective.type === "choice" ? (
        <>
          <Label value={tr(choiceQuest.goal)} type="callout" />
          {choiceQuest.objective.options.map((o) => (
            <GButton
              key={o.id}
              icon={o.icon}
              label={tr(o.label)}
              tone={o.battlePackId ? "danger" : "primary"}
              onPress={() => actions.makeChoice(choiceQuest.id, o.id)}
            />
          ))}
        </>
      ) : (
        <GIcon name="feather" size={28} color={palette.faint} />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  quest: {
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: palette.panelHi,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
});
