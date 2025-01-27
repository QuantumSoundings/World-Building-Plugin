import { formatTable, useWorldEngineViewContext, type RContext } from "./util";
import { OrganizationNote } from "src/world/notes/organizationNote";

interface OrganizationRCProps {
  note: OrganizationNote;
}

export const OrganizationRC = ({ note }: OrganizationRCProps) => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;

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
