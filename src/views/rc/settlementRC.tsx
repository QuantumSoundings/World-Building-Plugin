import { SettlementNote } from "src/world/notes/settlementNote";
import { formatTable, useWorldEngineViewContext, type RContext } from "./util";
import type { Profession } from "src/types/dataTypes";

interface SettlementRCProps {
  note: SettlementNote;
}

export const SettlementRC = ({ note }: SettlementRCProps) => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;

  return (
    <div>
      {generateOverviewTable(note, context)}
      {generateProfessionTable(note, context)}
    </div>
  );
};

function generateOverviewTable(note: SettlementNote, context: RContext) {
  const headers = ["Overview", "-"];
  const data: any[][] = [
    ["Settlement Name", note.name],
    ["Settlement Type", note.demographics.settlementType],
    ["Date of Founding", note.dates.founded],
    ["Date of Dissolution", note.dates.dissolved],
    ["Age", note.dates.nonLivingAge],
    ["Population", note.population],
    ["Parent Note", note.relations.parentNote],
    ["Ruling Party", note.relations.rulingParty],
  ];
  return formatTable(headers, data, context);
}

function generateProfessionTable(note: SettlementNote, context: RContext) {
  const headers = ["Profession", "# Of Practitioners"];
  const data: any[][] = [];
  note.plugin.dataManager.datasets.profession.live.forEach((profession: Profession) => {
    if (!isNaN(profession.supportValue)) {
      data.push([profession.name, note.population / profession.supportValue]);
    }
  });
  return formatTable(headers, data, context);
}
