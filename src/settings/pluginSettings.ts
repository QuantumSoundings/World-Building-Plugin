import { App, PluginSettingTab, Setting } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class WorldBuildingPluginSettings {
  // Overrides for the internal data files.
  exportPath: string = "";
  settlementTypeDataOverridePath: string = "";
  populationDensityDataOverridePath: string = "";
  unitConversionDataOverridePath: string = "";
  // Loading Behavior
  cacheFilesOnLoad: boolean = true;
  processMapsOnLoad: boolean = true;
  // CSV Behavior
  csvHeadersPresent: boolean = true;
}

export class WorldBuildingSettingTab extends PluginSettingTab {
  plugin: WorldBuildingPlugin;

  // String Settings
  settlementOverrideSetting: Setting;
  populationDensityOverrideSetting: Setting;
  unitConversionOverrideSetting: Setting;

  // Toggle Settings
  cacheFilesOnLoadSetting: Setting;
  processMapsOnLoadSetting: Setting;
  csvHeadersPresentSetting: Setting;

  constructor(app: App, plugin: WorldBuildingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

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
            this.plugin.settings.settlementTypeDataOverridePath = value;
            await this.plugin.saveSettings();
            await this.plugin.userOverrideData.reloadData();
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
            this.plugin.settings.populationDensityDataOverridePath = value;
            await this.plugin.saveSettings();
            await this.plugin.userOverrideData.reloadData();
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
            this.plugin.settings.unitConversionDataOverridePath = value;
            await this.plugin.saveSettings();
            await this.plugin.userOverrideData.reloadData();
          })
      );

    this.cacheFilesOnLoadSetting = new Setting(containerEl)
      .setName("Cache Files on Load")
      .setDesc(
        "When enabled, files will be cached on load. This can improve performance, but may cause issues with large files."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.cacheFilesOnLoad).onChange(async (value) => {
          this.plugin.settings.cacheFilesOnLoad = value;
          await this.plugin.saveSettings();
        });
      });

    this.processMapsOnLoadSetting = new Setting(containerEl)
      .setName("Process Maps on Load")
      .setDesc(
        "When enabled, psd files will be processed on load. This can be performance intensive, but only needs to be done once on load, or whenever the file is modified. The processing will be skipped if the file is unchanged since it was last processed."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.processMapsOnLoad).onChange(async (value) => {
          this.plugin.settings.processMapsOnLoad = value;
          await this.plugin.saveSettings();
        });
      });

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
}
