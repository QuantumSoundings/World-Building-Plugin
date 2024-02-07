import "reflect-metadata";
import { App, FileSystemAdapter, Plugin, PluginSettingTab, Setting, TAbstractFile } from "obsidian";
import { CSVManager } from "./dataManagers/csvManager";
import { SettlementAPI } from "./api/settlementApi";
import { PopulationAPI } from "./api/populationApi";
import { UnitConversionAPI } from "./api/unitConversionApi";
import { YAMLManager } from "./dataManagers/yamlManager";
import { PSDManager } from "./dataManagers/psdManager";
import { CSVView } from "./views/csvView";
import { TableComponent } from "./views/tableComponent";
import { Logger } from "./util";
import { SovereignEntity } from "./world/sovereignEntity";

class WorldBuildingPluginSettings {
  dataDirectory: string;
  settlementData: string;
  populationDensityData: string;
  unitConversionData: string;
  cacheFilesOnLoad: boolean;
  defaultCsvHeadersPresent: boolean;
  writeMapStatisticsOnLoad: boolean;
}

const DEFAULT_SETTINGS: WorldBuildingPluginSettings = {
  dataDirectory: "",
  settlementData: "",
  populationDensityData: "",
  unitConversionData: "",
  cacheFilesOnLoad: true,
  defaultCsvHeadersPresent: true,
  writeMapStatisticsOnLoad: false,
};

export default class WorldBuildingPlugin extends Plugin {
  settings: WorldBuildingPluginSettings;
  adapter: FileSystemAdapter;
  // Data Managers
  csvManager: CSVManager;
  yamlManager: YAMLManager;
  psdManager: PSDManager;
  // APIs provided to other plugins
  private settlementAPI: SettlementAPI;
  private populationAPI: PopulationAPI;
  private unitConversionAPI: UnitConversionAPI;

  async onload() {
    super.onload();
    // Load settings and make them available to downstream configuration.
    await this.loadSettings();
    this.addSettingTab(new WorldBuildingSettingTab(this.app, this));

    // Initialize all the members of the plugin
    this.adapter = this.app.vault.adapter as FileSystemAdapter;
    this.csvManager = new CSVManager(this);
    this.yamlManager = new YAMLManager(this);
    this.psdManager = new PSDManager(this);

    this.settlementAPI = new SettlementAPI(this);
    this.populationAPI = new PopulationAPI(this);
    this.unitConversionAPI = new UnitConversionAPI(this);

    if (this.app.workspace.layoutReady) {
      await this.indexVault();
    } else {
      this.app.workspace.onLayoutReady(async () => this.indexVault());
    }

    this.addCommand({
      id: "save-default-data-to-data-directory",
      name: "Save Default Data to Data Directory",
      checkCallback: (checking: boolean) => {
        // COnly show this command if the data directory is set.
        if (this.settings.dataDirectory !== "") {
          // Checking is true when the command is being registered, and false when it is being called.
          if (!checking) {
            this.writeDefaultDataToDataDirectory();
          }
          return true;
        } else {
          return false;
        }
      },
    });

    this.addCommand({
      id: "save-calculated-map-data",
      name: "Save Map Data to Config Files",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.psdManager.writeMapConfigData();
        }
        return true;
      },
    });

    // Setup the csv viewer
    this.registerView("csv", (leaf) => {
      return new CSVView(leaf, this);
    });
    this.registerExtensions(["csv"], "csv");
    this.registerCodeBlockProcessor();
    this.registerEventHandlers();

    // Finished!
    Logger.debug(this, "WorldBuilding plugin loaded.");
    // Dump the state of the plugin.
    Logger.debug(this, this);
  }

  onunload() {
    Logger.debug(this, "Unloading plugin: WorldBuilding");
    super.unload();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async indexVault() {
    // Do any loading operations that need awaits.
    const promises = [];
    promises.push(this.csvManager.load());
    promises.push(this.yamlManager.load());
    promises.push(this.psdManager.load());

    await Promise.allSettled(promises);
    this.psdManager.processPSDs().then(() => {
      this.refreshAPIs();
    });
  }

  refreshAPIs() {
    this.settlementAPI.reloadData();
    this.populationAPI.reloadData();
    this.unitConversionAPI.reloadData();
  }

  getSettlementAPI(): SettlementAPI {
    return this.settlementAPI;
  }

  getPopulationAPI(): PopulationAPI {
    return this.populationAPI;
  }

  getUnitConversionAPI(): UnitConversionAPI {
    return this.unitConversionAPI;
  }

  writeDefaultDataToDataDirectory() {
    this.settlementAPI.saveDefaultData();
    this.populationAPI.saveDefaultData();
    this.unitConversionAPI.saveDefaultData();
  }

  private registerEventHandlers() {
    const creationEvent = (file: TAbstractFile) => {
      if (this.csvManager.isFileManageable(file)) {
        this.csvManager.onFileCreation(file);
      } else if (this.yamlManager.isFileManageable(file)) {
        this.yamlManager.onFileCreation(file);
      } else if (this.psdManager.isFileManageable(file)) {
        this.psdManager.onFileCreation(file);
      }
    };
    const deletionEvent = (file: TAbstractFile) => {
      if (this.csvManager.isFileManageable(file)) {
        this.csvManager.onFileDeletion(file);
      } else if (this.yamlManager.isFileManageable(file)) {
        this.yamlManager.onFileDeletion(file);
      } else if (this.psdManager.isFileManageable(file)) {
        this.psdManager.onFileDeletion(file);
      }
    };
    const renameEvent = (file: TAbstractFile, oldPath: string) => {
      if (this.csvManager.isFileManageable(file)) {
        this.csvManager.onFileRename(file, oldPath);
      } else if (this.yamlManager.isFileManageable(file)) {
        this.yamlManager.onFileRename(file, oldPath);
      } else if (this.psdManager.isFileManageable(file)) {
        this.psdManager.onFileRename(file, oldPath);
      }
    };
    const modifyEvent = async (file: TAbstractFile) => {
      if (this.csvManager.isFileManageable(file)) {
        await this.csvManager.onFileModify(file);
      } else if (this.psdManager.isFileManageable(file)) {
        await this.psdManager.onFileModify(file);
      }
    };

    this.registerEvent(this.app.vault.on("create", creationEvent));
    this.registerEvent(this.app.vault.on("delete", deletionEvent));
    this.registerEvent(this.app.vault.on("rename", renameEvent));
    this.registerEvent(this.app.vault.on("modify", modifyEvent));
  }

  private registerCodeBlockProcessor() {
    this.registerMarkdownCodeBlockProcessor("wb-csv", (source, el, context) => {
      // Source should be the full path + file name + extension.
      source = source.trim();
      const tableComponent = new TableComponent(el, this);
      tableComponent.loadDataFromSource(source);
      context.addChild(tableComponent);
    });

    this.registerMarkdownCodeBlockProcessor("wb-se", (source, el, context) => {
      source = source.trim();
      const country = new SovereignEntity(this, context.frontmatter);
      country.buildMarkdownView(el);
    });
  }
}

class WorldBuildingSettingTab extends PluginSettingTab {
  plugin: WorldBuildingPlugin;

  constructor(app: App, plugin: WorldBuildingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Data Directory")
      .setDesc(
        "The directory where CSV/YAML/MD(with frontmatter) data is stored.\n These files are loaded and cached on start."
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter the directory")
          .setValue(this.plugin.settings.dataDirectory)
          .onChange(async (value) => {
            this.plugin.settings.dataDirectory = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Settlement Data File")
      .setDesc("This file overrides the internal settlement data.")
      .addText((text) =>
        text
          .setPlaceholder("Enter the file name")
          .setValue(this.plugin.settings.settlementData)
          .onChange(async (value) => {
            this.plugin.settings.settlementData = value;
            await this.plugin.saveSettings();
            this.plugin.refreshAPIs();
          })
      );

    new Setting(containerEl)
      .setName("Population Density Data File")
      .setDesc("This file overrides the internal population density data.")
      .addText((text) =>
        text
          .setPlaceholder("Enter the file name")
          .setValue(this.plugin.settings.populationDensityData)
          .onChange(async (value) => {
            this.plugin.settings.populationDensityData = value;
            await this.plugin.saveSettings();
            this.plugin.refreshAPIs();
          })
      );

    new Setting(containerEl)
      .setName("Unit Conversion Data File")
      .setDesc("This file overrides the internal unit conversion data.")
      .addText((text) =>
        text
          .setPlaceholder("Enter the file name")
          .setValue(this.plugin.settings.unitConversionData)
          .onChange(async (value) => {
            this.plugin.settings.unitConversionData = value;
            await this.plugin.saveSettings();
            this.plugin.refreshAPIs();
          })
      );
  }
}
