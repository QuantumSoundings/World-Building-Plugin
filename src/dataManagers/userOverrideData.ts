import { Type, plainToClass } from "class-transformer";
import { defaultPopulationDensityData, defaultSettlementData, defaultUnitConversionData } from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { CSVUtils } from "src/util/csv";

export class PopulationDensity {
  descriptor: string;
  @Type(() => Number)
  minPopulation: number;
  @Type(() => Number)
  maxPopulation: number;
  areaUnit: string;
}

export class SettlementType {
  type: string;
  description: string;
  distributionType: string;
  @Type(() => Number)
  minPopulation: number;
  @Type(() => Number)
  maxPopulation: number;
}

export class ConversionFactor {
  toUnit: string;
  @Type(() => Number)
  factor: number;
}

export class Unit {
  name: string;
  symbol: string;

  @Type(() => ConversionFactor)
  conversionFactors: ConversionFactor[];
}

export class UserOverrideData {
  plugin: WorldBuildingPlugin;
  unitData: Unit[] = [];
  populationData: PopulationDensity[] = [];
  settlementData: SettlementType[] = [];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async reloadData() {
    await this.loadUnitData();
    await this.loadPopulationDensityData();
    await this.loadSettlementTypeData();
  }

  private async loadUnitData() {
    let newData = JSON.parse(JSON.stringify(defaultUnitConversionData));
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.unitConversionDataOverridePath !== "") {
      const fm = await this.plugin.frontMatterManager.getFrontMatter(
        this.plugin.settings.unitConversionDataOverridePath
      );
      if (fm.hasOwnProperty("units")) {
        newData = fm["units"];
      }
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.unitData = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(Unit, newDataEntry);
      this.unitData.push(newDataClassInstance);
    }
  }

  private async loadPopulationDensityData() {
    let newData = JSON.parse(JSON.stringify(defaultPopulationDensityData));
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.populationDensityDataOverridePath !== "") {
      const overrideData = await CSVUtils.getCSVByPath(
        this.plugin.settings.populationDensityDataOverridePath,
        this.plugin.app.vault
      );
      newData = CSVUtils.csvToPojo(overrideData, true);
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.populationData = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(PopulationDensity, newDataEntry);
      this.populationData.push(newDataClassInstance);
    }
  }

  private async loadSettlementTypeData() {
    let newData = JSON.parse(JSON.stringify(defaultSettlementData));
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.settlementTypeDataOverridePath !== "") {
      const overrideData = await CSVUtils.getCSVByPath(
        this.plugin.settings.settlementTypeDataOverridePath,
        this.plugin.app.vault
      );
      newData = CSVUtils.csvToPojo(overrideData, true);
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.settlementData = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(SettlementType, newDataEntry);
      this.settlementData.push(newDataClassInstance);
    }
  }
}
