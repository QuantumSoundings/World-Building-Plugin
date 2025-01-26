import type { CharacterNote } from "src/world/notes/characterNote";
import { formatTable, useWorldEngineViewContext, type RContext } from "./util";

export const CharacterRC = () => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;
  const note = context.note as CharacterNote;
  const portrait = note.portraitUrl ? (
    <img src={note.portraitUrl} alt={`${note.name}'s image`} style={{ width: "225px", height: "225px" }} />
  ) : (
    <></>
  );

  return (
    <div>
      {portrait}
      {overviewTable(note, context)}
      {manaTable(note, context)}
      {talentTable(note, context)}
    </div>
  );
};

function overviewTable(note: CharacterNote, context: RContext) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Name", note.name],
    ["Date of Birth", note.dates.birth],
    ["Date of Death", note.dates.death],
    ["Age", note.dates.livingAge],
    ["Species", note.species],
    ["Citizenship", note.citizenship],
  ];

  return formatTable(headers, data, context);
}

function manaTable(note: CharacterNote, context: RContext) {
  const headers = ["Mana", "---"];
  const data: any[][] = [
    ["Cultivation", note.mana.cultivation],
    ["Attributes", note.mana.attributes.join(", ")],
    ["Blessing", note.mana.blessing],
  ];

  return formatTable(headers, data, context);
}

function talentTable(note: CharacterNote, context: RContext) {
  const headers = ["Talent", "---"];
  const data: any[][] = [
    ["Physical", note.talent.physical],
    ["Mana", note.talent.mana],
    ["Blessing", note.talent.blessing],
  ];

  return formatTable(headers, data, context);
}
