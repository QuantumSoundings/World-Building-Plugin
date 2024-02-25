import "reflect-metadata";
import { FileSystemAdapter, Notice, Plugin, TAbstractFile } from "obsidian";
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
import { WorldBuildingPluginSettings, WorldBuildingSettingTab } from "./settings/pluginSettings";

export default class WorldBuildingPlugin extends Plugin {
  settings: WorldBuildingPluginSettings;
  settingsTab: WorldBuildingSettingTab;
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
    this.settingsTab = new WorldBuildingSettingTab(this.app, this);
    this.addSettingTab(this.settingsTab);

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
          new Notice("Default data has been saved to the root directory!", 2000);
        }
        return true;
      },
    });

    this.addCommand({
      id: "wb-process-and-save-map-data",
      name: "Process and Save Map Data to Markdown Files",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.psdManager.processPSDs(true).then(() => {
            this.psdManager.writeAllProcessedMapData();
            new Notice("Maps have been processed and saved!", 2000);
          });
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
            const onChoose = async (template: string) => {
              await this.frontMatterManager.writeFrontMatterTemplate(activeFile.path, template);
              new Notice("FrontMatter template has been set!", 2000);
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
    const settings = new WorldBuildingPluginSettings();
    this.settings = Object.assign({}, settings, await this.loadData());
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

    // The psd files require csv files for the map config,
    // and the processing is intensive, so we will do it only if the user wants it.
    if (this.settings.processMapsOnLoad) {
      await this.psdManager.processPSDs(false);
    }
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
