import WorldBuildingPlugin from "src/main";
import { MapConfiguration, PointOfInterest } from "../dataTypes";
import { MAP_CONFIG, POINTS_OF_INTEREST_CONFIG, mapConfigString, pointsOfInterestConfigString } from "../../constants";
import { TAbstractFile, TFile } from "obsidian";
import { parse } from "csv-parse/sync";
import { CSVUtils } from "src/util/csv";

interface ConfigInfo<T> {
  configName: string;
  values: T[];
  converter: (data: any) => T;
}

interface Configs {
  mapConfigurations: ConfigInfo<MapConfiguration>;
  pointsOfInterest: ConfigInfo<PointOfInterest>;
}

export class ConfigManager {
  plugin: WorldBuildingPlugin;
  configs: Configs = {
    mapConfigurations: {
      configName: MAP_CONFIG,
      values: [],
      converter: (data: any) => new MapConfiguration(data),
    },
    pointsOfInterest: {
      configName: POINTS_OF_INTEREST_CONFIG,
      values: [],
      converter: (data: any) => new PointOfInterest(data),
    },
  };
  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async reloadConfigs() {
    await this.loadCSVConfig(this.configs.mapConfigurations);
    await this.loadCSVConfig(this.configs.pointsOfInterest);
  }

  public exportBlankConfigs() {
    const path = this.plugin.settings.configsPath;
    CSVUtils.writeCSVByPath(`${path}/${MAP_CONFIG}`, CSVUtils.csvParse(mapConfigString, false), this.plugin.app.vault);
    CSVUtils.writeCSVByPath(
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
        path.includes(this.configs.pointsOfInterest.configName);
      if (shouldReload) {
        await this.reloadConfigs();
        this.plugin.worldEngine.triggerUpdate();
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
  }

  private async loadCSVConfig<T>(info: ConfigInfo<T>) {
    const filePath = `${this.plugin.settings.configsPath}/${info.configName}`;
    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (file !== null && file instanceof TFile) {
      const content = await this.plugin.app.vault.read(file as TFile);
      const parsed = parse(content);
      parsed.shift();
      const stringArray = CSVUtils.csvArrayToStringArray(parsed);
      info.values = stringArray.map(info.converter);
    }
  }
}
