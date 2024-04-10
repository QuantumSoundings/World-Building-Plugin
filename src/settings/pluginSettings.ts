import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class WorldBuildingPluginSettings {
  // Internal Data Settings
  exportPath: string = "";
  settlementTypeDataOverridePath: string = "";
  populationDensityDataOverridePath: string = "";
  unitConversionDataOverridePath: string = "";

  // CSV Settings
  csvHeadersPresent: boolean = true;

  // Map Settings
  mapConfigPath: string = "";
  processMapsOnLoad: boolean = false;
}

export class WorldBuildingSettingTab extends PluginSettingTab {
  plugin: WorldBuildingPlugin;

  // Internal Data Settings
  exportPathSetting: Setting;
  settlementOverrideSetting: Setting;
  populationDensityOverrideSetting: Setting;
  unitConversionOverrideSetting: Setting;

  // CSV Settings
  csvHeadersPresentSetting: Setting;

  // Map Settings
  mapConfigPathSetting: Setting;
  processMapsOnLoadSetting: Setting;

  constructor(app: App, plugin: WorldBuildingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Internal Data Settings
    {
      this.exportPathSetting = new Setting(containerEl)
        .setName("Export Path")
        .setDesc("Where the default data files will be exported.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the export path")
            .setValue(this.plugin.settings.exportPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.exportPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.settlementOverrideSetting = new Setting(containerEl)
        .setName("Settlement Data Override File Path")
        .setDesc(
          "This file overrides the internal settlement data. It is recommended to first export the default data to the root directory and then modify it."
        )
        .addText((text) =>
          text
            .setPlaceholder("Enter the file name")
            .setValue(this.plugin.settings.settlementTypeDataOverridePath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.settlementTypeDataOverridePath = value;
              await this.plugin.saveSettings();
              await this.plugin.dataManager.reloadData();
            })
        );

      this.populationDensityOverrideSetting = new Setting(containerEl)
        .setName("Population Density Data File")
        .setDesc(
          "This file overrides the internal population density data. It is recommended to first export the default data to the root directory and then modify it."
        )
        .addText((text) =>
          text
            .setPlaceholder("Enter the file name")
            .setValue(this.plugin.settings.populationDensityDataOverridePath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.populationDensityDataOverridePath = value;
              await this.plugin.saveSettings();
              await this.plugin.dataManager.reloadData();
            })
        );

      this.unitConversionOverrideSetting = new Setting(containerEl)
        .setName("Unit Conversion Data File")
        .setDesc(
          "This file overrides the internal unit conversion data. It is recommended to first export the default data to the root directory and then modify it."
        )
        .addText((text) =>
          text
            .setPlaceholder("Enter the file name")
            .setValue(this.plugin.settings.unitConversionDataOverridePath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.unitConversionDataOverridePath = value;
              await this.plugin.saveSettings();
              await this.plugin.dataManager.reloadData();
            })
        );
    }

    // CSV Settings
    {
      this.csvHeadersPresentSetting = new Setting(containerEl)
        .setName("CSV Headers Present")
        .setDesc(
          "When enabled, a csv file will be assumed to have a header row. When disabled, the first row will be treated as data."
        )
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.settings.csvHeadersPresent).onChange(async (value) => {
            this.plugin.settings.csvHeadersPresent = value;
            await this.plugin.saveSettings();
          });
        });
    }

    // Map Settings
    {
      this.mapConfigPathSetting = new Setting(containerEl)
        .setName("Map Config Path")
        .setDesc("The path to the map config file. This must be a csv file.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the map config path")
            .setValue(this.plugin.settings.mapConfigPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.mapConfigPath = value;
              await this.plugin.saveSettings();
              await this.plugin.psdManager.updateConfig();
            });
        });

      this.processMapsOnLoadSetting = new Setting(containerEl)
        .setName("Force Process Maps on Discovery")
        .setDesc(
          "When enabled, psd files will have all processing done. When disabled, this processing will be done only as needed. This includes when no map data file is found, or when it is forced using the command."
        )
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.settings.processMapsOnLoad).onChange(async (value) => {
            this.plugin.settings.processMapsOnLoad = value;
            await this.plugin.saveSettings();
          });
        });
    }
  }
}
