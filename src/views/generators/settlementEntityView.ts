import { Profession } from "src/data/dataTypes";
import { FormatUtils } from "src/util/format";
import { SettlementEntity } from "src/world/entities/settlementEntity";

export function generateSettlementEntityView(settlementEntity: SettlementEntity, el: HTMLElement): void {
  el.createEl("h1", { text: "Generated Statistics" });
  el.createEl("h2", { text: "Overview" });
  FormatUtils.markdownTableToHtml(el, generateOverviewTable(settlementEntity));
  el.createEl("h2", { text: "Professions" });
  FormatUtils.markdownTableToHtml(el, generateProfessionTable(settlementEntity));
}

function generateOverviewTable(settlementEntity: SettlementEntity) {
  let overviewTable = FormatUtils.formatRow(["Overview", "-"]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  // Rows
  overviewTable += FormatUtils.formatRow(["Settlement Name", settlementEntity.configuration.name]);
  overviewTable += FormatUtils.formatRow([
    "Settlement Type",
    settlementEntity.configuration.demographics.settlementType,
  ]);
  overviewTable += FormatUtils.formatRow(["Population", settlementEntity.population]);
  overviewTable += FormatUtils.formatRow(["Parent Entity", settlementEntity.configuration.relations.parentEntity]);
  overviewTable += FormatUtils.formatRow(["Ruling Party", settlementEntity.configuration.relations.rulingParty]);
  return overviewTable;
}

function generateProfessionTable(settlementEntity: SettlementEntity) {
  let professionTable = FormatUtils.formatRow(["Profession", "# Of Practitioners"]);
  professionTable += FormatUtils.formatRow(["---", "---"]);
  // Rows
  settlementEntity.plugin.dataManager.datasets.profession.live.forEach((profession: Profession) => {
    if (!isNaN(profession.supportValue)) {
      professionTable += FormatUtils.formatRow([
        profession.name,
        settlementEntity.population / profession.supportValue,
      ]);
    }
  });
  return professionTable;
}
