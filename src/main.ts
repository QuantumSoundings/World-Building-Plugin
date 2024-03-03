import { Notice, Plugin, TAbstractFile, TFolder } from "obsidian";
import { SettlementAPI } from "./api/settlementApi";
import { PopulationAPI } from "./api/populationApi";
import { PSDManager } from "./dataManagers/psdManager";
import { CSVView } from "./views/csvView";
import { TableComponent } from "./views/tableComponent";
import { Logger } from "./util/Logger";
import { TemplatePickerModal } from "./modal/templatePickerModal";
import { sovereignEntityGeneratedStats } from "./postProcessors/sovereignEntityMDPP";
import { exportDefaultData } from "./defaultData";
import { WorldEngine } from "./world/worldEngine";
import { FrontMatterManager } from "./dataManagers/frontMatterManager";
import { SovereignEntity } from "./world/sovereignEntity";
import { WorldBuildingPluginSettings, WorldBuildingSettingTab } from "./settings/pluginSettings";
import { CSVUtils } from "./util/csv";
import { UserOverrideData } from "./dataManagers/userOverrideData";

export default class WorldBuildingPlugin extends Plugin {
  settings: WorldBuildingPluginSettings;
  settingsTab: WorldBuildingSettingTab;
  // Data Managers
  userOverrideData: UserOverrideData;
  psdManager: PSDManager;
  frontMatterManager: FrontMatterManager;
  // APIs provided to other plugins
  private settlementAPI: SettlementAPI;
  private populationAPI: PopulationAPI;

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
    this.userOverrideData = new UserOverrideData(this);
    await this.userOverrideData.reloadData();

    this.psdManager = new PSDManager(this);
    this.frontMatterManager = new FrontMatterManager(this);
    this.worldEngine = new WorldEngine(this);

    this.settlementAPI = new SettlementAPI(this);
    this.populationAPI = new PopulationAPI(this);

    await this.psdManager.initialize();

    // Load the world engine
    this.worldEngine.initialize();

    this.addCommand({
      id: "wb-export-default-data",
      name: "Export Default Data",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          exportDefaultData(this, this.settings.exportPath);
          new Notice("Default data has been saved to the export path!", 2000);
        }
        return true;
      },
    });

    this.addCommand({
      id: "wb-process-and-save-map-data",
      name: "Process and Save Map Data to Markdown Files",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.psdManager.reprocessAllMaps().then(() => {
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

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle("New CSV File")
              .setIcon("file-plus")
              .onClick(async () => {
                const title = "Untitled";
                const extension = ".csv";
                let count = 1;
                let newFileName = title + extension;
                while (this.app.vault.getAbstractFileByPath(file.path + "/" + newFileName) !== null) {
                  newFileName = title + ` (${count})` + extension;
                  count++;
                }
                const defaultContent = [
                  ["", "", "", "", ""],
                  ["", "", "", "", ""],
                  ["", "", "", "", ""],
                  ["", "", "", "", ""],
                  ["", "", "", "", ""],
                ];
                await CSVUtils.writeCSVByPath(file.path + "/" + newFileName, defaultContent, this.app.vault);
                new Notice("Created new CSV file! " + newFileName, 2000);
              });
          });
        }
      })
    );

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

  getSettlementAPI(): SettlementAPI {
    return this.settlementAPI;
  }

  getPopulationAPI(): PopulationAPI {
    return this.populationAPI;
  }

  private registerEventHandlers() {
    const deletionEvent = (file: TAbstractFile) => {
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileDeletion(file);
      }
    };
    const renameEvent = (file: TAbstractFile, oldPath: string) => {
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileRename(file, oldPath);
      }
    };
    const modifyEvent = async (file: TAbstractFile) => {
      // Refresh Internal Override Data if it has changed.
      if (
        file.path === this.settings.settlementTypeDataOverridePath ||
        file.path === this.settings.populationDensityDataOverridePath ||
        file.path === this.settings.unitConversionDataOverridePath
      ) {
        this.userOverrideData.reloadData();
      }
      if (file.path.endsWith(".md")) {
        this.worldEngine.onFileModify(file);
      }
    };

    this.registerEvent(this.app.vault.on("delete", deletionEvent));
    this.registerEvent(this.app.vault.on("rename", renameEvent));
    this.registerEvent(this.app.vault.on("modify", modifyEvent));

    this.psdManager.registerEventCallbacks();
  }

  private registerCodeBlockProcessor() {
    this.registerMarkdownCodeBlockProcessor("wb-csv", (source, el, context) => {
      // Source should be the full path + file name + extension.
      source = source.trim();
      const tableComponent = new TableComponent(el, this);
      tableComponent.setSourcePath(source);
      context.addChild(tableComponent);
    });

    this.registerMarkdownCodeBlockProcessor("wb-se", (source, el, context) => {
      const sovereignEntity = this.worldEngine.getEntity(context.sourcePath);
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
