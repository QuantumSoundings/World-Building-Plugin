import WorldBuildingPlugin from "src/main";
import { MapConfiguration, NationData, PointOfInterest } from "../types/dataTypes";
import {
  MAP_CONFIG,
  NATIONS_CONFIG_GENERATED,
  POINTS_OF_INTEREST_CONFIG,
  POI_CONFIG_GENERATED,
  mapConfigString,
  pointsOfInterestConfigString,
} from "../constants";
import { TAbstractFile } from "obsidian";
import { CSVUtils } from "src/util/csvUtils";

interface ConfigInfo<T> {
  configName: string;
  values: T[];
  converter: (data: any) => T;
}

interface Configs {
  mapConfigurations: ConfigInfo<MapConfiguration>;
  pointsOfInterest: ConfigInfo<PointOfInterest>;
  nations: ConfigInfo<NationData>;
}

export class ConfigManager {
  plugin: WorldBuildingPlugin;
  configs: Configs = {
    mapConfigurations: {
      configName: MAP_CONFIG,
      values: [],
      converter: (data: string[] | MapConfiguration | null) => new MapConfiguration(data),
    },
    pointsOfInterest: {
      configName: POINTS_OF_INTEREST_CONFIG,
      values: [],
      converter: (data: string[] | PointOfInterest | null) => new PointOfInterest(data),
    },
    nations: {
      configName: NATIONS_CONFIG_GENERATED,
      values: [],
      converter: (data: string[] | NationData | null) => new NationData(data),
    },
  };

  geographyAreaUnit: string = "mile^2";
  landFertilityUnit: string = "mile^2";

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async reloadConfigs() {
    this.configs.mapConfigurations.values = [];
    this.configs.pointsOfInterest.values = [];
    this.configs.nations.values = [];
    await this.loadCSVConfig(this.configs.mapConfigurations);
    await this.loadCSVConfig(this.configs.pointsOfInterest);
    await this.loadGeneratedCSVConfig(this.configs.nations);
    await this.loadGeneratedCSVConfig(this.configs.pointsOfInterest, POI_CONFIG_GENERATED);
  }

  public exportBlankConfigs() {
    const path = this.plugin.settings.configFilesPath;
    void CSVUtils.stringifyAndWriteCSVByPath(
      `${path}/${MAP_CONFIG}`,
      CSVUtils.parseCSV(mapConfigString, false),
      this.plugin.app.vault,
    );
    void CSVUtils.stringifyAndWriteCSVByPath(
      `${path}/${POINTS_OF_INTEREST_CONFIG}`,
      CSVUtils.parseCSV(pointsOfInterestConfigString, false),
      this.plugin.app.vault,
    );
  }

  public registerEventCallbacks() {
    const modifyEvent = async (file: TAbstractFile) => {
      // Refresh Internal Override Data if it has changed.
      const path = file.path;
      const shouldReload =
        path.includes(this.configs.mapConfigurations.configName) ||
        path.includes(this.configs.pointsOfInterest.configName) ||
        path.includes(this.configs.nations.configName);
      if (shouldReload) {
        await this.reloadConfigs();
        await this.plugin.worldEngine.triggerUpdate();
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
  }

  public getPointsOfInterestByMap(mapName: string): PointOfInterest[] {
    return this.configs.pointsOfInterest.values.filter((poi) => poi.mapName === mapName);
  }

  public getMapConfiguration(): MapConfiguration[] {
    return this.configs.mapConfigurations.values;
  }

  private async loadCSVConfig<T>(info: ConfigInfo<T>) {
    const filePath = `${this.plugin.settings.configFilesPath}/${info.configName}`;
    const parsed = await CSVUtils.readAndParseCSVByPath(filePath, this.plugin.app.vault, true);
    info.values.push(...parsed.map(info.converter));
  }

  private async loadGeneratedCSVConfig<T>(info: ConfigInfo<T>, overrideFileName?: string) {
    let fileName = info.configName;
    if (overrideFileName !== undefined) {
      fileName = overrideFileName;
    }
    const filePath = `${this.plugin.settings.generatedFilesPath}/${fileName}`;
    const parsed = await CSVUtils.readAndParseCSVByPath(filePath, this.plugin.app.vault, true);
    info.values.push(...parsed.map(info.converter));
  }
}
