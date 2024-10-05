import type { CharacterNote } from "src/world/notes/characterNotes";
import { attemptLink, formatTable, LinkElement, useWorldEngineViewContext } from "./util";
import type WorldBuildingPlugin from "src/main";
import { calculateTimeDifference } from "src/util/time";

export const CharacterRC = () => {
  const note = useWorldEngineViewContext().note as CharacterNote;
  const plugin = useWorldEngineViewContext().plugin;

  return (
    <div>
      {overviewTable(note, plugin)}
      {manaTable(note)}
      {talentTable(note)}
    </div>
  );
};

function overviewTable(note: CharacterNote, plugin: WorldBuildingPlugin) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Name", note.name],
    ["DoB", note.birthDate],
    ["Age", calculateTimeDifference(note.birthDate, plugin.settings.currentDate)],
    ["Species", note.species],
    ["Citizenship", note.citizenship],
  ];

  return formatTable(headers, data);
}

function manaTable(note: CharacterNote) {
  const headers = ["Mana", "---"];
  const data: any[][] = [
    ["Cultivation", note.mana.cultivation],
    ["Attributes", note.mana.attributes.join(", ")],
    ["Blessing", note.mana.blessing],
  ];

  return formatTable(headers, data);
}

function talentTable(note: CharacterNote) {
  const headers = ["Talent", "---"];
  const data: any[][] = [
    ["Physical", note.talent.physical],
    ["Mana", note.talent.mana],
    ["Blessing", note.talent.blessing],
  ];

  return formatTable(headers, data);
}
