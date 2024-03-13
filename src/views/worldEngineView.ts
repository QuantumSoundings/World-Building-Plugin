import { ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { sovereignEntityGeneratedStats } from "src/postProcessors/sovereignEntityMDPP";
import { SovereignEntity } from "src/world/sovereignEntity";

export const WORLD_ENGINE_VIEW = "world-engine-view";

export class WorldEngineView extends ItemView {
  plugin: WorldBuildingPlugin;

  viewElement: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    const container = this.containerEl.children[1];
    container.empty();
    this.viewElement = container.createEl("div");
  }

  override getViewType() {
    return WORLD_ENGINE_VIEW;
  }

  override getDisplayText() {
    return "World Engine";
  }

  override async onOpen() {}

  async updateView(fullPath: string) {
    this.viewElement.empty();
    this.viewElement.createEl("h1", { text: "World Engine" });
    const entity = this.plugin.worldEngine.getEntity(fullPath);
    if (entity instanceof SovereignEntity) {
      this.viewElement.createEl("h2", { text: entity.configuration.name });
      sovereignEntityGeneratedStats(entity, this.viewElement);
    }
  }

  override async onClose() {
    // Nothing to clean up.
  }
}
