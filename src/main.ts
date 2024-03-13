import { MarkdownView, Notice, Plugin, TFolder, WorkspaceLeaf } from "obsidian";
import { SettlementAPI } from "./api/settlementApi";
import { PopulationAPI } from "./api/populationApi";
import { PSDManager } from "./dataManagers/psdManager";
import { CSVView, CSV_VIEW } from "./views/csvView";
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
import { WORLD_ENGINE_VIEW, WorldEngineView } from "./views/worldEngineView";

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
  showWorldEngine: boolean;

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

    // Register everything with obsidian
    this.registerView(CSV_VIEW, (leaf) => {
      return new CSVView(leaf, this);
    });
    this.registerView(WORLD_ENGINE_VIEW, (leaf) => {
      return new WorldEngineView(leaf, this);
    });
    this.showWorldEngine = false;
    this.addRibbonIcon("dice", "Show World Engine", () => {
      this.showWorldEngine = !this.showWorldEngine;
    });
    this.registerExtensions(["csv"], "wb-csv");
    this.registerCommands();
    this.registerCodeBlockProcessors();
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

  async updateViews() {
    const worldEngineLeaves = this.app.workspace.getLeavesOfType(WORLD_ENGINE_VIEW);
    let worldEngineLeaf: WorkspaceLeaf | null = null;
    if (worldEngineLeaves.length > 0) {
      // A leaf with our view already exists, use that
      worldEngineLeaf = worldEngineLeaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      worldEngineLeaf = this.app.workspace.getRightLeaf(false);
      await worldEngineLeaf.setViewState({ type: WORLD_ENGINE_VIEW, active: false });
    }
    const currentFile = this.app.workspace.getActiveFile();
    if (currentFile !== null) {
      await (worldEngineLeaf.view as WorldEngineView).updateView(currentFile.path);
      // "Reveal" the leaf in case it is in a collapsed sidebar
      // Only reveal if the leaf has updated.
      if (this.showWorldEngine) {
        this.app.workspace.revealLeaf(worldEngineLeaf);
      }
    }
  }

  getSettlementAPI(): SettlementAPI {
    return this.settlementAPI;
  }

  getPopulationAPI(): PopulationAPI {
    return this.populationAPI;
  }

  private registerCommands() {
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
  }

  private registerEventHandlers() {
    this.userOverrideData.registerEventCallbacks();
    this.psdManager.registerEventCallbacks();
    this.worldEngine.registerEventCallbacks();

    this.app.workspace.on("active-leaf-change", (leaf) => {
      if (leaf === null || leaf.view.getViewType() === WORLD_ENGINE_VIEW) {
        return;
      }
      if (leaf.view instanceof MarkdownView) {
        const mdView = leaf.view as MarkdownView;
        const file = mdView.file;
        if (file !== null) {
          const entity = this.worldEngine.getEntity(file.path);
          if (entity !== undefined) {
            this.updateViews();
          }
        }
      }
    });

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

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle("Copy Path")
            .setIcon("file-plus")
            .onClick(async () => {
              navigator.clipboard.writeText(file.path);
            });
        });
      })
    );
  }

  private registerCodeBlockProcessors() {
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
