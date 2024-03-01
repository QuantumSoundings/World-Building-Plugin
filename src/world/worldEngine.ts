import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./sovereignEntity";
import { WBMetaData } from "src/frontmatter/sharedConfiguration";
import { TAbstractFile } from "obsidian";
import { SettlementEntity } from "./settlementEntity";

type EntityType = SovereignEntity | SettlementEntity;

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  entities: Map<string, EntityType>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.entities = new Map<string, EntityType>();
  }

  public initialize() {
    const files = this.plugin.app.vault.getMarkdownFiles();
    for (const file of files) {
      this.loadFile(file);
    }
  }

  public onFileDeletion(file: TAbstractFile) {
    if (this.entities.has(file.path)) {
      this.entities.delete(file.path);
    }
  }

  public onFileRename(file: TAbstractFile, oldPath: string) {
    if (this.entities.has(oldPath)) {
      this.entities.set(file.path, this.entities.get(oldPath) as EntityType);
      this.entities.delete(oldPath);
    }
  }

  public async onFileModify(file: TAbstractFile) {
    // This will replace existing entries and add new compatible ones.
    this.loadFile(file);
  }

  private async loadFile(file: TAbstractFile) {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatter(file.path);
    if (frontMatter === null) return;
    if (!frontMatter.hasOwnProperty("wbMeta")) return;
    const wbMeta: WBMetaData = frontMatter["wbMeta"];

    switch (wbMeta.type) {
      case "sovereignEntity": {
        const entity = new SovereignEntity(this.plugin, frontMatter);
        this.entities.set(file.path, entity);
        break;
      }
      case "settlementEntity": {
        break;
      }
    }
  }
}
