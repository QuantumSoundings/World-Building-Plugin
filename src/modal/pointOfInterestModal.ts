import { Modal, Notice, Setting } from "obsidian";
import { TemplateType, getTemplateFromType } from "src/constants";
import WorldBuildingPlugin from "src/main";

export interface POIModalOptions {
  name?: string;
  mapName: string;
  relX?: number;
  relY?: number;
  icon?: string;
}

export class PointOfInterestModal extends Modal {
  plugin: WorldBuildingPlugin;

  // Point of Interest Parameters
  name: string;
  mapName: string;
  relX: number;
  relY: number;
  icon: string;
  template: TemplateType;

  constructor(plugin: WorldBuildingPlugin, options: POIModalOptions) {
    super(plugin.app);
    this.plugin = plugin;
    this.name = options.name ?? "";
    this.mapName = options.mapName ?? "";
    this.relX = options.relX ?? 0;
    this.relY = options.relY ?? 0;
    this.icon = options.icon ?? "castle";
    this.template = TemplateType.SETTLEMENT;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Create New Point of Interest" });

    new Setting(contentEl).setName("Name").addText((text) => {
      text.setValue(this.name);
      text.onChange((value) => {
        this.name = value;
      });
    });

    new Setting(contentEl).setName("Relative X").addText((text) => {
      text.setValue(`${this.relX}`);
      text.onChange((value) => {
        this.relX = parseFloat(value);
      });
    });

    new Setting(contentEl).setName("Relative Y").addText((text) => {
      text.setValue(`${this.relY}`);
      text.onChange((value) => {
        this.relY = parseFloat(value);
      });
    });

    new Setting(contentEl).setName("Point of Interest Type").addDropdown((dropdown) => {
      dropdown.addOptions({ Settlement: TemplateType.SETTLEMENT });
      dropdown.onChange((value) => {
        this.template = value as TemplateType;
      });
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(async () => {
          const filePath = `${this.name}.md`;
          const file = this.app.vault.getAbstractFileByPath(filePath);
          if (file !== null) {
            new Notice(`Point of Interest ${file.path} already exists.`);
            return;
          }
          await this.plugin.app.vault.create(filePath, `---\n${getTemplateFromType(this.template)}\n---\n`);
          await this.plugin.frontMatterManager.addUpdateFrontMatterProperty(filePath, "pointOfInterest", {
            mapName: this.mapName,
            relX: this.relX,
            relY: this.relY,
            icon: this.icon,
          });
          await this.plugin.frontMatterManager.addUpdateFrontMatterProperty(filePath, "name", this.name);
          await this.app.workspace.openLinkText(filePath, "", true);
          this.close();
        })
    );
  }

  onClose() {
    super.onClose();
  }
}
