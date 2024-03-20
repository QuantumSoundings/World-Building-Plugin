import { FileView, Setting, SliderComponent, TFile, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export const PSD_VIEW = "psd-view";
const ZOOM_STEP_CTRL = 5;
const ZOOM_STEP_SHIFT_CTRL = 1;

type PersistState = {
  zoom: number;
};

export class PSDView extends FileView {
  plugin: WorldBuildingPlugin;

  viewContainerElement: HTMLElement;
  controlsContainerElement: HTMLElement;
  zoomSlider: SliderComponent;
  zoomSetting: Setting;

  contentContainerEl: HTMLElement;
  canvasElement: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D | null;
  image: ImageBitmap;

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

    // When we detect a scroll event with control help, update our scale and the canvas.
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
      this.updateCanvas();
    });
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
    const image = this.plugin.psdManager.getImage(file.path);
    if (image !== null) {
      this.image = image;
      this.updateCanvas();
    }
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
    }
  }

  private updateZoomSlider() {
    this.zoomSlider.setValue(this.currentScale);
    this.zoomSetting.setName(`Zoom Level: ${this.currentScale}%`);
  }
}
