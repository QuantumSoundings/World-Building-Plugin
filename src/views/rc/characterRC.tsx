import type { CharacterNote } from "src/world/notes/characterNotes";
import { formatTable } from "./util";

export const CharacterRC = (props) => {
  const note = props.note as CharacterNote;

  const headers = ["Overview", "---"];
  const data: string[][] = [
    ["Name", note.name],
    ["Age", note.age + ""],
    ["Species", note.species],
    ["Citizenship", note.citizenship],
    ["Mana", "---"],
    ["Cultivation", note.mana.cultivation],
    ["Attributes", note.mana.attributes.join(", ")],
    ["Blessing", note.mana.blessing],
    ["Talent", "---"],
    ["Physical", note.talent.physical],
    ["Mana", note.talent.mana],
    ["Blessing", note.talent.blessing],
  ];

  return <div>{formatTable(headers, data)}</div>;
};
