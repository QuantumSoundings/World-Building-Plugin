import { FormatUtils } from "src/util/format";
import { Logger } from "src/util/Logger";
import { SovereignEntity } from "src/world/sovereignEntity";

export function sovereignEntityGeneratedStats(sovereignEntity: SovereignEntity, el: HTMLElement): void {
  el.createEl("h1", { text: "Generated Statistics" });
  el.createEl("h2", { text: "Overview" });
  FormatUtils.markdownTableToHtml(el, generateOverviewTable(sovereignEntity));
  el.createEl("h2", { text: "Geography" });
  el.createEl("h3", { text: "Territories" });
  FormatUtils.markdownTableToHtml(el, generateTerritoryTable(sovereignEntity));
  el.createEl("h3", { text: "Settlements" });
  FormatUtils.markdownTableToHtml(el, generateSettlementTable(sovereignEntity));
  el.createEl("h2", { text: "Demographics" });
  el.createEl("h3", { text: "Population" });
  FormatUtils.markdownTableToHtml(el, generatePopulationTable(sovereignEntity));
  el.createEl("h3", { text: "Species" });
  FormatUtils.markdownTableToHtml(el, generateSpeciesTable(sovereignEntity));
  el.createEl("h3", { text: "Languages" });
  FormatUtils.markdownTableToHtml(el, generateLanguageTable(sovereignEntity));
  el.createEl("h2", { text: "Talent Ranks" });
  FormatUtils.markdownTableToHtml(el, generateTalentRankTable(sovereignEntity));
}

function generateOverviewTable(sovereignEntity: SovereignEntity) {
  let overviewTable = FormatUtils.formatRow(["Overview", "-"]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  overviewTable += FormatUtils.formatRow(["Country Name", sovereignEntity.configuration.name]);
  overviewTable += FormatUtils.formatRow([
    "Country Size",
    FormatUtils.formatNumberWithUnit(
      sovereignEntity.configuration.geography.size,
      sovereignEntity.configuration.geography.sizeUnit
    ),
  ]);
  overviewTable += FormatUtils.formatRow(["Population", sovereignEntity.population]);
  return overviewTable;
}

function generatePopulationTable(sovereignEntity: SovereignEntity) {
  const populationDensity = sovereignEntity.population / sovereignEntity.configuration.geography.size;
  const densityDescriptorResult = sovereignEntity.plugin
    .getPopulationAPI()
    .getDescriptorForPopulation(populationDensity, sovereignEntity.configuration.geography.sizeUnit);
  if (densityDescriptorResult.success === false) {
    Logger.error(sovereignEntity, densityDescriptorResult.error.message);
    return "";
  }
  const densityDescriptor = densityDescriptorResult.result;
  const lifeExpectancy = sovereignEntity.configuration.demographics.lifeExpectancy;
  const growthRate = sovereignEntity.configuration.demographics.populationGrowthRate;
  const netGrowthPerYear = sovereignEntity.population * (growthRate / 100);
  const deathsPerYear = sovereignEntity.population / lifeExpectancy;
  const birthsPerYear = netGrowthPerYear + deathsPerYear;

  let populationTable = FormatUtils.formatRow(["Statistic", "-"]);
  populationTable += FormatUtils.formatRow(["---", "---"]);

  populationTable += FormatUtils.formatRow(["Population", sovereignEntity.population]);
  populationTable += FormatUtils.formatRow([
    "Population Density",
    FormatUtils.formatNumberWithUnit(populationDensity, `(${densityDescriptor})`),
  ]);
  populationTable += FormatUtils.formatRow([
    "Life Expectancy",
    sovereignEntity.configuration.demographics.lifeExpectancy,
  ]);
  populationTable += FormatUtils.formatRow(["Births/year", birthsPerYear]);
  populationTable += FormatUtils.formatRow(["Deaths/year", deathsPerYear]);
  populationTable += FormatUtils.formatRow(["Net/year", netGrowthPerYear]);
  populationTable += FormatUtils.formatRow(["Growth %", FormatUtils.formatNumberWithUnit(growthRate, "%")]);

  return populationTable;
}

function generateSpeciesTable(sovereignEntity: SovereignEntity) {
  let speciesTable = FormatUtils.formatRow(["Species", "Population"]);
  speciesTable += FormatUtils.formatRow(["---", "---"]);
  let warnBadDistribution = 0;
  for (const species of sovereignEntity.configuration.species) {
    speciesTable += FormatUtils.formatRow([species.name, species.value * sovereignEntity.population]);
    warnBadDistribution += species.value;
  }
  if (warnBadDistribution > 1.0 || warnBadDistribution < 1.0) {
    Logger.warn(sovereignEntity, "Species distribution does not equal 100%. Total: " + warnBadDistribution);
  }
  return speciesTable;
}

function generateLanguageTable(sovereignEntity: SovereignEntity) {
  let languageTable = FormatUtils.formatRow(["Language", "# of Speakers"]);
  languageTable += FormatUtils.formatRow(["---", "---"]);
  for (const language of sovereignEntity.configuration.languages) {
    languageTable += FormatUtils.formatRow([language.name, language.value * sovereignEntity.population]);
  }
  return languageTable;
}

function generateTerritoryTable(sovereignEntity: SovereignEntity) {
  let territoryTable = FormatUtils.formatRow(["Territory", "Count", "Average Size", "Average Population"]);
  territoryTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  const generationMethod = sovereignEntity.configuration.geography.generation.method;
  for (const territory of sovereignEntity.configuration.geography.territories) {
    let averagePopulation = 0;
    let averageSize = 0;
    let territoryCount = 0;
    switch (generationMethod) {
      case "Size":
        averageSize = territory.value;
        territoryCount = sovereignEntity.configuration.geography.size / averageSize;
        averagePopulation = sovereignEntity.population / territoryCount;
        break;
      case "Population":
        averagePopulation = territory.value;
        territoryCount = sovereignEntity.population / averagePopulation;
        averageSize = sovereignEntity.configuration.geography.size / territoryCount;
        break;
      default:
        Logger.error(sovereignEntity, "Unknown territory generation method: " + generationMethod);
        return "";
    }
    territoryTable += FormatUtils.formatRow([
      territory.type,
      territoryCount,
      FormatUtils.formatNumberWithUnit(averageSize, sovereignEntity.configuration.geography.sizeUnit),
      averagePopulation,
    ]);
  }
  return territoryTable;
}

function generateSettlementTable(sovereignEntity: SovereignEntity) {
  let settlementTable = FormatUtils.formatRow(["Settlement Type", "Count", "Total Population", "Average Population"]);
  settlementTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  let warnBadDistribution = 0;
  for (const settlement of sovereignEntity.configuration.geography.settlements) {
    const settlementData = sovereignEntity.plugin.getSettlementAPI().findSettlementDataByType(settlement.name);
    if (settlementData === undefined) {
      Logger.error(sovereignEntity, "Could not find settlement data for type: " + settlement.name);
      continue;
    }
    const settlementTotalPopulation = sovereignEntity.population * settlement.value;
    // Do sovereignEntity to coerce to integer numbers of settlements.
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
          sovereignEntity,
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
    Logger.warn(sovereignEntity, "Settlement distribution does not equal 100%. Total: " + warnBadDistribution);
  }

  return settlementTable;
}

const EXTERNAL_MANA_TAlENT = 0.25;
const INTERNAL_MANA_TAlENT = 0.75;
const BLESSING = 0.2718;

function generateTalentRankTable(sovereignEntity: SovereignEntity) {
  let talentTable = FormatUtils.formatRow([
    "Rank",
    "External Mana (Magic)",
    "Internal Mana (Aura)",
    "Blessing (Divine)",
  ]);
  talentTable += FormatUtils.formatRow(["---", "---", "---", "---"]);
  for (const talentRank of sovereignEntity.plugin.userOverrideData.defaultData.talentRanks) {
    const individuals = talentRank.perMillionPeople * (sovereignEntity.population / 1_000_000);

    const externalManaUsers = individuals * EXTERNAL_MANA_TAlENT;
    const internalManaUsers = individuals * INTERNAL_MANA_TAlENT;
    const blessingUsers = individuals * BLESSING;

    talentTable += FormatUtils.formatRow([talentRank.rank, externalManaUsers, internalManaUsers, blessingUsers]);
  }

  return talentTable;
}
