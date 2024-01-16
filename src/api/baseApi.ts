import { plainToClass } from "class-transformer";
import { CacheManagerInterface } from "src/dataManagers/cacheManager";
import WorldBuildingPlugin from "src/main";
import { LogLevel, logger } from "src/util";

// WIP
export class BaseAPI<DataType> {
  plugin: WorldBuildingPlugin;
  dataManager: CacheManagerInterface;
  defaultDataString: string;
  data: DataType[];

  constructor(plugin: WorldBuildingPlugin, dataManager: CacheManagerInterface, serializedDefaultData: string) {
    this.plugin = plugin;
    this.dataManager = dataManager;
    this.data = [];
  }

  formatIncomingData(data: any) {
    return data;
  }

  reloadData() {
    let newData = JSON.parse(this.defaultDataString);
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.populationDensityData !== "") {
      const overrideDataPath = this.plugin.settings.dataDirectory + "/" + this.plugin.settings.populationDensityData;
      const overrideData = this.dataManager.getDataByFile(overrideDataPath);
      if (overrideData === undefined) {
        logger(this, LogLevel.Error, "Could not load override data.");
        return;
      }
      newData = this.formatIncomingData(newData);
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.data = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(DataType, newDataEntry);
      this.data.push(newDataClassInstance);
    }
  }
}
