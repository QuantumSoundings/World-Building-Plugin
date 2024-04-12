import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./entities/sovereignEntity";
import { TAbstractFile } from "obsidian";
import { SettlementEntity } from "./entities/settlementEntity";
import { Logger } from "src/util/Logger";
import { WorldEngineEntity, MappableEntity } from "./entities/shared";
import { WBMetaDataEnum } from "src/frontmatter/types/meta";

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
      const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(file.path);
      const validEntity = this.isValidEntity(frontMatter);
      if (!validEntity) return;

      const entity = this.entities.get(file.path);
      if (entity !== undefined) {
        const worldEngineView = this.plugin.getWorldEngineView();
        const entityMatches = worldEngineView !== undefined && worldEngineView.getCurrentEntity() === entity;
        if (frontMatter["wbMeta"].type === entity.configuration.wbMeta.type) {
          entity.updateConfiguration(frontMatter);
          if (entityMatches) {
            worldEngineView.displayEntity(entity);
          }
        } else {
          // Entity type has changed, reload the file.
          await this.createEntity(file);
          const newEntity = this.entities.get(file.path);
          if (newEntity !== undefined) {
            if (entityMatches) {
              worldEngineView.displayEntity(newEntity);
            }
          }
        }
      } else {
        await this.createEntity(file);
      }
    };
    this.plugin.registerEvent(this.plugin.app.vault.on("delete", onFileDeletion));
    this.plugin.registerEvent(this.plugin.app.vault.on("rename", onFileRename));
    this.plugin.registerEvent(this.plugin.app.vault.on("modify", onFileModify));
  }

  public triggerUpdate() {
    const worldEngineView = this.plugin.getWorldEngineView();
    if (worldEngineView === undefined) return;
    const entity = worldEngineView.getCurrentEntity();
    if (entity !== undefined) {
      if ("update" in entity) {
        entity.update();
        worldEngineView.reloadEntity();
      }
    }
  }

  public getEntity(fullPath: string): WorldEngineEntity | undefined {
    const entity = this.entities.get(fullPath);
    if (entity !== undefined && "update" in entity) {
      entity.update();
    }
    return entity;
  }

  public getEntitiesForMap(mapName: string): MappableEntity[] {
    const output: MappableEntity[] = [];
    for (const entity of this.entities.values()) {
      if ("map" in entity) {
        if (entity.map.name === mapName) {
          output.push(entity);
        }
      }
    }
    return output;
  }

  private isValidEntity(frontMatter: any): boolean {
    if (frontMatter === null || frontMatter === undefined) return false;
    if (!frontMatter.hasOwnProperty("wbMeta")) return false;
    return true;
  }

  private async createEntity(file: TAbstractFile) {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatter(file.path);
    if (!this.isValidEntity(frontMatter)) return;

    let entity: WorldEngineEntity;
    switch (frontMatter["wbMeta"].type) {
      case WBMetaDataEnum.sovereignEntity: {
        entity = new SovereignEntity(this.plugin, frontMatter);

        break;
      }
      case WBMetaDataEnum.settlementEntity: {
        entity = new SettlementEntity(this.plugin, frontMatter);
        break;
      }
      default: {
        Logger.error(this, "Unknown entity type: " + frontMatter["wbMeta"].type);
        return;
      }
    }

    entity.filePath = file.path;
    this.entities.set(file.path, entity);
  }
}
