import { MapConfiguration } from "src/data/dataTypes";

export class MapUtils {
  public static calculateArea(config: MapConfiguration, areaPercentage: number) {
    return config.unitHeight * config.unitWidth * areaPercentage;
  }
}
