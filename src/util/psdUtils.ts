import Psd, { type Layer } from "@webtoon/psd";
import { Logger } from "./Logger";
import { getIcon } from "obsidian";
import { PointOfInterest } from "src/types/dataTypes";

export class CompositeLayer {
  layer: Layer;
  composite: Uint8ClampedArray;
}

export class GroupedLayers {
  baseLayer: CompositeLayer;
  politicalLayers: CompositeLayer[] = [];
  pointsOfInterest: PointOfInterest[] = [];
}

const BASE_LAYER_NAME = "Base";
const TOPOGRAPHY_GROUP_NAME = "Topography";
const POLITICAL_GROUP_NAME = "Political";
const POINTS_OF_INTEREST_GROUP_NAME = "Points of Interest";

export class PSDUtils {
  public static async layerToCompositeLayer(layer: Layer): Promise<CompositeLayer> {
    const composite = await layer.composite();
    const compositeLayer = new CompositeLayer();
    compositeLayer.layer = layer;
    compositeLayer.composite = composite;
    return compositeLayer;
  }

  public static async getGroupedLayers(psd: Psd) {
    const groupedLayers = new GroupedLayers();
    for (const layer of psd.layers) {
      if (layer.name === BASE_LAYER_NAME && layer.parent.name === TOPOGRAPHY_GROUP_NAME) {
        groupedLayers.baseLayer = await this.layerToCompositeLayer(layer);
      } else if (layer.parent.name === POLITICAL_GROUP_NAME) {
        const compositeLayer = await this.layerToCompositeLayer(layer);
        groupedLayers.politicalLayers.push(compositeLayer);
      } else if (layer.parent.name === POINTS_OF_INTEREST_GROUP_NAME) {
        const poi = new PointOfInterest(null);
        poi.label = layer.name;
        poi.link = `[[${layer.name}]]`;
        poi.relX = (layer.left + layer.width / 2) / psd.width;
        poi.relY = (layer.top + layer.height / 2) / psd.height;
        poi.mapIcon = "x";
        groupedLayers.pointsOfInterest.push(poi);
      }
    }
    return groupedLayers;
  }

  // Not quite perfect. But good enough for now.
  public static findLayerIntersection(
    layer1: CompositeLayer,
    layer2: CompositeLayer,
    fileWidth: number,
    fileHeight: number
  ): number {
    // Find the intersection of the two layers.
    // The intersection is the pixels that are not transparent in both layers.
    const layer1Pixels = layer1.composite;
    const layer2Pixels = layer2.composite;

    const selection1Up = layer1.layer.top;
    const selection1Left = layer1.layer.left;
    const selection1Right = layer1.layer.width + selection1Left - 1;
    const selection1Bottom = layer1.layer.height + selection1Up - 1;

    const selection2Up = layer2.layer.top;
    const selection2Left = layer2.layer.left;
    const selection2Right = layer2.layer.width + selection2Left - 1;
    const selection2Bottom = layer2.layer.height + selection2Up - 1;

    let intersectionPixelCount = 0;

    for (let column = 0; column < fileWidth; column++) {
      for (let row = 0; row < fileHeight; row++) {
        // Bounds checking Layer 1
        if (column < selection1Left || column >= selection1Right) {
          continue;
        }
        if (row < selection1Up || row >= selection1Bottom) {
          continue;
        }

        // Bounds checking Layer 2
        if (column < selection2Left || column >= selection2Right) {
          continue;
        }
        if (row < selection2Up || row >= selection2Bottom) {
          continue;
        }

        const index1 = (column - selection1Left) * 4 + (row - selection1Up) * layer1.layer.width * 4;
        const index2 = (column - selection2Left) * 4 + (row - selection2Up) * layer2.layer.width * 4;

        // Composite Space bounds checking
        if (index1 < 0 || index1 >= layer1Pixels.length) {
          Logger.error(this, "Index 1 out of bounds.");
        }
        if (index2 < 0 || index2 >= layer2Pixels.length) {
          Logger.error(this, "Index 2 out of bounds.");
        }

        // Is the pixel visible in both layers?
        // Check the alpha pixel and make sure it's not fully transparent.
        if (layer1Pixels[index1 + 3] !== 0 && layer2Pixels[index2 + 3] !== 0) {
          intersectionPixelCount++;
        }
      }
    }

    return intersectionPixelCount;
  }

  public static iconToImage(icon: string, iconSize: number): HTMLImageElement {
    const iconElement = getIcon(icon);
    if (iconElement === null) {
      Logger.error(this, `Failed to get icon: ${icon}`);
      return new Image();
    }
    iconElement.setAttribute("width", `${iconSize}px`);
    iconElement.setAttribute("height", `${iconSize}px`);
    const xml = new XMLSerializer().serializeToString(iconElement);
    const data = `data:image/svg+xml;base64,${btoa(xml)}`;
    const img = new Image();
    img.setAttribute("src", data);
    return img;
  }
}
