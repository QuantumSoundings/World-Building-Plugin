import WorldBuildingPlugin from "src/main";
import { SettlementEntity } from "./settlementEntity";
import { SovereignEntity } from "./sovereignEntity";
import { PointOfInterest } from "src/data/dataTypes";

export interface BaseEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;
}

export interface PointOfInterestEntity {
  getMapPointOfInterest(): PointOfInterest;
}

export function isPointOfInterestEntity(entity: any): entity is PointOfInterestEntity {
  return "getMapPointOfInterest" in entity;
}

export type MappableEntity = BaseEntity & PointOfInterestEntity;

export type WorldEngineEntity = SovereignEntity | SettlementEntity;
