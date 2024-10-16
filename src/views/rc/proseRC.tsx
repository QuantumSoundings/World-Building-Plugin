import type { ProseNote } from "src/world/notes/proseNote";
import { formatTable, useWorldEngineViewContext, type RContext } from "./util";
import { calculateTimeDifference, crt } from "src/util/time";
import type { CharacterNote } from "src/world/notes/characterNotes";
import type { LinkText } from "src/world/notes/wbNote";

export const ProseRC = () => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;
  const note = context.note as ProseNote;

  return (
    <div>
      {generateOverviewTable(note, context)}
      {generateLocationsTable(note, context)}
      {generateCharactersTable(note, context)}
    </div>
  );
};

function generateOverviewTable(note: ProseNote, context: RContext) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Story Date", note.storyDate],
    [
      "Relative Time",
      crt(note.storyDate, context.plugin.settings.currentDate) +
        calculateTimeDifference(context.plugin.settings.currentDate, note.storyDate),
    ],
  ];

  return formatTable(headers, data, context);
}

function generateLocationsTable(note: ProseNote, context: RContext) {
  const headers = ["Locations"];
  const data: any[][] = [];
  note.sceneLocations.forEach((location) => {
    data.push([location]);
  });

  return formatTable(headers, data, context);
}

function generateCharactersTable(note: ProseNote, context: RContext) {
  const headers = ["Characters", "Story Age", "Current Age"];
  const data: any[][] = [];
  note.characters.forEach((character: LinkText) => {
    const characterNote = character.resolvedNote as CharacterNote;
    data.push([
      character,
      calculateTimeDifference(note.storyDate, characterNote.birthDate),
      calculateTimeDifference(context.plugin.settings.currentDate, characterNote.birthDate),
    ]);
  });

  return formatTable(headers, data, context);
}
