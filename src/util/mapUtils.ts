import { MapConfiguration } from "src/types/dataTypes";

export class MapUtils {
  public static calculateArea(config: MapConfiguration, areaPercentage: number) {
    return config.unitHeight * config.unitWidth * areaPercentage;
  }
}
