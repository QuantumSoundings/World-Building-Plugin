import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./entities/sovereignEntity";
import { TAbstractFile } from "obsidian";
import { SettlementEntity } from "./entities/settlementEntity";
import { Logger } from "src/util/Logger";
import { WorldEngineEntity, isPointOfInterestEntity } from "./entities/shared";
import { PointOfInterest } from "src/data/dataTypes";
import { FMUtils } from "src/frontmatter/frontMatterUtils";
import { SovereignEntityConfiguration } from "src/frontmatter/sovereignEntityConfiguration";
import { SettlementEntityConfiguration } from "src/frontmatter/settlementEntityConfiguration";
import { WBFrontMatter } from "src/frontmatter/types/meta";

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  private entities: Map<string, WorldEngineEntity>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.entities = new Map<string, WorldEngineEntity>();
  }

  public async initialize() {
    const files = this.plugin.app.vault.getMarkdownFiles();
    for (const file of files) {
      await this.createEntity(file);
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
      if (!FMUtils.validateWBEntityType(frontMatter)) return;
      const validFM = frontMatter as WBFrontMatter;

      const entity = this.entities.get(file.path);
      if (entity !== undefined) {
        const worldEngineView = this.plugin.getWorldEngineView();
        const entityMatches = worldEngineView !== undefined && worldEngineView.getCurrentEntity() === entity;
        if (validFM.wbEntityType === entity.configuration.wbEntityType) {
          this.updateEntityConfiguration(entity, validFM);
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

  public getPointsOfInterestByMap(mapName: string): PointOfInterest[] {
    const output: PointOfInterest[] = [];
    for (const [, entity] of this.entities) {
      if (isPointOfInterestEntity(entity)) {
        if (entity.configuration.pointOfInterest.mapName === mapName) {
          output.push(entity.getMapPointOfInterest());
        }
      }
    }
    return output;
  }

  private async createEntity(file: TAbstractFile) {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatter(file.path);
    const newEntityConfiguration = FMUtils.convertFMToEntityConfiguration(frontMatter);
    if (newEntityConfiguration === undefined) {
      return;
    }

    let entity: WorldEngineEntity;
    if (newEntityConfiguration instanceof SovereignEntityConfiguration) {
      entity = new SovereignEntity(this.plugin, newEntityConfiguration);
    } else if (newEntityConfiguration instanceof SettlementEntityConfiguration) {
      entity = new SettlementEntity(this.plugin, newEntityConfiguration);
    } else {
      Logger.error(this, "Unknown entity type: " + frontMatter["wbEntityType"]);
      return;
    }

    entity.filePath = file.path;
    this.entities.set(file.path, entity);
  }

  private async updateEntityConfiguration(entity: WorldEngineEntity, validatedFM: WBFrontMatter) {
    if (entity instanceof SovereignEntity) {
      entity.updateConfiguration(new SovereignEntityConfiguration(validatedFM));
    } else if (entity instanceof SettlementEntity) {
      entity.updateConfiguration(new SettlementEntityConfiguration(validatedFM));
    } else {
      Logger.error(this, "Unknown entity type: " + validatedFM["wbEntityType"]);
    }
  }
}
