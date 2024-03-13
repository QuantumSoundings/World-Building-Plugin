import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./sovereignEntity";
import { WBMetaData } from "src/frontmatter/sharedConfiguration";
import { TAbstractFile } from "obsidian";
import { SettlementEntity } from "./settlementEntity";
import { YAMLUtils } from "src/util/frontMatter";
import { Logger } from "src/util/Logger";

export type WorldEngineEntity = SovereignEntity | SettlementEntity;

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  private entities: Map<string, WorldEngineEntity>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.entities = new Map<string, WorldEngineEntity>();
  }

  public initialize() {
    const files = this.plugin.app.vault.getMarkdownFiles();
    for (const file of files) {
      this.createEntity(file);
    }
  }

  public registerEventCallbacks() {
    const onFileDeletion = (file: TAbstractFile) => {
      if (this.entities.has(file.path)) {
        this.entities.delete(file.path);
      }
    };
    const onFileRename = (file: TAbstractFile, oldPath: string) => {
      if (this.entities.has(oldPath)) {
        this.entities.set(file.path, this.entities.get(oldPath) as WorldEngineEntity);
        this.entities.delete(oldPath);
      }
    };
    const onFileModify = async (file: TAbstractFile) => {
      // Doing it this way so obsidian doesn't try and process broken yaml.
      if (!(await YAMLUtils.validYaml(this.plugin, file.path))) {
        Logger.debug(this, "File " + file.path + " is not valid YAML. User is likely still typing.");
        return;
      }
      Logger.debug(this, "File " + file.path + " is valid YAML. Processing.");
      const entity = this.entities.get(file.path);
      if (entity !== undefined) {
        const frontMatter = await this.plugin.frontMatterManager.getFrontMatter(file.path);
        if (frontMatter === null) return;
        if (!frontMatter.hasOwnProperty("wbMeta")) return;
        const wbMeta: WBMetaData = frontMatter["wbMeta"];
        if (wbMeta.type === entity.configuration.wbMeta.type) {
          entity.updateConfiguration(frontMatter);
        } else {
          // Entity type has changed, reload the file.
          this.createEntity(file);
        }
      }
    };
    this.plugin.registerEvent(this.plugin.app.vault.on("delete", onFileDeletion));
    this.plugin.registerEvent(this.plugin.app.vault.on("rename", onFileRename));
    this.plugin.registerEvent(this.plugin.app.vault.on("modify", onFileModify));
  }

  public getEntity(fullPath: string): WorldEngineEntity | undefined {
    const entity = this.entities.get(fullPath);
    if (entity !== undefined && "update" in entity) {
      entity.update();
    }
    return entity;
  }

  private async createEntity(file: TAbstractFile) {
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
