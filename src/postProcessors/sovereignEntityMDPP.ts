import { Utils } from "src/util";
import { Logger } from "src/util/Logger";
import { SovereignEntity } from "src/world/sovereignEntity";

export function sovereignEntityGeneratedStats(sovereignEntity: SovereignEntity, el: HTMLElement): void {
  el.createEl("h1", { text: "Generated Statistics" });
  el.createEl("h2", { text: "Overview" });
  Utils.markdownTableToHtml(el, generateOverviewTable(sovereignEntity));
  el.createEl("h2", { text: "Geography" });
  el.createEl("h3", { text: "Territories" });
  Utils.markdownTableToHtml(el, generateTerritoryTable(sovereignEntity));
  el.createEl("h3", { text: "Settlements" });
  Utils.markdownTableToHtml(el, generateSettlementTable(sovereignEntity));
  el.createEl("h2", { text: "Demographics" });
  el.createEl("h3", { text: "Population" });
  Utils.markdownTableToHtml(el, generatePopulationTable(sovereignEntity));
  el.createEl("h3", { text: "Species" });
  Utils.markdownTableToHtml(el, generateSpeciesTable(sovereignEntity));
  el.createEl("h3", { text: "Languages" });
  Utils.markdownTableToHtml(el, generateLanguageTable(sovereignEntity));
}

function generateOverviewTable(sovereignEntity: SovereignEntity) {
  let overviewTable = Utils.formatRow(["Overview", "-"]);
  overviewTable += Utils.formatRow(["---", "---"]);
  overviewTable += Utils.formatRow(["Country Name", sovereignEntity.configuration.name]);
  overviewTable += Utils.formatRow([
    "Country Size",
    Utils.formatNumberWithUnit(
      sovereignEntity.configuration.geography.size,
      sovereignEntity.configuration.geography.sizeUnit
    ),
  ]);
  overviewTable += Utils.formatRow(["Population", sovereignEntity.population]);
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

  let populationTable = Utils.formatRow(["Statistic", "-"]);
  populationTable += Utils.formatRow(["---", "---"]);

  populationTable += Utils.formatRow(["Population", sovereignEntity.population]);
  populationTable += Utils.formatRow([
    "Population Density",
    Utils.formatNumberWithUnit(populationDensity, `(${densityDescriptor})`),
  ]);
  populationTable += Utils.formatRow(["Life Expectancy", sovereignEntity.configuration.demographics.lifeExpectancy]);
  populationTable += Utils.formatRow(["Births/year", birthsPerYear]);
  populationTable += Utils.formatRow(["Deaths/year", deathsPerYear]);
  populationTable += Utils.formatRow(["Net/year", netGrowthPerYear]);
  populationTable += Utils.formatRow(["Growth %", Utils.formatNumberWithUnit(growthRate, "%")]);

  return populationTable;
}

function generateSpeciesTable(sovereignEntity: SovereignEntity) {
  let speciesTable = Utils.formatRow(["Species", "Population"]);
  speciesTable += Utils.formatRow(["---", "---"]);
  let warnBadDistribution = 0;
  for (const species of sovereignEntity.configuration.species) {
    speciesTable += Utils.formatRow([species.name, species.value * sovereignEntity.population]);
    warnBadDistribution += species.value;
  }
  if (warnBadDistribution > 1.0 || warnBadDistribution < 1.0) {
    Logger.warn(sovereignEntity, "Species distribution does not equal 100%. Total: " + warnBadDistribution);
  }
  return speciesTable;
}

function generateLanguageTable(sovereignEntity: SovereignEntity) {
  let languageTable = Utils.formatRow(["Language", "# of Speakers"]);
  languageTable += Utils.formatRow(["---", "---"]);
  for (const language of sovereignEntity.configuration.languages) {
    languageTable += Utils.formatRow([language.name, language.value * sovereignEntity.population]);
  }
  return languageTable;
}

function generateTerritoryTable(sovereignEntity: SovereignEntity) {
  let territoryTable = Utils.formatRow(["Territory", "Count", "Average Size", "Average Population"]);
  territoryTable += Utils.formatRow(["---", "---", "---", "---"]);
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
    territoryTable += Utils.formatRow([
      territory.type,
      territoryCount,
      Utils.formatNumberWithUnit(averageSize, sovereignEntity.configuration.geography.sizeUnit),
      averagePopulation,
    ]);
  }
  return territoryTable;
}

function generateSettlementTable(sovereignEntity: SovereignEntity) {
  let settlementTable = Utils.formatRow(["Settlement Type", "Count", "Total Population", "Average Population"]);
  settlementTable += Utils.formatRow(["---", "---", "---", "---"]);
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

    settlementTable += Utils.formatRow([
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
