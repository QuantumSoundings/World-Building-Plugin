import { Profession } from "src/data/dataTypes";
import { FormatUtils } from "src/util/format";
import { SettlementNote } from "src/world/notes/settlementNote";

export function generateSettlementView(note: SettlementNote, el: HTMLElement): void {
  el.createEl("h1", { text: "Generated Statistics" });
  el.createEl("h2", { text: "Overview" });
  FormatUtils.markdownTableToHtml(el, generateOverviewTable(note));
  el.createEl("h2", { text: "Professions" });
  FormatUtils.markdownTableToHtml(el, generateProfessionTable(note));
}

function generateOverviewTable(note: SettlementNote) {
  let overviewTable = FormatUtils.formatRow(["Overview", "-"]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  // Rows
  overviewTable += FormatUtils.formatRow(["Settlement Name", note.name]);
  overviewTable += FormatUtils.formatRow(["Settlement Type", note.demographics.settlementType]);
  overviewTable += FormatUtils.formatRow(["Population", note.population]);
  overviewTable += FormatUtils.formatRow(["Parent Note", note.relations.parentNote]);
  overviewTable += FormatUtils.formatRow(["Ruling Party", note.relations.rulingParty]);

  return overviewTable;
}

function generateProfessionTable(note: SettlementNote) {
  let professionTable = FormatUtils.formatRow(["Profession", "# Of Practitioners"]);
  professionTable += FormatUtils.formatRow(["---", "---"]);
  // Rows
  note.plugin.dataManager.datasets.profession.live.forEach((profession: Profession) => {
    if (!isNaN(profession.supportValue)) {
      professionTable += FormatUtils.formatRow([profession.name, note.population / profession.supportValue]);
    }
  });
  return professionTable;
}
