import { TAbstractFile } from "obsidian";
import {
  PopulationDensity,
  SettlementType,
  Unit,
  defaultFirstNameData,
  defaultLastNameData,
  defaultPopulationDensityData,
  defaultProfessionData,
  defaultSettlementData,
  defaultTravelMethods,
  defaultUnitConversionData,
} from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { CSVUtils } from "src/util/csv";

export class UserOverrideData {
  readonly defaultData = {
    firstNameData: defaultFirstNameData,
    lastNameData: defaultLastNameData,
    populationDensityData: defaultPopulationDensityData,
    professionData: defaultProfessionData,
    settlementTypeData: defaultSettlementData,
    travelMethods: defaultTravelMethods,
  };

  plugin: WorldBuildingPlugin;
  unitData: Unit[] = [];
  populationDensityData: PopulationDensity[] = [];
  settlementTypeData: SettlementType[] = [];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async reloadData() {
    await this.loadUnitData();
    await this.loadPopulationDensityData();
    await this.loadSettlementTypeData();
  }

  public registerEventCallbacks() {
    const modifyEvent = async (file: TAbstractFile) => {
      // Refresh Internal Override Data if it has changed.
      if (
        file.path === this.plugin.settings.settlementTypeDataOverridePath ||
        file.path === this.plugin.settings.populationDensityDataOverridePath ||
        file.path === this.plugin.settings.unitConversionDataOverridePath
      ) {
        this.reloadData();
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
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

    this.unitData = newData.map((data: any) => new Unit(data));
  }

  private async loadPopulationDensityData() {
    let newData: any = this.defaultData.populationDensityData;
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.populationDensityDataOverridePath !== "") {
      const overrideData = await CSVUtils.readCSVByPath(
        this.plugin.settings.populationDensityDataOverridePath,
        this.plugin.app.vault,
        false
      );
      newData = overrideData.length === 0 ? newData : overrideData;
    }

    this.populationDensityData = newData.map((data: any) => new PopulationDensity(data));
  }

  private async loadSettlementTypeData() {
    let newData: any = this.defaultData.settlementTypeData;
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.settlementTypeDataOverridePath !== "") {
      const overrideData = await CSVUtils.readCSVByPath(
        this.plugin.settings.settlementTypeDataOverridePath,
        this.plugin.app.vault,
        false
      );
      newData = overrideData.length === 0 ? newData : overrideData;
      this.settlementTypeData = newData.map((data: any) => new SettlementType(data));
    }

    this.settlementTypeData = newData.map((data: any) => new SettlementType(data));
  }
}
