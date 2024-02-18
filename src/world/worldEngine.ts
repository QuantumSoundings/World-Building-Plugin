import WorldBuildingPlugin from "src/main";
import { SovereignEntity } from "./sovereignEntity";

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  sovereignEntities: Map<string, SovereignEntity>;
  //settlementEntites: Map<string, SettlementEntity>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }
}
