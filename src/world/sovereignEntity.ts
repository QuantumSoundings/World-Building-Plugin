import WorldBuildingPlugin from "src/main";
import { SovereignEntityFM, convertToSovereignEntityFM } from "src/frontmatter/sovereignEntityFM";
import { LogLevel, Utils, logger } from "src/util";

export class SovereignEntity {
  plugin: WorldBuildingPlugin;
  yamlProperties: any;
  sovereignEntityFM: SovereignEntityFM; // FrontMatter data

  // Calculated Values used in several places.
  // On Frontmatter change, these should be recalculated.
  population: number;
  //populationDensity: number;
  //populationDensityDescriptor: string;
  //birthsPerYear: number;
  //deathsPerYear: number;
  //netGrowthPerYear: number;
  overviewTable: string;
  // Geography Section
  territoryTable: string;
  settlementTable: string;
  // Demographics Section
  populationTable: string;
  speciesTable: string;
  languageTable: string;

  constructor(plugin: WorldBuildingPlugin, frontMatter: any) {
    this.plugin = plugin;
    //this.yamlProperties = this.plugin.yamlManager.readFile(sourcePath);
    if (frontMatter.geography.size === "MAP") {
      const countryDataResult = this.plugin.psdManager.findCountryData(frontMatter.name);
      if (countryDataResult.success === false) {
        logger(this, LogLevel.Error, countryDataResult.error.message);
        return;
      }
      const fmCopy = JSON.parse(JSON.stringify(frontMatter));
      fmCopy.geography.size = countryDataResult.result.unitArea;
      this.sovereignEntityFM = convertToSovereignEntityFM(fmCopy);
    } else {
      this.sovereignEntityFM = convertToSovereignEntityFM(frontMatter);
    }
    console.log(this.sovereignEntityFM);

    this.calculatePopulation();
    // Build our tables
    this.overviewTable = this.generateOverviewTable();
    this.territoryTable = this.generateTerritoryTable();
    this.settlementTable = this.generateSettlementTable();
    this.populationTable = this.generatePopulationTable();
    this.speciesTable = this.generateSpeciesTable();
    this.languageTable = this.generateLanguageTable();
  }

  public buildMarkdownView(el: HTMLElement) {
    el.createEl("h1", { text: "Generated Statistics" });
    el.createEl("h2", { text: "Overview" });
    Utils.markdownTableToHtml(el, this.overviewTable);
    el.createEl("h2", { text: "Geography" });
    el.createEl("h3", { text: "Territories" });
    Utils.markdownTableToHtml(el, this.territoryTable);
    el.createEl("h3", { text: "Settlements" });
    Utils.markdownTableToHtml(el, this.settlementTable);
    el.createEl("h2", { text: "Demographics" });
    el.createEl("h3", { text: "Population" });
    Utils.markdownTableToHtml(el, this.populationTable);
    el.createEl("h3", { text: "Species" });
    Utils.markdownTableToHtml(el, this.speciesTable);
    el.createEl("h3", { text: "Languages" });
    Utils.markdownTableToHtml(el, this.languageTable);
  }

  private calculatePopulation() {
    // Population Information
    const size = this.sovereignEntityFM.geography.size;
    const sizeUnit = this.sovereignEntityFM.geography.sizeUnit;

    let cultivatedLand = this.sovereignEntityFM.geography.cultivatedLand;
    const cultivatedLandUnit = this.sovereignEntityFM.geography.cultivatedLandUnit;

    let landFertility = this.sovereignEntityFM.geography.landFertility;
    const landFertilityUnit = this.sovereignEntityFM.geography.landFertilityUnit;

    const unitApi = this.plugin.getUnitConversionAPI();

    // Convert cultivatedLand and LandFertility to the same unit as size.
    if (cultivatedLandUnit === "Percent") {
      cultivatedLand = size * (cultivatedLand / 100);
    } else if (cultivatedLandUnit !== sizeUnit) {
      const result = unitApi.convertUnit(cultivatedLand, cultivatedLandUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      cultivatedLand = result.result;
    }

    if (landFertilityUnit !== sizeUnit) {
      const result = unitApi.convertUnit(landFertility, landFertilityUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      landFertility = result.result;
    }

    this.population = cultivatedLand * landFertility;
  }

  // Someone fixed versions of the old view code.
  private generateOverviewTable() {
    let overviewTable = Utils.formatRow(["Overview", "-"]);
    overviewTable += Utils.formatRow(["---", "---"]);
    overviewTable += Utils.formatRow(["Country Name", this.sovereignEntityFM.name]);
    overviewTable += Utils.formatRow([
      "Country Size",
      Utils.formatNumberWithUnit(this.sovereignEntityFM.geography.size, this.sovereignEntityFM.geography.sizeUnit),
    ]);
    overviewTable += Utils.formatRow(["Population", this.population]);
    return overviewTable;
  }

  private generatePopulationTable() {
    const populationDensity = this.population / this.sovereignEntityFM.geography.size;
    const densityDescriptorResult = this.plugin
      .getPopulationAPI()
      .getDescriptorForPopulation(populationDensity, this.sovereignEntityFM.geography.sizeUnit);
    if (densityDescriptorResult.success === false) {
      logger(this, LogLevel.Error, densityDescriptorResult.error.message);
      return "";
    }
    const densityDescriptor = densityDescriptorResult.result;
    const lifeExpectancy = this.sovereignEntityFM.demographics.lifeExpectancy;
    const growthRate = this.sovereignEntityFM.demographics.populationGrowthRate;
    const netGrowthPerYear = this.population * (growthRate / 100);
    const deathsPerYear = this.population / lifeExpectancy;
    const birthsPerYear = netGrowthPerYear + deathsPerYear;

    let populationTable = Utils.formatRow(["Statistic", "-"]);
    populationTable += Utils.formatRow(["---", "---"]);

    populationTable += Utils.formatRow(["Population", this.population]);
    populationTable += Utils.formatRow([
      "Population Density",
      Utils.formatNumberWithUnit(populationDensity, `(${densityDescriptor})`),
    ]);
    populationTable += Utils.formatRow(["Life Expectancy", this.sovereignEntityFM.demographics.lifeExpectancy]);
    populationTable += Utils.formatRow(["Births/year", birthsPerYear]);
    populationTable += Utils.formatRow(["Deaths/year", deathsPerYear]);
    populationTable += Utils.formatRow(["Net/year", netGrowthPerYear]);
    populationTable += Utils.formatRow(["Growth %", Utils.formatNumberWithUnit(growthRate, "%")]);

    return populationTable;
  }

  private generateSpeciesTable() {
    let speciesTable = Utils.formatRow(["Species", "Population"]);
    speciesTable += Utils.formatRow(["---", "---"]);
    let warnBadDistribution = 0;
    for (const species of this.sovereignEntityFM.species) {
      speciesTable += Utils.formatRow([species.name, species.value * this.population]);
      warnBadDistribution += species.value;
    }
    if (warnBadDistribution > 1.0 || warnBadDistribution < 1.0) {
      logger(this, LogLevel.Warning, "Species distribution does not equal 100%. Total: " + warnBadDistribution);
    }
    return speciesTable;
  }

  private generateLanguageTable() {
    let languageTable = Utils.formatRow(["Language", "# of Speakers"]);
    languageTable += Utils.formatRow(["---", "---"]);
    for (const language of this.sovereignEntityFM.languages) {
      languageTable += Utils.formatRow([language.name, language.value * this.population]);
    }
    return languageTable;
  }

  private generateTerritoryTable() {
    let territoryTable = Utils.formatRow(["Territory", "Count", "Average Size", "Average Population"]);
    territoryTable += Utils.formatRow(["---", "---", "---", "---"]);
    const generationMethod = this.sovereignEntityFM.geography.generation.method;
    for (const territory of this.sovereignEntityFM.geography.territories) {
      let averagePopulation = 0;
      let averageSize = 0;
      let territoryCount = 0;
      switch (generationMethod) {
        case "Size":
          averageSize = territory.value;
          territoryCount = this.sovereignEntityFM.geography.size / averageSize;
          averagePopulation = this.population / territoryCount;
          break;
        case "Population":
          averagePopulation = territory.value;
          territoryCount = this.population / averagePopulation;
          averageSize = this.sovereignEntityFM.geography.size / territoryCount;
          break;
        default:
          logger(this, LogLevel.Error, "Unknown territory generation method: " + generationMethod);
          return "";
      }
      territoryTable += Utils.formatRow([
        territory.type,
        territoryCount,
        Utils.formatNumberWithUnit(averageSize, this.sovereignEntityFM.geography.sizeUnit),
        averagePopulation,
      ]);
    }
    return territoryTable;
  }

  private generateSettlementTable() {
    let settlementTable = Utils.formatRow(["Settlement Type", "Count", "Total Population", "Average Population"]);
    settlementTable += Utils.formatRow(["---", "---", "---", "---"]);
    let warnBadDistribution = 0;
    for (const settlement of this.sovereignEntityFM.geography.settlements) {
      const settlementData = this.plugin.getSettlementAPI().findSettlementDataByType(settlement.name);
      if (settlementData === undefined) {
        logger(this, LogLevel.Error, "Could not find settlement data for type: " + settlement.name);
        continue;
      }
      const settlementTotalPopulation = this.population * settlement.value;
      // Do this to coerce to integer numbers of settlements.
      let averagePopulation = (settlementData.minPopulation + settlementData.maxPopulation) / 2;
      let settlementCount = Math.round(settlementTotalPopulation / averagePopulation);
      if (settlementCount === 0) {
        if (
          settlementTotalPopulation > settlementData.minPopulation &&
          settlementTotalPopulation < settlementData.maxPopulation
        ) {
          settlementCount = 1;
        } else {
          logger(
            this,
            LogLevel.Warning,
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
      logger(this, LogLevel.Warning, "Settlement distribution does not equal 100%. Total: " + warnBadDistribution);
    }

    return settlementTable;
  }
}
