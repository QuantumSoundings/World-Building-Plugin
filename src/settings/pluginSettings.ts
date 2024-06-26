import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class WorldBuildingPluginSettings {
  // Paths
  configsPath: string = "";
  datasetsPath: string = "";

  // CSV Settings
  csvHeadersPresent: boolean = true;

  // Map Settings
  processMapsOnLoad: boolean = false;
}

export class WorldBuildingSettingTab extends PluginSettingTab {
  plugin: WorldBuildingPlugin;

  // Internal Data Settings
  configsPathSetting: Setting;
  datasetsPathSetting: Setting;

  // CSV Settings
  csvHeadersPresentSetting: Setting;

  // Map Settings
  processMapsOnLoadSetting: Setting;

  constructor(app: App, plugin: WorldBuildingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Path Settings
    {
      this.configsPathSetting = new Setting(containerEl)
        .setName("Config Path")
        .setDesc("Where the plugin config files will be exported.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the config path")
            .setValue(this.plugin.settings.configsPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.configsPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.datasetsPathSetting = new Setting(containerEl)
        .setName("Datasets Path")
        .setDesc("Where the datasets will be exported.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the datasets path")
            .setValue(this.plugin.settings.datasetsPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.datasetsPath = value;
              await this.plugin.saveSettings();
            });
        });
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
