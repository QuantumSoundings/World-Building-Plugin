import { FileView, Menu, Setting, SliderComponent, TFile, WorkspaceLeaf, getIcon } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export const PSD_VIEW = "psd-view";
const ZOOM_STEP_CTRL = 5;
const ZOOM_STEP_SHIFT_CTRL = 1;

type PersistState = {
  zoom: number;
};

interface PointOfInterest {
  x: number;
  y: number;
  radius: number;
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
    }

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
        const absX = this.image.width * (poi.x / 100);
        const absY = this.image.height * (poi.y / 100);
        //const radius = this.toAbsoluteRadius(poi.radius);
        //this.canvasContext.beginPath();
        //this.canvasContext.arc(absX, absY, radius, 0, 2 * Math.PI);
        //this.canvasContext.fillStyle = "red";
        //this.canvasContext.fill();
        //this.canvasContext.closePath();
        const image = this.iconToImage("castle");
        if (image !== null) {
          this.canvasContext.drawImage(image, absX - 50, absY - 50);
        }
      }
    }
  }

  private addMapEntities() {
    if (this.file === null || this.canvasContext === null) {
      return;
    }
    const entities = this.plugin.worldEngine.getEntitiesForMap(this.file.name);
    for (const entity of entities) {
      const DEFAULT_RADIUS = 0.5;
      this.pointsOfInterest.push({
        x: entity.xPos,
        y: entity.yPos,
        radius: DEFAULT_RADIUS,
        name: entity.name,
        type: entity.type,
        filePath: entity.filePath,
      });
    }
  }

  private updateZoomSlider() {
    this.zoomSlider.setValue(this.currentScale);
    this.zoomSetting.setName(`Zoom Level: ${this.currentScale}%`);
  }

  private setEventListeners() {
    // When we detect a scroll event with control, update our scale and the canvas.
    this.contentContainerEl.addEventListener("wheel", (event) => {
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
    });

    // Right Click Context Menu
    this.canvasElement.addEventListener("contextmenu", (ev: MouseEvent) => {
      const { relX, relY } = this.toRelativePosition(ev.clientX, ev.clientY);
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

      menu.showAtPosition({ x: ev.clientX, y: ev.clientY });
    });

    // Mouse over events
    const onMouseUpdate = (ev: MouseEvent) => {
      const { relX, relY } = this.toRelativePosition(ev.clientX, ev.clientY);
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
    };

    this.canvasElement.addEventListener("mouseover", onMouseUpdate);
    this.canvasElement.addEventListener("mousemove", onMouseUpdate);
  }

  private hasCollision(xPos: number, yPos: number, poi: PointOfInterest) {
    const distance = Math.sqrt((xPos - poi.x) ** 2 + (yPos - poi.y) ** 2);
    Logger.info(this, `Distance to ${poi.name}: ${distance}`);
    return distance <= poi.radius;
  }

  private toRelativePosition(xPos: number, yPos: number) {
    const rect = this.canvasElement.getBoundingClientRect();
    const relX = (xPos - rect.left) / this.currentScale;
    const relY = (yPos - rect.top) / this.currentScale;
    return { relX, relY };
  }

  private toAbsoluteRadius(radius: number) {
    const rect = this.canvasElement.getBoundingClientRect();
    if (rect.width === rect.height) {
      return (radius * rect.height) / this.currentScale;
    } else if (rect.width > rect.height) {
      return (radius * rect.height) / this.currentScale;
    } else {
      return (radius * rect.width) / this.currentScale;
    }
  }

  private iconToImage(icon: string) {
    const iconElement = getIcon(icon);
    if (iconElement === null) {
      Logger.error(this, `Failed to get icon: ${icon}`);
      return null;
    }
    iconElement.setAttribute("width", `${this.image.height / 100}px`);
    iconElement.setAttribute("height", `${this.image.height / 100}px`);
    const xml = new XMLSerializer().serializeToString(iconElement);
    const data = `data:image/svg+xml;base64,${btoa(xml)}`;
    const img = new Image();
    img.setAttribute("src", data);
    return img;
  }
}
