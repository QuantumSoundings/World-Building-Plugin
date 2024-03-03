import { Layer, NodeChild } from "@webtoon/psd";
import { Logger } from "./Logger";

export class CompositeLayer {
  layer: Layer;
  composite: Uint8ClampedArray;
}

export class PSDUtils {
  public static async layerToCompositeLayer(layer: Layer): Promise<CompositeLayer> {
    const composite = await layer.composite();
    const compositeLayer = new CompositeLayer();
    compositeLayer.layer = layer;
    compositeLayer.composite = composite;
    return compositeLayer;
  }

  // Pass in the topography group then get the base layer.
  public static getBaseLayer(topographyGroupNode: NodeChild): Layer | undefined {
    if (topographyGroupNode.children === undefined) {
      Logger.warn(this, "Topography group node has no children.");
      return undefined;
    }

    for (const node of topographyGroupNode.children) {
      if (node.type === "Layer" && node.name === "Base") {
        return node as Layer;
      }
    }

    Logger.warn(this, "Topography group node has no base layer.");
    return undefined;
  }

  // Pass in the political group then get the political layers.
  public static getPoliticalLayers(politicalGroupNode: NodeChild): Layer[] {
    if (politicalGroupNode.children === undefined) {
      Logger.warn(this, "Political group node has no children.");
      return [];
    }

    const politicalLayers: Layer[] = [];
    for (const node of politicalGroupNode.children) {
      if (node.type === "Layer") {
        politicalLayers.push(node as Layer);
      }
    }
    return politicalLayers;
  }

  // Not quite perfect. But good enough for now.
  public static async findLayerIntersection(
    layer1: CompositeLayer,
    layer2: CompositeLayer,
    fileWidth: number,
    fileHeight: number
  ): Promise<number> {
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
}
