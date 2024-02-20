import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./sovereignEntity";
import { WBMetaData } from "src/frontmatter/sharedFM";
import { TAbstractFile, TFile } from "obsidian";

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  sovereignEntities: Map<string, SovereignEntity>;
  //settlementEntites: Map<string, SettlementEntity>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.sovereignEntities = new Map<string, SovereignEntity>();
  }

  public load() {
    const files = this.plugin.app.vault.getMarkdownFiles();
    for (const file of files) {
      this.loadFile(file);
    }
  }

  public onFileCreation(file: TAbstractFile) {
    this.loadFile(file);
  }

  public onFileDeletion(file: TAbstractFile) {
    this.sovereignEntities.delete(file.path);
  }

  public onFileRename(file: TAbstractFile, oldPath: string) {
    if (this.sovereignEntities.has(oldPath)) {
      const entity = this.sovereignEntities.get(oldPath);
      this.sovereignEntities.delete(oldPath);
      this.sovereignEntities.set(file.path, entity as SovereignEntity);
    }
  }

  public onFileModify(file: TAbstractFile) {
    this.loadFile(file);
  }

  private loadFile(file: TAbstractFile) {
    const fileMeta = this.plugin.app.metadataCache.getFileCache(file as TFile);
    if (fileMeta === null) return;
    const frontMatter = fileMeta.frontmatter;
    if (frontMatter === undefined) return;
    if (!frontMatter.hasOwnProperty("wbMeta")) return;
    const wbMeta: WBMetaData = frontMatter["wbMeta"];

    switch (wbMeta.type) {
      case "sovereignEntity": {
        const entity = new SovereignEntity(this.plugin, frontMatter);
        this.sovereignEntities.set(file.path, entity);
        break;
      }
      case "settlementEntity": {
        break;
      }
    }
  }
}
