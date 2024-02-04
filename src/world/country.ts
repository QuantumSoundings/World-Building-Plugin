import { Type, plainToClass } from "class-transformer";
import { UnitConversionAPI } from "src/api/unitConversionApi";
import WorldBuildingPlugin from "src/main";
import { Country, convertToCountry } from "src/templates/countryTemplate";
import { LogLevel, logger } from "src/util";

export class CountryView {
  plugin: WorldBuildingPlugin;
  yamlProperties: any;
  country: Country; // FrontMatter data

  // Calculated Values
  population: number;

  constructor(plugin: WorldBuildingPlugin, sourcePath: string) {
    this.plugin = plugin;
    this.yamlProperties = this.plugin.yamlManager.readFile(sourcePath);
    this.country = convertToCountry(this.yamlProperties);

    // What all can we calculate on creation?
    // Population
    // Net Growth Rate
    // Births/year
    // Deaths/year
    this.generateStaticInformation();
  }
  private generateStaticInformation() {
    // Population Information
    {
      const size = this.country.geography.size;
      const sizeUnit = this.country.geography.sizeUnit;
      let cultivatedLand = size * this.country.geography.cultivatedLand;
      const cultivatedLandUnit = this.country.geography.cultivatedLandUnit;
      let landFertility = this.country.geography.landFertility;
      const landFertilityUnit = this.country.geography.landFertilityUnit;

      // Convert cultivatedLand and LandFertility to the same unit as size.
      const unitApi: UnitConversionAPI = this.plugin.getUnitConversionAPI();
      if (cultivatedLandUnit === "percent") {
        cultivatedLand = size * cultivatedLand;
      } else {
        cultivatedLand = unitApi.convertUnit(cultivatedLand, cultivatedLandUnit, sizeUnit);
      }
      landFertility = unitApi.convertUnit(landFertility, landFertilityUnit, sizeUnit);
    }

    this.population = size * cultivated * landFertility;
  }

  private formatNumber(number: number, unit: string = ""): string {
    return number.toLocaleString("en-US") + (unit !== "" ? " " + unit : "");
  }

  private formatRow(rows: any[]): string {
    return "|" + rows.join(" | ") + " |\n";
  }

  // Someone fixed versions of the old view code.
  private generateOverviewTable() {
    let overviewTable = this.formatRow(["Overview", "-"]);
    overviewTable += this.formatRow(["---", "---"]);
    overviewTable += this.formatRow(["Country Name", this.country.name]);
    overviewTable += this.formatRow([
      "Country Size",
      this.formatNumber(this.country.geography.size, this.country.geography.units),
    ]);
    overviewTable += this.formatRow(["Population", this.formatNumber(this.population)]);
    return overviewTable;
  }

  private generatePopulationTable() {
    const populationDensity = this.population / this.country.geography.size;
    const densityDescriptor = this.plugin
      .getPopulationAPI()
      .getDescriptorForPopulation(populationDensity, this.country.geography.units);
    const lifeExpectancy = this.country.demographics.lifeExpectancy;
    const growthRate = this.country.demographics.populationGrowthRate;
    const netGrowthPerYear = this.population * (growthRate / 100);
    const deathsPerYear = this.population / lifeExpectancy;
    const birthsPerYear = netGrowthPerYear + deathsPerYear;

    let populationTable = this.formatRow(["Population", "-"]);
    populationTable = this.formatRow(["---", "---"]);

    populationTable += this.formatRow(["Population", this.formatNumber(this.population)]);
    populationTable += this.formatRow([
      "Population Density",
      this.formatNumber(populationDensity) + `(${densityDescriptor})`,
    ]);
    populationTable += this.formatRow(["Life Expectancy", this.formatNumber(this.country.demographics.lifeExpectancy)]);
    populationTable += this.formatRow(["Births/year", this.formatNumber(birthsPerYear)]);
    populationTable += this.formatRow(["Deaths/year", this.formatNumber(deathsPerYear)]);
    populationTable += this.formatRow(["Net/year", this.formatNumber(netGrowthPerYear)]);
    populationTable += this.formatRow(["Growth %", this.formatNumber(growthRate) + "%"]);

    return populationTable;
  }

  private generateSpeciesTable() {
    let speciesTable = this.formatRow(["Species", "Population"]);
    for (const species of this.country.species) {
      speciesTable += this.formatRow([species.name, this.formatNumber(species.populationPercentage * this.population)]);
    }
    return speciesTable;
  }

  private generateLanguageTable() {
    let languageTable = this.formatRow(["Language", "Speakers"]);
    for (const Language of this.country.languages) {
      languageTable += this.formatRow([
        Language.name,
        this.formatNumber(Language.populationPercentage * this.population),
      ]);
    }
    return languageTable;
  }

  private generateTerritoryTable() {
    let territoryTable = this.formatRow(["Territory", "Count", "Average Size", "Average Population"]);
    territoryTable += this.formatRow(["---", "---", "---", "---"]);
    for (const territoryType of this.country.geography.territoryTypes) {
      let averagePopulation = 0;
      let averageSize = 0;
      let territoryCount = 0;
      switch (territoryType.generationMethod) {
        case "Size":
          averageSize = territoryType.averageSize;
          territoryCount = this.country.geography.size / territoryType.averageSize;
          averagePopulation = this.population / territoryCount;
          break;
        case "Population":
          averagePopulation = territoryType.averagePopulation;
          territoryCount = this.population / territoryType.averagePopulation;
          averageSize = this.country.geography.size / territoryCount;
          break;
        default:
          logger(this, LogLevel.Error, "Unknown territory generation method: " + territoryType.generationMethod);
          return "";
      }
      territoryTable += this.formatRow([
        territoryType.type,
        territoryCount,
        this.formatNumber(averageSize, this.country.geography.units),
        this.formatNumber(averagePopulation),
      ]);
    }
    return territoryTable;
  }

  private generateSettlementTable() {
    let settlementTable = this.formatRow(["Settlement Type", "Count", "Total Population", "Average Population"]);
    settlementTable += this.formatRow(["---", "---", "---", "---"]);
    for (const settlement of this.country.geography.settlementTypes) {
      const settlementData = this.plugin.getSettlementAPI().findSettlementDataByType(settlement.type);
      if (settlementData === undefined) {
        logger(this, LogLevel.Error, "Could not find settlement data for type: " + settlement.type);
        continue;
      }
      const settlementTotalPopulation = this.population * settlement.populationPercentage;
      // Do this to coerce to integer numbers of settlements.
      let averagePopulation = (settlementData.minPopulation + settlementData.maxPopulation) / 2;
      const settlementCount = Math.round(settlementTotalPopulation / averagePopulation);
      averagePopulation = settlementTotalPopulation / settlementCount;

      settlementTable += this.formatRow([
        settlement.type,
        this.formatNumber(settlementCount),
        this.formatNumber(settlementTotalPopulation),
        this.formatNumber(averagePopulation),
      ]);
    }
    return settlementTable;
  }
}
