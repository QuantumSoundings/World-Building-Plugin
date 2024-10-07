import { MarkdownView, Notice, Plugin, TFolder, WorkspaceLeaf } from "obsidian";
import { CSVView } from "./views/csvView";
import { TableComponent } from "./views/components/tableComponent";
import { Logger } from "./util/Logger";
import { TemplatePickerModal } from "./modal/templatePickerModal";
import { WorldEngine } from "./world/worldEngine";
import { FrontMatterManager } from "./managers/frontMatterManager";
import { WorldBuildingPluginSettings, WorldBuildingSettingTab } from "./settings/pluginSettings";
import { CSVUtils } from "./util/csvUtils";
import { DataManager } from "./managers/dataManager";
import { WorldEngineView } from "./views/worldEngineView";
import { ConfigManager } from "./managers/configManager";
import { CSV_HOVER_SOURCE, CSV_VIEW, WORLD_ENGINE_HOVER_SOURCE, WORLD_ENGINE_VIEW } from "./constants";
import { MapParser } from "./maps/mapParser";
import { NameGenerator } from "./generator/nameGenerator";
import { GenerateNamesModal } from "./modal/generateNamesModal";

export default class WorldBuildingPlugin extends Plugin {
  settings: WorldBuildingPluginSettings;
  settingsTab: WorldBuildingSettingTab;
  // Data Managers
  configManager: ConfigManager;
  dataManager: DataManager;
  frontMatterManager: FrontMatterManager;
  mapParser: MapParser;
  nameGenerator: NameGenerator;

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
    this.frontMatterManager = new FrontMatterManager(this);
    this.configManager = new ConfigManager(this);
    this.dataManager = new DataManager(this);
    this.worldEngine = new WorldEngine(this);
    this.mapParser = new MapParser(this);

    await this.configManager.reloadConfigs();
    await this.dataManager.reloadDatasets();
    this.nameGenerator = new NameGenerator(this);

    // Load the world engine
    await this.worldEngine.initialize();

    // Register everything with obsidian
    this.registerView(CSV_VIEW, (leaf) => {
      return new CSVView(leaf, this);
    });
    this.registerView(WORLD_ENGINE_VIEW, (leaf) => {
      return new WorldEngineView(leaf, this);
    });
    this.addRibbonIcons();
    this.createWorldEngineLeaf();
    this.registerExtensions(["csv"], CSV_VIEW);
    this.registerCommands();
    this.registerCodeBlockProcessors();
    this.registerEventHandlers();

    this.registerHoverLinkSource(CSV_HOVER_SOURCE, { display: "WB CSV View", defaultMod: false });
    this.registerHoverLinkSource(WORLD_ENGINE_HOVER_SOURCE, { display: "WB World Engine", defaultMod: false });

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

  private async createWorldEngineLeaf() {
    const worldEngineView = this.getWorldEngineLeaf();

    if (worldEngineView === undefined) {
      // View not found, create one on the right sidebar
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (rightLeaf === null) {
        Logger.error(this, "Failed to create World Engine view, cannot show view.");
        return;
      }
      await rightLeaf.setViewState({ type: WORLD_ENGINE_VIEW, active: false });
    } else {
      // View found, its possible this is a hot reload.
      Logger.warn(this, "World Engine view already exists, this is possibly a hot reload.");
    }
  }

  private getWorldEngineLeaf(): WorkspaceLeaf | undefined {
    const worldEngineLeaves = this.app.workspace.getLeavesOfType(WORLD_ENGINE_VIEW);
    if (worldEngineLeaves.length > 1) {
      Logger.warn(this, "Multiple world engine views found, something has gone wrong and requires investigation.");
      // We somehow ended up with multiple views. Delete all but the first one.
      for (let i = 1; i < worldEngineLeaves.length; i++) {
        worldEngineLeaves[i].detach();
      }

      return worldEngineLeaves[0];
    } else if (worldEngineLeaves.length === 1) {
      return worldEngineLeaves[0];
    } else {
      return undefined;
    }
  }

  public getWorldEngineView(): WorldEngineView | undefined {
    const worldEngineLeaf = this.getWorldEngineLeaf();
    if (worldEngineLeaf === undefined) {
      return undefined;
    }
    return worldEngineLeaf.view as WorldEngineView;
  }

  private addRibbonIcons() {
    this.addRibbonIcon("globe", "Show World Engine", async () => {
      let worldEngineLeaf = this.getWorldEngineLeaf();
      if (worldEngineLeaf === undefined) {
        Logger.warn(this, "World Engine view not found, creating a new one...");
        await this.createWorldEngineLeaf();
        worldEngineLeaf = this.getWorldEngineLeaf();
        if (worldEngineLeaf === undefined) {
          Logger.error(this, "Failed to create World Engine view, cannot show view.");
          return;
        }
      }
      this.app.workspace.revealLeaf(worldEngineLeaf);
    });
    this.addRibbonIcon("snowflake", "Toggle World Engine (Running/Paused)", () => {
      const worldEngineView = this.getWorldEngineView();
      if (worldEngineView === undefined) {
        Logger.error(this, "World Engine view not found, cannot show view.");
        return;
      }
      if (worldEngineView.paused) {
        worldEngineView.setRunning();
      } else {
        worldEngineView.setPaused();
      }
    });
  }

  private registerCommands() {
    this.addCommand({
      id: "wb-export-configs",
      name: "Export Configs",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.configManager.exportBlankConfigs();

          new Notice("Configs have been exported!", 2000);
          return true;
        } else {
          return this.settings.configsPath !== "";
        }
      },
    });

    this.addCommand({
      id: "wb-export-datasets",
      name: "Export Datasets",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.dataManager.exportDefaultData();

          new Notice("Datasets have been exported!", 2000);
          return true;
        } else {
          return this.settings.datasetsPath !== "";
        }
      },
    });

    this.addCommand({
      id: "wb-process-maps",
      name: "Process Maps",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.mapParser.parseAllMaps().then(() => {
            new Notice("Maps have been processed and saved!", 2000);
          });
        }
        return true;
      },
    });

    this.addCommand({
      id: "wb-open-template-picker",
      name: "Open Template Picker",
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

    this.addCommand({
      id: "wb-generate-names",
      name: "Generate Names",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          new GenerateNamesModal(this).open();
        }
        return true;
      },
    });
  }

  private registerEventHandlers() {
    this.configManager.registerEventCallbacks();
    this.dataManager.registerEventCallbacks();
    this.worldEngine.registerEventCallbacks();

    this.app.workspace.on("active-leaf-change", async (leaf) => {
      if (leaf === null) {
        return;
      }
      if (leaf.view instanceof MarkdownView) {
        const mdView = leaf.view as MarkdownView;
        const file = mdView.file;
        if (file !== null) {
          const note = this.worldEngine.getWBNoteByPath(file.path);
          if (note !== undefined) {
            const worldEngineView = this.getWorldEngineView();
            if (worldEngineView === undefined) {
              Logger.error(this, "World Engine view not found, cannot update views.");
              return;
            }
            await worldEngineView.displayWBNote(note);
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
  }
}
