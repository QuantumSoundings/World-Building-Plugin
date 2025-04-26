import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class WorldBuildingPluginSettings {
  // Paths
  configFilesPath: string = "";
  datasetFilesPath: string = "";
  generatedFilesPath: string = "";
  noteFilesPath: string = "";
  mapFilesPath: string = "";

  // CSV Settings
  csvHeadersPresent: boolean = true;

  // Map Settings
  processMapsOnLoad: boolean = false;

  // Current Date
  currentDate: string = "";
}

export class WorldBuildingSettingTab extends PluginSettingTab {
  plugin: WorldBuildingPlugin;

  // Internal Data Settings
  configFilesPathSetting: Setting;
  datasetFilesPathSetting: Setting;
  generatedFilesPathSetting: Setting;
  noteFilesPathSetting: Setting;
  mapFilesPathSetting: Setting;

  // CSV Settings
  csvHeadersPresentSetting: Setting;

  // Map Settings
  processMapsOnLoadSetting: Setting;

  // Current Date
  currentDate: string;

  constructor(app: App, plugin: WorldBuildingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Path Settings
    {
      this.configFilesPathSetting = new Setting(containerEl)
        .setName("Config Files Path")
        .setDesc(
          "Path to the config files for the plugin. The export command places the default files in this directory. These files will override the built in ones."
        )
        .addText((text) => {
          text
            .setPlaceholder("Enter the config files path")
            .setValue(this.plugin.settings.configFilesPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.configFilesPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.datasetFilesPathSetting = new Setting(containerEl)
        .setName("Dataset Files Path")
        .setDesc(
          "Path to the dataset files for the plugin. The export command places the default files in this directory. These files will override the built in ones."
        )
        .addText((text) => {
          text
            .setPlaceholder("Enter the datasets files path")
            .setValue(this.plugin.settings.datasetFilesPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.datasetFilesPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.generatedFilesPathSetting = new Setting(containerEl)
        .setName("Generated Files Path")
        .setDesc("Path specifying where the generated files should be placed.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the generated files path")
            .setValue(this.plugin.settings.generatedFilesPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.generatedFilesPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.noteFilesPathSetting = new Setting(containerEl)
        .setName("Note Files Path")
        .setDesc(
          "Path specifying where to scan for world building notes. Obsidian notes in other locations will not be scanned."
        )
        .addText((text) => {
          text
            .setPlaceholder("Enter the note files path")
            .setValue(this.plugin.settings.noteFilesPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.noteFilesPath = value;
              await this.plugin.saveSettings();
            });
        });

      this.mapFilesPathSetting = new Setting(containerEl)
        .setName("Map Files Path")
        .setDesc("Path specifying where to scan for map files. Files in other locations will not be scanned.")
        .addText((text) => {
          text
            .setPlaceholder("Enter the note files path")
            .setValue(this.plugin.settings.mapFilesPath)
            .onChange(async (value) => {
              value = normalizePath(value);
              this.plugin.settings.mapFilesPath = value;
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

    // Current Date Settings
    {
      this.csvHeadersPresentSetting = new Setting(containerEl)
        .setName("Current Date for World")
        .setDesc(
          "All time calculations will be relative to this date if applicable. This is used for calculating ages, time differences, etc."
        )
        .addText((text) => {
          text
            .setPlaceholder("Enter the current date: YYYY-MM-DD")
            .setValue(this.plugin.settings.currentDate)
            .onChange(async (value) => {
              this.plugin.settings.currentDate = value;
              await this.plugin.saveSettings();
            });
        });
    }
  }
}
