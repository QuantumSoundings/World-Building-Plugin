import { HoverParent, HoverPopover, ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { generateSovereignEntityView } from "./generators/sovereignEntityView";
import { SettlementEntity } from "src/world/entities/settlementEntity";
import { generateSettlementEntityView } from "./generators/settlementEntityView";
import { WorldEngineEntity } from "src/world/entities/shared";
import { SovereignEntity } from "src/world/entities/sovereignEntity";
import { WORLD_ENGINE_HOVER_SOURCE, WORLD_ENGINE_VIEW } from "src/constants";

const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";
const NO_ENTITY = "No Entity Selected";

export class WorldEngineView extends ItemView implements HoverParent {
  plugin: WorldBuildingPlugin;
  hoverPopover: HoverPopover | null;

  viewContainerElement: HTMLElement;

  headerContainerEl: HTMLElement;
  titleEl: HTMLElement;
  statusEl: HTMLElement;
  entityTitleEl: HTMLElement;
  entityTitleLink: HTMLElement;

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
    this.entityTitleEl = this.headerContainerEl.createEl("h2");
    this.entityTitleLink = this.entityTitleEl.createEl("a", { text: NO_ENTITY });
    this.entityTitleLink.addEventListener("mouseover", (event: MouseEvent) => {
      if (this.currentEntity === undefined) return;
      this.plugin.app.workspace.trigger("hover-link", {
        event: event,
        source: WORLD_ENGINE_HOVER_SOURCE,
        hoverParent: this,
        targetEl: this.entityTitleLink,
        linktext: this.currentEntity.filePath,
      });
    });
    this.entityTitleLink.addEventListener("click", async () => {
      if (this.currentEntity === undefined) return;
      await this.plugin.app.workspace.openLinkText(this.currentEntity.filePath, "", true);
    });

    this.hoverPopover = new HoverPopover(this, this.entityTitleLink);

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
    this.entityTitleLink.setText(entity.configuration.name);

    if (entity instanceof SovereignEntity) {
      generateSovereignEntityView(entity, this.contentContainerEl);
    } else if (entity instanceof SettlementEntity) {
      generateSettlementEntityView(entity, this.contentContainerEl);
    }

    this.currentEntity = entity;

    // Add a spacer to the bottom of the view.
    const spacerEl = this.contentContainerEl.createEl("div");
    spacerEl.setCssStyles({ marginBottom: "25px" });
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
