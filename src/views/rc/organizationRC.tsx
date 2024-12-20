import { formatTable, useWorldEngineViewContext, type RContext } from "./util";
import type { OrganizationNote } from "src/world/notes/organizationNote";

export const OrganizationRC = () => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;
  const note = context.note as OrganizationNote;

  return <div>{generateOverviewTable(note, context)}</div>;
};

function generateOverviewTable(note: OrganizationNote, context: RContext) {
  const headers = ["Overview", "-"];
  const data: any[][] = [
    ["Org Name", note.name],
    ["Date of Founding", note.dates.founded],
    ["Date of Dissolution", note.dates.dissolved],
    ["Age", note.dates.nonLivingAge],
    ["Ruling Party", note.relations.rulingParty],
  ];

  return formatTable(headers, data, context);
}
