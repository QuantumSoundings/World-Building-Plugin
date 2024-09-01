import type { SettlementNote } from "src/world/notes/settlementNote";
import { formatTable } from "./util";
import type { Profession } from "src/types/dataTypes";

export const SettlementRC = (props) => {
  const note = props.note as SettlementNote;

  return (
    <div>
      {generateOverviewTable(note)}
      {generateProfessionTable(note)}
    </div>
  );
};

function generateOverviewTable(note: SettlementNote) {
  const headers = ["Overview", "-"];
  const data: any[][] = [
    ["Settlement Name", note.name],
    ["Settlement Type", note.demographics.settlementType],
    ["Population", note.population],
    ["Parent Note", note.relations.parentNote],
    ["Ruling Party", note.relations.rulingParty],
  ];
  return formatTable(headers, data);
}

function generateProfessionTable(note: SettlementNote) {
  const headers = ["Profession", "# Of Practitioners"];
  const data: any[][] = [];
  note.plugin.dataManager.datasets.profession.live.forEach((profession: Profession) => {
    if (!isNaN(profession.supportValue)) {
      data.push([profession.name, note.population / profession.supportValue]);
    }
  });
  return formatTable(headers, data);
}
