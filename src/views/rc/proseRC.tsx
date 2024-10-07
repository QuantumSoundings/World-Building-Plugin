import type { ProseNote } from "src/world/notes/proseNote";
import { formatTable, useWorldEngineViewContext, type RCUtilContext } from "./util";
import { calculateTimeDifference } from "src/util/time";
import type { CharacterNote } from "src/world/notes/characterNotes";

export const ProseRC = () => {
  const view = useWorldEngineViewContext();
  const context: RCUtilContext = {
    note: view.note,
    file: view.note.file,
    plugin: view.plugin,
    popoverParent: view,
  };
  const note = useWorldEngineViewContext().note as ProseNote;

  return (
    <div>
      {generateOverviewTable(note, context)}
      {generateCharactersTable(note, context)}
    </div>
  );
};

function generateOverviewTable(note: ProseNote, context: RCUtilContext) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Story Date", note.storyDate],
    ["Scene Loc.", note.sceneLocations.join(", ")],
  ];

  return formatTable(headers, data, context);
}

function generateCharactersTable(note: ProseNote, context: RCUtilContext) {
  const headers = ["Characters", "Current Age"];
  const data: any[][] = [];
  note.characters.forEach((character: CharacterNote) => {
    data.push([character, calculateTimeDifference(character.birthDate, context.plugin.settings.currentDate)]);
  });

  return formatTable(headers, data, context);
}
