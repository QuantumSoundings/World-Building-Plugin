import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "src/world/sovereignEntity";
import { WorldEngineEntity } from "src/world/worldEngine";
import { generateSovereignEntityView } from "./generators/sovereignEntityView";
import { SettlementEntity } from "src/world/settlementEntity";
import { generateSettlementEntityView } from "./generators/settlementEntityView";

export const WORLD_ENGINE_VIEW = "world-engine-view";

const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";
const ENTITY = "Entity: ";
const NO_ENTITY = ENTITY + "No entity shown";

export class WorldEngineView extends ItemView {
  plugin: WorldBuildingPlugin;

  viewContainerElement: HTMLElement;

  headerContainerEl: HTMLElement;
  titleEl: HTMLElement;
  statusEl: HTMLElement;
  entityTitleEl: HTMLElement;
  entityLinkEl: HTMLElement;

  contentContainerEl: HTMLElement;

  paused: boolean;

  // Entity
  currentEntity: WorldEngineEntity | undefined;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    this.paused = false;

    const container = this.containerEl.children[1];
    container.empty();
    // Overall container for the view.
    this.viewContainerElement = container.createEl("div");
    this.viewContainerElement.setCssProps({ "webkit-user-select": "text", "user-select": "text" });
    // Header container.
    this.headerContainerEl = this.viewContainerElement.createEl("div");
    this.titleEl = this.headerContainerEl.createEl("h1", { text: "World Engine" });
    this.statusEl = this.headerContainerEl.createEl("h2", { text: RUNNING });
    this.entityTitleEl = this.headerContainerEl.createEl("h2", { text: NO_ENTITY });
    this.entityLinkEl = this.addAction("globe", "Open Entity Note", () => {
      if (this.currentEntity === undefined) return;
      const file = this.plugin.app.vault.getAbstractFileByPath(this.currentEntity.filePath);
      if (file !== null && file instanceof TFile) {
        const middleLeaf = this.plugin.app.workspace.getLeaf(true);
        middleLeaf.openFile(file, { active: true, state: { mode: "source" } });
      }
    });
    this.headerContainerEl.appendChild(this.entityLinkEl);

    // Content container.
    this.contentContainerEl = this.viewContainerElement.createEl("div");
  }

  public override getViewType() {
    return WORLD_ENGINE_VIEW;
  }

  public override getDisplayText() {
    return "World Engine";
  }

  public override async onOpen() {}
  public override async onClose() {}

  public override getIcon(): string {
    return "globe";
  }

  public async displayEntity(entity: WorldEngineEntity) {
    if (this.paused) {
      // View is paused.
      return;
    }
    this.contentContainerEl.empty();
    this.entityTitleEl.setText(ENTITY + entity.configuration.name);

    if (entity instanceof SovereignEntity) {
      generateSovereignEntityView(entity, this.contentContainerEl);
    } else if (entity instanceof SettlementEntity) {
      generateSettlementEntityView(entity, this.contentContainerEl);
    }

    this.currentEntity = entity;
    const spacer = this.contentContainerEl.createEl("div");
    spacer.setCssStyles({ marginBottom: "25px" });
  }

  public reloadEntity() {
    if (this.currentEntity !== undefined) {
      this.displayEntity(this.currentEntity);
    }
  }

  public getCurrentEntity() {
    return this.currentEntity;
  }

  public setPaused() {
    this.statusEl.setText(PAUSED);
    this.paused = true;
  }
  public setRunning() {
    this.statusEl.setText(RUNNING);
    this.paused = false;
  }
}
