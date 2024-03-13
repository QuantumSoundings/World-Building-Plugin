import { ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { sovereignEntityGeneratedStats } from "src/postProcessors/sovereignEntityMDPP";
import { SovereignEntity } from "src/world/sovereignEntity";
import { WorldEngineEntity } from "src/world/worldEngine";

export const WORLD_ENGINE_VIEW = "world-engine-view";

const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";
const ENTITY = "Entity: ";
const NO_ENTITY = ENTITY + "No entity shown";

export class WorldEngineView extends ItemView {
  plugin: WorldBuildingPlugin;

  viewContainerElement: HTMLElement;
  titleElement: HTMLElement;
  statusElement: HTMLElement;
  entityShownElement: HTMLElement;
  entityContainerElement: HTMLElement;

  paused: boolean;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    this.paused = false;
    const container = this.containerEl.children[1];
    container.empty();
    this.viewContainerElement = container.createEl("div");
    this.titleElement = this.viewContainerElement.createEl("h1", { text: "World Engine" });
    this.statusElement = this.viewContainerElement.createEl("h2", { text: RUNNING });
    this.entityShownElement = this.viewContainerElement.createEl("h2", { text: NO_ENTITY });
    this.entityContainerElement = this.viewContainerElement.createEl("div");
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
    this.entityContainerElement.empty();
    if (entity instanceof SovereignEntity) {
      this.entityShownElement.setText(ENTITY + entity.configuration.name);
      sovereignEntityGeneratedStats(entity, this.entityContainerElement);
    }
  }

  public setPaused() {
    this.statusElement.setText(PAUSED);
    this.paused = true;
  }
  public setRunning() {
    this.statusElement.setText(RUNNING);
    this.paused = false;
  }
}
