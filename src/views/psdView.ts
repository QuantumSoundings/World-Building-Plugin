import Psd from "@webtoon/psd";
import { ButtonComponent, FileView, Setting, SliderComponent, TFile, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export const PSD_VIEW = "psd-view";
const ZOOM_STEP = 0.05;
export class PSDView extends FileView {
  plugin: WorldBuildingPlugin;

  viewContainerElement: HTMLElement;
  controlsContainerElement: HTMLElement;
  zoomSlider: SliderComponent;
  zoomSetting: Setting;

  contentContainerEl: HTMLElement;
  canvasElement: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D | null;
  imageData: ImageData;
  image: CanvasImageSource;

  currentScale: number;

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

    this.currentScale = 1;

    this.zoomSetting = new Setting(this.controlsContainerElement).setName("Zoom Level: 1.0").addSlider((slider) => {
      this.zoomSlider = slider;
      this.zoomSlider.setLimits(0.05, 2, ZOOM_STEP);
      this.zoomSlider.setValue(this.currentScale);
      this.zoomSlider.onChange((value) => {
        this.zoomSetting.setName(`Zoom Level: ${value}`);
        this.currentScale = value;
        this.updateCanvas();
      });
    });

    // When we detect a scroll event with control help, update our scale and the canvas.
    this.contentContainerEl.addEventListener("wheel", (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        if (event.deltaY < 0) {
          if (this.currentScale < 2) {
            this.currentScale += ZOOM_STEP;
            this.updateCanvas();
            this.zoomSlider.setValue(this.currentScale);
            this.zoomSetting.setName(`Zoom Level: ${this.currentScale}`);
          }
        } else {
          if (this.currentScale > 0.05) {
            this.currentScale -= ZOOM_STEP;
            this.updateCanvas();
            this.zoomSlider.setValue(this.currentScale);
            this.zoomSetting.setName(`Zoom Level: ${this.currentScale}`);
          }
        }
      }
    });
  }

  public override getViewType() {
    return PSD_VIEW;
  }

  public override getDisplayText() {
    if (this.file !== null) {
      return this.file.name;
    }
    return "Unknown file";
  }

  public override async onOpen() {}
  public override async onClose() {}

  public override getIcon(): string {
    return "file-image";
  }

  public override async onLoadFile(file: TFile): Promise<void> {
    const binaryContent = await this.plugin.app.vault.readBinary(file);
    const psdFile = Psd.parse(binaryContent);

    const compositeBuffer = await psdFile.composite();
    this.imageData = new ImageData(compositeBuffer, psdFile.width, psdFile.height);
    this.image = await createImageBitmap(this.imageData);

    this.updateCanvas();
  }

  private updateCanvas() {
    if (this.canvasContext !== null) {
      // Clear old data
      this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      // Rescale our canvas and context
      this.canvasElement.width = this.currentScale * this.imageData.width;
      this.canvasElement.height = this.currentScale * this.imageData.height;
      this.canvasContext.scale(this.currentScale, this.currentScale);
      // Redraw our data
      this.canvasContext.drawImage(this.image, 0, 0);
    }
  }

  public override canAcceptExtension(extension: string): boolean {
    return extension === "psd";
  }
}
