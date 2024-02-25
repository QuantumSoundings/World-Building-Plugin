import { Type, plainToClass } from "class-transformer";
import { defaultSettlementData } from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { Utils, Logger } from "src/util";
import { CSVUtils } from "src/util/csv";

export class SettlementType {
  type: string;
  description: string;
  distributionType: string;
  @Type(() => Number)
  minPopulation: number;
  @Type(() => Number)
  maxPopulation: number;
}

export class Settlement {
  type: string;
  name: string;
  population: number;
}

export class SettlementAPI {
  plugin: WorldBuildingPlugin;
  defaultDataString: string;
  data: SettlementType[];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.defaultDataString = JSON.stringify(defaultSettlementData);
    this.data = [];
  }

  reloadData(overrideDataPath: string) {
    let newData = JSON.parse(this.defaultDataString);
    // If we are overriding the default data, load the new data from the manager.
    if (overrideDataPath !== "") {
      const overrideDataResult = this.plugin.csvManager.getDataByFile(overrideDataPath);
      if (overrideDataResult.success === true) {
        newData = CSVUtils.csvToPojo(overrideDataResult.result, true);
      }
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.data = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(SettlementType, newDataEntry);
      this.data.push(newDataClassInstance);
    }
  }

  findSettlementDataByType(type: string): SettlementType | undefined {
    return this.data.find((settlement) => settlement.type === type);
  }

  generateSettlement(type: string): Settlement | undefined {
    const settlementData = this.findSettlementDataByType(type);
    if (settlementData === undefined) {
      Logger.error(this, "Could not find settlement data for type: " + type);
      return undefined;
    }
    const settlement = new Settlement();
    settlement.type = settlementData.type;
    //settlement.name = this.generateName(settlementData);
    settlement.population = this.generatePopulation(settlementData);
    return settlement;
  }

  private generatePopulation(settlementData: SettlementType): number {
    switch (settlementData.distributionType) {
      case "gaussian":
        return Utils.generateGaussianValue(settlementData.minPopulation, settlementData.maxPopulation, 1.0);
      default:
        return NaN;
    }
  }
}
