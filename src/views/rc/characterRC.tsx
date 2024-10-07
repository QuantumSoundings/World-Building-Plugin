import type { CharacterNote } from "src/world/notes/characterNotes";
import { formatTable, useWorldEngineViewContext, type RCUtilContext } from "./util";
import { calculateTimeDifference } from "src/util/time";

export const CharacterRC = () => {
  const view = useWorldEngineViewContext();
  const context: RCUtilContext = {
    note: view.note,
    file: view.note.file,
    plugin: view.plugin,
    popoverParent: view,
  };
  const note = context.note as CharacterNote;

  return (
    <div>
      {overviewTable(note, context)}
      {manaTable(note, context)}
      {talentTable(note, context)}
    </div>
  );
};

function overviewTable(note: CharacterNote, context: RCUtilContext) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Name", note.name],
    ["DoB", note.birthDate],
    ["Age", calculateTimeDifference(note.birthDate, context.plugin.settings.currentDate)],
    ["Species", note.species],
    ["Citizenship", note.citizenship],
  ];

  return formatTable(headers, data, context);
}

function manaTable(note: CharacterNote, context: RCUtilContext) {
  const headers = ["Mana", "---"];
  const data: any[][] = [
    ["Cultivation", note.mana.cultivation],
    ["Attributes", note.mana.attributes.join(", ")],
    ["Blessing", note.mana.blessing],
  ];

  return formatTable(headers, data, context);
}

function talentTable(note: CharacterNote, context: RCUtilContext) {
  const headers = ["Talent", "---"];
  const data: any[][] = [
    ["Physical", note.talent.physical],
    ["Mana", note.talent.mana],
    ["Blessing", note.talent.blessing],
  ];

  return formatTable(headers, data, context);
}
