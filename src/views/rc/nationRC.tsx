import { FormattedNumber } from "src/util/formatUtils";
import type { NationNote } from "src/world/notes/nationNote";
import { formatTable } from "./util";
import { Logger } from "src/util/Logger";
import { DataUtils } from "src/util/dataUtils";

export const NationRC = (props) => {
  const note = props.note as NationNote;

  return (
    <div>
      {generateOverviewTable(note)}
      {generateTerritoryTable(note)}
      {generateSettlementTable(note)}
      {generateTalentRankTable(note)}
    </div>
  );
};

function generateOverviewTable(note: NationNote) {
  const headers = ["Overview", "-"];
  const data: any[][] = [
    ["Country Name", note.name],
    ["Country Size", new FormattedNumber(note.geography.size, note.plugin.configManager.geographyAreaUnit)],
    ["Population", note.population],
  ];

  return formatTable(headers, data);
}

function generateTerritoryTable(note: NationNote) {
  if (note.geography.territories.length <= 1) {
    Logger.warn(note, "No territories defined.");
    return "";
  }
  const headers = ["Territory", "Count", "Average Size", "Average Population"];
  const data: any[][] = [];
  for (const territory of note.geography.territories) {
    const averageSize = territory.value;
    const territoryCount = note.geography.size / averageSize;
    const averagePopulation = note.population / territoryCount;
    data.push([
      territory.type,
      territoryCount,
      new FormattedNumber(averageSize, note.plugin.configManager.geographyAreaUnit),
      averagePopulation,
    ]);
  }
  return formatTable(headers, data);
}

function generateSettlementTable(note: NationNote) {
  const headers = ["Settlement Type", "Count", "Total Population", "Average Population"];
  const data: any[][] = [];

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
    data.push([settlement.name, settlementCount, settlementTotalPopulation, averagePopulation]);
    warnBadDistribution += settlement.value;
  }

  if (warnBadDistribution > 1.0 || warnBadDistribution < 1.0) {
    Logger.warn(note, "Settlement distribution does not equal 100%. Total: " + warnBadDistribution);
  }

  return formatTable(headers, data);
}

const EXTERNAL_MANA_TAlENT = 0.25;
const INTERNAL_MANA_TAlENT = 0.75;
const BLESSING = 0.2718;

function generateTalentRankTable(note: NationNote) {
  const headers = ["Rank", "External Mana (Magic)", "Internal Mana (Aura)", "Blessing (Divine)"];
  const data: any[][] = [];
  for (const talentRank of note.plugin.dataManager.datasets.talent.live) {
    const individuals = talentRank.perMillionPeople * (note.population / 1_000_000);

    const externalManaUsers = individuals * EXTERNAL_MANA_TAlENT;
    const internalManaUsers = individuals * INTERNAL_MANA_TAlENT;
    const blessingUsers = individuals * BLESSING;

    data.push([talentRank.rank, externalManaUsers, internalManaUsers, blessingUsers]);
  }

  return formatTable(headers, data);
}
