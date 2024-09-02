import type WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export class NameGenerator {
  plugin: WorldBuildingPlugin;

  origins: Set<string> = new Set();

  maleFirstNameMap: Map<string, string[]> = new Map();
  neutralFirstNameMap: Map<string, string[]> = new Map();
  femaleFirstNameMap: Map<string, string[]> = new Map();

  maleLastNameMap: Map<string, string[]> = new Map();
  neutralLastNameMap: Map<string, string[]> = new Map();
  femaleLastNameMap: Map<string, string[]> = new Map();

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.parseNameData();
  }

  private parseNameData() {
    const firstNameData = this.plugin.dataManager.datasets.firstName.live;
    const lastNameData = this.plugin.dataManager.datasets.lastName.live;
    for (const name of firstNameData) {
      this.origins.add(name.origin);
      let map = undefined;
      switch (name.gender) {
        case "Male":
          map = this.maleFirstNameMap;
          break;
        case "Female":
          map = this.femaleFirstNameMap;
          break;
        case "Neutral":
          map = this.neutralFirstNameMap;
          break;
        default:
          Logger.info(this, "Invalid gender: " + name.gender);
      }
      if (map !== undefined) {
        if (map.has(name.origin)) {
          map.get(name.origin)?.push(name.name);
        } else {
          map.set(name.origin, [name.name]);
        }
      }
    }

    for (const name of lastNameData) {
      this.origins.add(name.origin);
      let map = undefined;
      switch (name.gender) {
        case "Male":
          map = this.maleLastNameMap;
          break;
        case "Female":
          map = this.femaleLastNameMap;
          break;
        case "Neutral":
          map = this.neutralLastNameMap;
          break;
        default:
          Logger.info(this, "Invalid gender: " + name.gender);
      }
      if (map !== undefined) {
        if (map.has(name.origin)) {
          map.get(name.origin)?.push(name.name);
        } else {
          map.set(name.origin, [name.name]);
        }
      }
    }
  }

  public getOriginRecords(): Record<string, string> {
    const result: Record<string, string> = {};
    const sortedOrigins = Array.from(this.origins).sort();
    for (const origin of sortedOrigins) {
      result[origin] = origin;
    }
    return result;
  }

  public getGenderRecords(): Record<string, string> {
    const result: Record<string, string> = {};
    result["Male"] = "Male";
    result["Neutral"] = "Neutral";
    result["Female"] = "Female";
    return result;
  }

  public generateNames(nameType: string, origin: string, gender: string, numberToGenerate: number): string[] {
    const result: string[] = [];

    let map = undefined;
    switch (gender) {
      case "Male":
        map = nameType === "First Name" ? this.maleFirstNameMap : this.maleLastNameMap;
        break;
      case "Female":
        map = nameType === "First Name" ? this.femaleFirstNameMap : this.femaleLastNameMap;
        break;
      case "Neutral":
        map = nameType === "First Name" ? this.neutralFirstNameMap : this.neutralLastNameMap;
        break;
      default:
        Logger.info(this, "Invalid gender: " + gender);
        return;
    }
    let names = map.get(origin);

    for (let i = 0; i < numberToGenerate; i++) {
      const index = this.generateInt(0, names.length - 1);
      result.push(names[index]);
    }
    return result;
  }

  private generateInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
