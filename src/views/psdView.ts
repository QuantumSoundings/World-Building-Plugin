import { FileView, HoverParent, HoverPopover, Menu, Setting, SliderComponent, TFile, WorkspaceLeaf } from "obsidian";
import { PSD_HOVER_SOURCE, PSD_VIEW } from "src/constants";
import { PointOfInterest } from "src/data/dataTypes";
import WorldBuildingPlugin from "src/main";
import { PointOfInterestModal } from "src/modal/pointOfInterestModal";
import { Logger } from "src/util/Logger";
import { PSDUtils } from "src/util/psd";

const ZOOM_STEP_CTRL = 5;
const ZOOM_STEP_SHIFT_CTRL = 1;

type PersistState = {
  zoom: number;
};

/**
 * Relative Positions are stored as percentages of the image size. In the range [0, 1]
 */

export class PSDView extends FileView implements HoverParent {
  plugin: WorldBuildingPlugin;
  hoverPopover: HoverPopover | null;
  hoverOpen: boolean = false;
  hoverPoi: PointOfInterest | null;

  // View Container
  viewContainerElement: HTMLElement;

  // Header
  headerContainerElement: HTMLElement;
  controlsContainerElement: HTMLElement;
  pointOfInterestElement: HTMLElement;

  // Canvas
  contentContainerEl: HTMLElement;
  canvasElement: HTMLCanvasElement;

  zoomSlider: SliderComponent;
  zoomSetting: Setting;
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
    this.viewContainerElement.setCssStyles({
      display: "flex",
      flexDirection: "column",
      maxHeight: "100%",
      overflow: "clip",
    });

    this.headerContainerElement = this.viewContainerElement.createEl("div");
    this.controlsContainerElement = this.headerContainerElement.createEl("div");
    this.controlsContainerElement.setCssStyles({ maxWidth: "100%" });
    this.pointOfInterestElement = this.headerContainerElement.createEl("h2", {
      text: `Points of Interest: ${this.currentPointOfInterest ? this.currentPointOfInterest.label : "None"}`,
    });
    this.pointOfInterestElement.setCssStyles({ maxWidth: "100%" });

    // Content container.
    this.contentContainerEl = this.viewContainerElement.createEl("div");
    this.contentContainerEl.setCssStyles({ maxWidth: "100%", maxHeight: "100%", overflow: "scroll" });
    this.canvasElement = this.contentContainerEl.createEl("canvas");
    this.canvasContext = this.canvasElement.getContext("2d");
    if (this.canvasContext === null) {
      Logger.warn(this, "Failed to get 2d context for canvas");
    }
    this.hoverPopover = new HoverPopover(this, this.canvasElement);

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

    // Load settings from local storage
    this.loadStorage();

    // Grab data from the psdManager
    const image = this.plugin.psdManager.getImage(file.path);
    if (image !== null) {
      this.image = image;
      this.iconSize = this.image.height / 100;
      this.icons.clear();
    }

    // Mark any points of interest
    this.addPointsOfInterest();

    this.updateCanvas();
    this.loadingFile = false;
  }

  public override async onUnloadFile(file: TFile): Promise<void> {
    this.saveStorage();
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
        const absX = this.image.width * poi.relX;
        const absY = this.image.height * poi.relY;
        let iconImage = this.icons.get(poi.mapIcon);
        if (iconImage === undefined) {
          iconImage = PSDUtils.iconToImage(poi.mapIcon, this.iconSize);
          this.icons.set(poi.mapIcon, iconImage);
        }
        const iconOffset = this.iconSize / 2;
        this.canvasContext.drawImage(iconImage, absX - iconOffset, absY - iconOffset);
      }
    }
  }

  private addPointsOfInterest() {
    if (this.file === null) {
      return;
    }
    const file = this.file;
    this.pointsOfInterest = [];

    const addIfNew = (poi: PointOfInterest) => {
      const existing = this.pointsOfInterest.find((existingPoi) => existingPoi.label === poi.label);
      if (existing === undefined) {
        this.pointsOfInterest.push(poi);
      }
    };

    // Three sources of POIs.
    // 1. Configs
    // 2. World Engine
    // 3. PSD Manager
    const configPOIs = this.plugin.configManager.configs.pointsOfInterest.values.filter(
      (value) => value.mapName === file.name
    );
    configPOIs.forEach(addIfNew);

    const enginePOIs = this.plugin.worldEngine.getEntitiesForMap(file.name);
    enginePOIs.forEach(addIfNew);

    const psdPOIs = this.plugin.psdManager.getPointsOfInterest(file.path);
    psdPOIs.forEach(addIfNew);
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
    this.canvasElement.addEventListener("click", this.onMouseClick.bind(this));
  }

  private getDistance(relX: number, relY: number, poi: PointOfInterest) {
    return Math.sqrt((relX - poi.relX) ** 2 + (relY - poi.relY) ** 2);
  }

  private hasCollision(relX: number, relY: number, poi: PointOfInterest) {
    // Distance is with 1/200 of the image size
    return this.getDistance(relX, relY, poi) <= 0.005;
  }

  private toRelativePosition(absX: number, absY: number) {
    const rect = this.canvasElement.getBoundingClientRect();
    const relX = (absX - rect.left) / rect.width;
    const relY = (absY - rect.top) / rect.height;
    return { relX, relY };
  }

  private saveStorage() {
    const storage: PersistState = {
      zoom: this.currentScale,
    };
    if (this.file !== null) {
      localStorage.setItem(this.file.path, JSON.stringify(storage));
    }
  }

  private loadStorage() {
    if (this.file === null) {
      this.currentScale = 100;
      return;
    }

    const storageItem = localStorage.getItem(this.file.path);
    if (storageItem !== null) {
      const storage: PersistState = JSON.parse(storageItem);
      this.currentScale = storage.zoom;
      this.updateZoomSlider();
    }
  }

  // Methods for handling events
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

  private async onMouseClick() {
    if (this.currentPointOfInterest !== null) {
      const link = this.currentPointOfInterest.link.substring(2, this.currentPointOfInterest.link.length - 2);
      await this.plugin.app.workspace.openLinkText(link, "", true);
    }
  }
  private onMouseUpdate(event: MouseEvent) {
    const { relX, relY } = this.toRelativePosition(event.clientX, event.clientY);
    for (const poi of this.pointsOfInterest) {
      if (this.hasCollision(relX, relY, poi)) {
        this.pointOfInterestElement.setText(
          `Points of Interest: ${this.currentPointOfInterest ? this.currentPointOfInterest.label : "None"}`
        );
        this.currentPointOfInterest = poi;

        if (!this.hoverOpen) {
          this.plugin.app.workspace.trigger("hover-link", {
            event: event,
            source: PSD_HOVER_SOURCE,
            hoverParent: this,
            targetEl: this.canvasElement,
            linktext: this.currentPointOfInterest.link.substring(2, this.currentPointOfInterest.link.length - 2),
          });
          this.hoverOpen = true;
          this.hoverPoi = poi;
        }

        return;
      }
    }
    this.pointOfInterestElement.setText("Points of Interest: None");
    this.currentPointOfInterest = null;
    if (this.hoverOpen && this.getDistance(relX, relY, this.hoverPoi!) > 0.02) {
      this.hoverPopover?.hoverEl.hide();
      this.hoverPopover?.unload();
      this.hoverPopover = new HoverPopover(this, this.canvasElement);
      this.hoverOpen = false;
      this.hoverPoi = null;
    }
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
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("New Point of Interest Here");
      item.onClick(async () => {
        new PointOfInterestModal(this.plugin, this.file!.name, relX, relY).open();
      });
    });

    // If we are over a poi add it to the context menu
    const poi = this.currentPointOfInterest;
    if (poi !== null) {
      menu.addItem((item) => {
        item.setTitle(`Open ${poi.label} in new tab`);
        item.onClick(async () => {
          const link = poi.link.substring(2, poi.link.length - 2);
          await this.plugin.app.workspace.openLinkText(link, "", true);
          menu.close();
        });
      });
    }

    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
}
