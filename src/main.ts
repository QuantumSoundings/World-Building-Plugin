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
import { TemplatePickerModal } from "./modal/templatePickerModal";
import { sovereignEntityGeneratedStats } from "./postProcessors/sovereignEntityMDPP";
import { exportDefaultData } from "./defaultData";
import { WorldEngine } from "./world/worldEngine";
import { FrontMatterManager } from "./dataManagers/frontMatterManager";
import { SovereignEntity } from "./world/sovereignEntity";

class WorldBuildingPluginSettings {
  // Overrides for the internal data files.
  exportPath: string;
  settlementTypeDataOverridePath: string;
  populationDensityDataOverridePath: string;
  unitConversionDataOverridePath: string;
  // Loading Behavior
  cacheFilesOnLoad: boolean;
  writeMapStatisticsOnLoad: boolean;
  // CSV Behavior
  defaultCsvHeadersPresent: boolean;
}

const DEFAULT_SETTINGS: WorldBuildingPluginSettings = {
  exportPath: "",
  settlementTypeDataOverridePath: "",
  populationDensityDataOverridePath: "",
  unitConversionDataOverridePath: "",
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
  frontMatterManager: FrontMatterManager;
  // APIs provided to other plugins
  private settlementAPI: SettlementAPI;
  private populationAPI: PopulationAPI;
  private unitConversionAPI: UnitConversionAPI;

  worldEngine: WorldEngine;

  async onload() {
    super.onload();
    // Wait for workspace to be ready before doing anything.
    this.app.workspace.onLayoutReady(async () => this.loadAfterWorkspaceReady());
  }

  async loadAfterWorkspaceReady() {
    // Load settings and make them available to downstream configuration.
    await this.loadSettings();
    this.addSettingTab(new WorldBuildingSettingTab(this.app, this));

    // Initialize all the members of the plugin
    this.adapter = this.app.vault.adapter as FileSystemAdapter;
    this.csvManager = new CSVManager(this);
    this.yamlManager = new YAMLManager(this);
    this.psdManager = new PSDManager(this);
    this.frontMatterManager = new FrontMatterManager(this);
    this.worldEngine = new WorldEngine(this);

    this.settlementAPI = new SettlementAPI(this);
    this.populationAPI = new PopulationAPI(this);
    this.unitConversionAPI = new UnitConversionAPI(this);

    // Load our caches.
    await this.indexVault();

    // Now we can do things that make use of the data.
    this.refreshAPIs();

    // Load the world engine
    this.worldEngine.initialize();

    this.addCommand({
      id: "wb-save-default-data-to-root",
      name: "Save Default Data to Root Directory",
      checkCallback: (checking: boolean) => {
        // Checking is true when the command is being registered, and false when it is being called.
        if (!checking) {
          this.writeDefaultDataToDataDirectory();
        }
        return true;
      },
    });

    this.addCommand({
      id: "wb-save-calculated-map-data",
      name: "Save Map Data to Config Files",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.psdManager.writeMapConfigData();
        }
        return true;
      },
    });

    this.addCommand({
      id: "wb-replace-frontmatter-template",
      name: "Set FrontMatter Template Picker",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile !== null) {
            const onChoose = (template: string) => {
              this.yamlManager.writeFrontMatterTemplate(activeFile.path, template);
            };
            new TemplatePickerModal(this.app, onChoose).open();
          }
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

    await Promise.allSettled(promises);

    // The psd files might require a lot of compute, and they have dependencies
    await this.psdManager.load();
    await this.psdManager.processPSDs();
  }

  async refreshAPIs() {
    this.settlementAPI.reloadData(this.settings.settlementTypeDataOverridePath);
    this.populationAPI.reloadData(this.settings.populationDensityDataOverridePath);
    await this.unitConversionAPI.reloadData(this.settings.unitConversionDataOverridePath);
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
    exportDefaultData(this, this.settings.exportPath);
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
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileDeletion(file);
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
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileRename(file, oldPath);
      }
    };
    const modifyEvent = async (file: TAbstractFile) => {
      if (this.csvManager.isFileManageable(file)) {
        await this.csvManager.onFileModify(file);
      } else if (this.psdManager.isFileManageable(file)) {
        await this.psdManager.onFileModify(file);
      }
      // Refresh Internal Override Data if it has changed.
      if (file.path === this.settings.settlementTypeDataOverridePath) {
        this.settlementAPI.reloadData(this.settings.settlementTypeDataOverridePath);
      }
      if (file.path === this.settings.populationDensityDataOverridePath) {
        this.populationAPI.reloadData(this.settings.populationDensityDataOverridePath);
      }
      if (file.path === this.settings.unitConversionDataOverridePath) {
        this.unitConversionAPI.reloadData(this.settings.unitConversionDataOverridePath);
      }
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileModify(file);
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
      const sovereignEntity = this.worldEngine.entities.get(context.sourcePath);
      if (sovereignEntity === undefined) {
        Logger.error(this, "Could not find sovereign entity for " + context.sourcePath);
        return;
      }
      if (sovereignEntity instanceof SovereignEntity) {
        sovereignEntityGeneratedStats(sovereignEntity, el);
      }
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
            await this.plugin.refreshAPIs();
          })
      );

    new Setting(containerEl)
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
            await this.plugin.refreshAPIs();
          })
      );

    new Setting(containerEl)
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
            await this.plugin.refreshAPIs();
          })
      );
  }
}
