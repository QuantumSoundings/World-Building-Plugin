import { DataUtils } from "src/util/dataUtils";
import { FormatUtils } from "src/util/formatUtils";
import { Logger } from "src/util/Logger";
import { NationNote } from "src/world/notes/nationNote";

export function generateNationView(note: NationNote, el: HTMLElement): void {
  el.createEl("h1", { text: "Generated Statistics" });
  el.createEl("h2", { text: "Overview" });
  FormatUtils.markdownTableToHtml(el, generateOverviewTable(note));
  el.createEl("h2", { text: "Geography" });
  el.createEl("h3", { text: "Territories" });
  FormatUtils.markdownTableToHtml(el, generateTerritoryTable(note));
  el.createEl("h3", { text: "Settlements" });
  FormatUtils.markdownTableToHtml(el, generateSettlementTable(note));
  el.createEl("h2", { text: "Talent Ranks" });
  FormatUtils.markdownTableToHtml(el, generateTalentRankTable(note));
}

function generateOverviewTable(note: NationNote) {
  let overviewTable = FormatUtils.formatRow(["Overview", "-"]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  overviewTable += FormatUtils.formatRow(["Country Name", note.name]);
  overviewTable += FormatUtils.formatRow([
    "Country Size",
    FormatUtils.formatNumberWithUnit(note.geography.size, note.plugin.configManager.geographyAreaUnit),
  ]);
  overviewTable += FormatUtils.formatRow(["Population", note.population]);
  return overviewTable;
}

function generateTerritoryTable(note: NationNote) {
  if (note.geography.territories.length === 1) {
    Logger.warn(note, "No territories defined.");
    return "";
  }
  let territoryTable = FormatUtils.formatRow(["Territory", "Count", "Average Size", "Average Population"]);
  territoryTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  for (const territory of note.geography.territories) {
    const averageSize = territory.value;
    const territoryCount = note.geography.size / averageSize;
    const averagePopulation = note.population / territoryCount;
    territoryTable += FormatUtils.formatRow([
      territory.type,
      territoryCount,
      FormatUtils.formatNumberWithUnit(averageSize, note.plugin.configManager.geographyAreaUnit),
      averagePopulation,
    ]);
  }
  return territoryTable;
}

function generateSettlementTable(note: NationNote) {
  let settlementTable = FormatUtils.formatRow(["Settlement Type", "Count", "Total Population", "Average Population"]);
  settlementTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  let warnBadDistribution = 0;
  for (const settlement of note.geography.settlements) {
    const settlementData = DataUtils.findSettlementDataByType(settlement.name);
    if (settlementData === undefined) {
      Logger.error(note, "Could not find settlement data for type: " + settlement.name);
      continue;
    }
    const settlementTotalPopulation = note.population * settlement.value;
    let averagePopulation = (settlementData.minPopulation + settlementData.maxPopulation) / 2;
    let settlementCount = Math.round(settlementTotalPopulation / averagePopulation);
    if (settlementCount === 0) {
      if (
        settlementTotalPopulation > settlementData.minPopulation &&
        settlementTotalPopulation < settlementData.maxPopulation
      ) {
        settlementCount = 1;
      } else {
        Logger.warn(
          note,
          "Not enough population to support a settlement of type: " +
            settlement.name +
            ". Try adjusting the distribution."
        );
      }
    }
    averagePopulation = settlementTotalPopulation / settlementCount;

    settlementTable += FormatUtils.formatRow([
      settlement.name,
      settlementCount,
      settlementTotalPopulation,
      averagePopulation,
    ]);
    warnBadDistribution += settlement.value;
  }

  if (warnBadDistribution > 1.0 || warnBadDistribution < 1.0) {
    Logger.warn(note, "Settlement distribution does not equal 100%. Total: " + warnBadDistribution);
  }

  return settlementTable;
}

const EXTERNAL_MANA_TAlENT = 0.25;
const INTERNAL_MANA_TAlENT = 0.75;
const BLESSING = 0.2718;

function generateTalentRankTable(note: NationNote) {
  let talentTable = FormatUtils.formatRow([
    "Rank",
    "External Mana (Magic)",
    "Internal Mana (Aura)",
    "Blessing (Divine)",
  ]);
  talentTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  for (const talentRank of note.plugin.dataManager.datasets.talent.live) {
    const individuals = talentRank.perMillionPeople * (note.population / 1_000_000);

    const externalManaUsers = individuals * EXTERNAL_MANA_TAlENT;
    const internalManaUsers = individuals * INTERNAL_MANA_TAlENT;
    const blessingUsers = individuals * BLESSING;

    talentTable += FormatUtils.formatRow([talentRank.rank, externalManaUsers, internalManaUsers, blessingUsers]);
  }

  return talentTable;
}
