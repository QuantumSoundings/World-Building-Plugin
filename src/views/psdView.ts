import { FileView, Menu, Setting, SliderComponent, TFile, WorkspaceLeaf, getIcon } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export const PSD_VIEW = "psd-view";
const ZOOM_STEP_CTRL = 5;
const ZOOM_STEP_SHIFT_CTRL = 1;

const CITY_ICON = "castle";

type PersistState = {
  zoom: number;
};

interface PointOfInterest {
  relX: number;
  relY: number;
  name: string;
  type: string;
  filePath: string;
}

export class PSDView extends FileView {
  plugin: WorldBuildingPlugin;

  viewContainerElement: HTMLElement;
  controlsContainerElement: HTMLElement;
  pointOfInterestElement: HTMLElement;
  zoomSlider: SliderComponent;
  zoomSetting: Setting;

  contentContainerEl: HTMLElement;
  canvasElement: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D | null;
  image: ImageBitmap;
  pointsOfInterest: PointOfInterest[] = [];
  currentPointOfInterest: PointOfInterest | null;
  icons: Map<string, HTMLImageElement> = new Map();
  iconSize: number;

  currentScale: number;
  loadingFile: boolean;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    const container = this.containerEl.children[1];
    container.empty();
    // Overall container for the view.
    this.viewContainerElement = container.createEl("div");
    this.viewContainerElement.setCssProps({ "webkit-user-select": "text", "user-select": "text" });
    this.controlsContainerElement = this.viewContainerElement.createEl("div");
    this.pointOfInterestElement = this.viewContainerElement.createEl("h2", {
      text: `Points of Interest: ${this.currentPointOfInterest ? this.currentPointOfInterest.name : "None"}`,
    });

    // Content container.
    this.contentContainerEl = this.viewContainerElement.createEl("div");
    this.canvasElement = this.contentContainerEl.createEl("canvas");
    this.canvasContext = this.canvasElement.getContext("2d");
    if (this.canvasContext === null) {
      Logger.warn(this, "Failed to get 2d context for canvas");
    }

    this.loadingFile = false;
    this.currentScale = 100;

    this.zoomSetting = new Setting(this.controlsContainerElement)
      .setName(`Zoom Level: ${this.currentScale}%`)
      .addSlider((slider) => {
        this.zoomSlider = slider;
        this.zoomSlider.setLimits(1, 200, ZOOM_STEP_CTRL);
        this.zoomSlider.setValue(this.currentScale);
        this.zoomSlider.onChange((value) => {
          if (this.loadingFile) {
            return;
          }
          this.currentScale = value;
          this.zoomSetting.setName(`Zoom Level: ${this.currentScale}%`);
          this.updateCanvas();
        });
      });

    this.setEventListeners();
  }

  public override getViewType() {
    return PSD_VIEW;
  }

  public override getIcon(): string {
    return "file-image";
  }

  public override async onLoadFile(file: TFile): Promise<void> {
    super.onLoadFile(file);
    this.loadingFile = true;

    // Load our zoom level from local storage
    const storageItem = localStorage.getItem(file.path);
    if (storageItem !== null) {
      const storage: PersistState = JSON.parse(storageItem);
      if (storage.zoom < 1) {
        storage.zoom *= 100;
        storage.zoom = Math.round(storage.zoom);
      }
      this.currentScale = storage.zoom;
      this.updateZoomSlider();
    }

    // Mark any points of interest
    this.addMapEntities();

    // Load our image from the PSD manager
    const image = this.plugin.psdManager.getImage(file.path);
    if (image !== null) {
      this.image = image;
      this.iconSize = this.image.height / 100;
    }

    // Scale our icons
    this.scaleIcons();

    this.updateCanvas();
    this.loadingFile = false;
  }

  public override async onUnloadFile(file: TFile): Promise<void> {
    const storage: PersistState = {
      zoom: this.currentScale,
    };
    localStorage.setItem(file.path, JSON.stringify(storage));
    super.onUnloadFile(file);
  }

  public override canAcceptExtension(extension: string): boolean {
    return extension === "psd";
  }

  private updateCanvas() {
    if (this.canvasContext !== null) {
      const scale = this.currentScale / 100;
      // Clear old data
      this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      // Rescale our canvas and context
      this.canvasElement.width = scale * this.image.width;
      this.canvasElement.height = scale * this.image.height;
      this.canvasContext.scale(scale, scale);
      // Redraw our data
      this.canvasContext.drawImage(this.image, 0, 0);

      // Draw points of interest
      for (const poi of this.pointsOfInterest) {
        const absX = this.image.width * (poi.relX / 100);
        const absY = this.image.height * (poi.relY / 100);
        const image = this.icons.get(CITY_ICON);
        if (image !== undefined) {
          this.canvasContext.drawImage(image, absX - 50, absY - 50);
        }
      }
    }
  }

  private addMapEntities() {
    if (this.file === null) {
      return;
    }
    const entities = this.plugin.worldEngine.getEntitiesForMap(this.file.name);
    for (const entity of entities) {
      this.pointsOfInterest.push({
        relX: entity.map.relX,
        relY: entity.map.relY,
        name: entity.name,
        type: entity.map.type,
        filePath: entity.filePath,
      });
    }
  }

  private scaleIcons() {
    this.icons.set(CITY_ICON, this.iconToImage(CITY_ICON));
  }

  private updateZoomSlider() {
    this.zoomSlider.setValue(this.currentScale);
    this.zoomSetting.setName(`Zoom Level: ${this.currentScale}%`);
  }

  private setEventListeners() {
    this.contentContainerEl.addEventListener("wheel", this.onWheelUpdate.bind(this));
    this.canvasElement.addEventListener("contextmenu", this.onContextMenu.bind(this));
    this.canvasElement.addEventListener("mouseover", this.onMouseUpdate.bind(this));
    this.canvasElement.addEventListener("mousemove", this.onMouseUpdate.bind(this));
  }

  private hasCollision(relX: number, relY: number, poi: PointOfInterest) {
    const distance = Math.sqrt((relX - poi.relX) ** 2 + (relY - poi.relY) ** 2);
    return distance <= this.iconSize / 2;
  }

  private toRelativePosition(xPos: number, yPos: number) {
    const rect = this.canvasElement.getBoundingClientRect();
    const relX = (xPos - rect.left) / this.currentScale;
    const relY = (yPos - rect.top) / this.currentScale;
    return { relX, relY };
  }

  private iconToImage(icon: string): HTMLImageElement {
    const iconElement = getIcon(icon);
    if (iconElement === null) {
      Logger.error(this, `Failed to get icon: ${icon}`);
      return new Image();
    }
    iconElement.setAttribute("width", `${this.iconSize}px`);
    iconElement.setAttribute("height", `${this.iconSize}px`);
    const xml = new XMLSerializer().serializeToString(iconElement);
    const data = `data:image/svg+xml;base64,${btoa(xml)}`;
    const img = new Image();
    img.setAttribute("src", data);
    return img;
  }

  private onWheelUpdate(event: WheelEvent) {
    if (this.loadingFile) {
      return;
    }
    if (event.shiftKey && event.ctrlKey) {
      if (event.deltaY < 0) {
        if (this.currentScale < 200) {
          this.currentScale += ZOOM_STEP_SHIFT_CTRL;
        } else {
          this.currentScale = 200;
        }
      } else {
        if (this.currentScale > 5) {
          this.currentScale -= ZOOM_STEP_SHIFT_CTRL;
        } else {
          this.currentScale = 1;
        }
      }
    } else if (event.ctrlKey) {
      event.preventDefault();
      if (event.deltaY < 0) {
        if (this.currentScale < 200) {
          this.currentScale += ZOOM_STEP_CTRL;
        } else {
          this.currentScale = 200;
        }
      } else {
        if (this.currentScale > 5) {
          this.currentScale -= ZOOM_STEP_CTRL;
        } else {
          this.currentScale = 1;
        }
      }
    } else {
      return;
    }

    this.updateZoomSlider();
  }

  private onMouseUpdate(event: MouseEvent) {
    const { relX, relY } = this.toRelativePosition(event.clientX, event.clientY);
    for (const poi of this.pointsOfInterest) {
      if (this.hasCollision(relX, relY, poi)) {
        this.pointOfInterestElement.setText(
          `Points of Interest: ${this.currentPointOfInterest ? this.currentPointOfInterest.name : "None"}`
        );
        this.currentPointOfInterest = poi;
        return;
      }
    }
    this.pointOfInterestElement.setText("Points of Interest: None");
    this.currentPointOfInterest = null;
  }

  private onContextMenu(event: MouseEvent) {
    const { relX, relY } = this.toRelativePosition(event.clientX, event.clientY);
    const menu = new Menu();
    menu.addItem((item) => {
      item.setTitle(`Relative X Position: ${relX}`);
    });
    menu.addItem((item) => {
      item.setTitle(`Relative Y Position: ${relY}`);
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("Copy to clipboard as [x, y]");
      item.onClick(() => {
        navigator.clipboard.writeText(`[${relX}, ${relY}]`);
        menu.close();
      });
    });

    // If we are over a poi add it to the context menu
    const poi = this.currentPointOfInterest;
    if (poi !== null) {
      menu.addItem((item) => {
        item.setTitle(`Open ${poi.name} in new tab`);
        item.onClick(async () => {
          await this.app.workspace.openLinkText(poi.filePath, "", true);
          menu.close();
        });
      });
    }

    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
}
