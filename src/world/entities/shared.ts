import WorldBuildingPlugin from "src/main";
import { SettlementEntity } from "./settlementEntity";
import { SovereignEntity } from "./sovereignEntity";

export interface BaseEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;
}

export interface MapEntity {
  map: {
    name: string;
    relX: number;
    relY: number;
    type: string;
  };
}

export type MappableEntity = BaseEntity & MapEntity;

export type WorldEngineEntity = SovereignEntity | SettlementEntity;
