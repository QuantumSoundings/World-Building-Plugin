import type { CharacterNote } from "src/world/notes/characterNotes";
import { formatTable, useWorldEngineViewContext } from "./util";

export const CharacterRC = () => {
  const note = useWorldEngineViewContext().note as CharacterNote;

  return (
    <div>
      {overviewTable(note)}
      {manaTable(note)}
      {talentTable(note)}
    </div>
  );
};

function overviewTable(note: CharacterNote) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Name", note.name],
    ["Age", note.age],
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
