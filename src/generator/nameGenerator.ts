import type WorldBuildingPlugin from "src/main";
import type { Name } from "src/types/dataTypes";
import { Logger } from "src/util/Logger";
import { generateInt } from "src/util/mathUtils";

export class NameGenerator {
  plugin: WorldBuildingPlugin;

  origins: Set<string> = new Set();
  genders: Set<string> = new Set();

  // Gender -> Origin -> Names
  firstNameMap: Map<string, Map<string, string[]>> = new Map();
  lastNameMap: Map<string, Map<string, string[]>> = new Map();

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.parseData();
  }

  private parseData() {
    const firstNameData = this.plugin.dataManager.datasets.firstName.live;
    const lastNameData = this.plugin.dataManager.datasets.lastName.live;
    this.parseNameData(this.firstNameMap, firstNameData);
    this.parseNameData(this.lastNameMap, lastNameData);
  }

  private parseNameData(genderMap: Map<string, Map<string, string[]>>, nameData: Name[]) {
    for (const name of nameData) {
      this.origins.add(name.origin);
      this.genders.add(name.gender);
      if (genderMap.has(name.gender)) {
        const originMap = genderMap.get(name.gender)!;
        if (originMap.has(name.origin)) {
          originMap.get(name.origin)?.push(name.name);
        } else {
          originMap.set(name.origin, [name.name]);
        }
      } else {
        const newGenderMap = new Map<string, string[]>();
        newGenderMap.set(name.origin, [name.name]);
        genderMap.set(name.gender, newGenderMap);
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
    const sortedGenders = Array.from(this.genders).sort();
    for (const gender of sortedGenders) {
      result[gender] = gender;
    }
    return result;
  }

  public generateNames(nameType: string, origin: string, gender: string, numberToGenerate: number): string[] {
    const result: string[] = [];

    const genderMap = nameType === "First Name" ? this.firstNameMap : this.lastNameMap;
    const originMap = genderMap.get(gender);
    if (originMap === undefined) {
      Logger.info(this, "Invalid gender: " + origin);
      return [];
    }
    const names = originMap.get(origin);
    if (names === undefined) {
      Logger.info(this, "Invalid origin: " + origin);
      return [];
    }

    for (let i = 0; i < numberToGenerate; i++) {
      const index = generateInt(0, names.length - 1);
      result.push(names[index]);
    }
    return result;
  }
}
