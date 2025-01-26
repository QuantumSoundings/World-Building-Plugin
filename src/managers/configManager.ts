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
import { TAbstractFile, TFile } from "obsidian";
import { parse } from "csv-parse/sync";
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
    const path = this.plugin.settings.configsPath;
    void CSVUtils.writeCSVByPath(
      `${path}/${MAP_CONFIG}`,
      CSVUtils.csvParse(mapConfigString, false),
      this.plugin.app.vault
    );
    void CSVUtils.writeCSVByPath(
      `${path}/${POINTS_OF_INTEREST_CONFIG}`,
      CSVUtils.csvParse(pointsOfInterestConfigString, false),
      this.plugin.app.vault
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

  private async loadCSVConfig<T>(info: ConfigInfo<T>) {
    const filePath = `${this.plugin.settings.configsPath}/${info.configName}`;
    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (file !== null && file instanceof TFile) {
      const content = await this.plugin.app.vault.read(file);
      const parsed = parse(content) as unknown[][];
      parsed.shift();
      const stringArray = CSVUtils.csvArrayToStringArray(parsed);
      info.values.push(...stringArray.map(info.converter));
    }
  }

  private async loadGeneratedCSVConfig<T>(info: ConfigInfo<T>, overrideFileName?: string) {
    let fileName = info.configName;
    if (overrideFileName !== undefined) {
      fileName = overrideFileName;
    }
    const filePath = `${this.plugin.settings.generatedFilesPath}/${fileName}`;
    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (file !== null && file instanceof TFile) {
      const content = await this.plugin.app.vault.read(file);
      const parsed = parse(content) as unknown[][];
      parsed.shift();
      const stringArray = CSVUtils.csvArrayToStringArray(parsed);
      info.values.push(...stringArray.map(info.converter));
    }
  }
}
