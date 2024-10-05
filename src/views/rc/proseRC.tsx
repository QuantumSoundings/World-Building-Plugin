import type { ProseNote } from "src/world/notes/proseNote";
import { buildLink, formatTable, LinkElement, useWorldEngineViewContext } from "./util";
import { calculateTimeDifference } from "src/util/time";
import type WorldBuildingPlugin from "src/main";

export const ProseRC = () => {
  const note = useWorldEngineViewContext().note as ProseNote;
  const plugin = useWorldEngineViewContext().plugin;

  return (
    <div>
      {generateOverviewTable(note)}
      {generateCharactersTable(note, plugin)}
    </div>
  );
};

function generateOverviewTable(note: ProseNote) {
  const headers = ["Overview", "---"];
  const data: any[][] = [
    ["Story Date", note.storyDate],
    ["Scene Loc.", note.sceneLocations.join(", ")],
  ];

  return formatTable(headers, data);
}

function generateCharactersTable(note: ProseNote, plugin: WorldBuildingPlugin) {
  const headers = ["Characters", "Current Age"];
  const data: any[][] = [];
  note.characters.forEach((character) => {
    data.push([
      buildLink(LinkElement.NONE, {
        note: character,
        app: plugin.app,
        popoverParent: plugin.getWorldEngineView(),
      }),
      calculateTimeDifference(character.birthDate, plugin.settings.currentDate),
    ]);
  });

  return formatTable(headers, data);
}
