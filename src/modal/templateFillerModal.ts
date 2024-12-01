import { Modal, Notice, parseYaml, Setting, stringifyYaml, TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import { Logger } from "src/util/Logger";

export class TemplateFillerModal extends Modal {
  plugin: WorldBuildingPlugin;
  activeFile: TFile;
  parseFailed: boolean = false;

  templateString: string;
  parsedTemplate: any;
  templateProperties: Map<string, string>;

  constructor(plugin: WorldBuildingPlugin, activeFile: TFile, template: string) {
    super(plugin.app);
    Logger.info(this, "TemplateFillerModal constructor");
    this.plugin = plugin;
    this.activeFile = activeFile;
    this.templateString = template;
    const parseResults = FMUtils.parseMarkdownFile(this.templateString);
    if (parseResults !== undefined && parseResults.frontMatter !== undefined) {
      this.parsedTemplate = parseYaml(parseResults.frontMatter);
    } else {
      this.parseFailed = true;
    }
  }

  onOpen() {
    if (this.parseFailed) {
      new Notice("Failed to parse frontmatter. Please check the template.", 2000);
      this.close();
      return;
    }

    this.createLevelProperties(1, this.parsedTemplate, "Template Properties");

    new Setting(this.contentEl).addButton((btn) =>
      btn
        .setButtonText("Save Template")
        .setCta()
        .onClick(async () => {
          const newYaml = stringifyYaml(this.parsedTemplate);
          const filledTemplate = FMUtils.replaceFrontMatter(this.templateString, newYaml);
          await this.plugin.frontMatterManager.writeNoteTemplate(this.activeFile.path, filledTemplate);
          new Notice("FrontMatter template has been set!", 2000);
          this.close();
        })
    );
  }

  createLevelProperties(depth: number, prop: any, propName: string) {
    if (typeof prop === "object") {
      this.contentEl.createEl(this.depthToTag(depth), { text: propName });

      // Create settings for all the keys of this object
      for (const key in prop) {
        if (typeof prop[key] === "object" && !Array.isArray(prop[key])) {
          this.createLevelProperties(depth + 1, prop[key], key);
        } else if (typeof prop[key] === "string") {
          new Setting(this.contentEl).setName(key).addText((textField) => {
            textField.setValue(prop[key]);
            textField.onChange((newValue) => {
              prop[key] = newValue as string;
            });
          });
        } else if (typeof prop[key] === "number") {
          new Setting(this.contentEl).setName(key).addText((textField) => {
            textField.setValue(prop[key].toString());
            textField.onChange((newValue) => {
              prop[key] = parseInt(newValue);
            });
          });
        } else if (Array.isArray(prop[key])) {
          new Setting(this.contentEl).setName(key).addText((textField) => {
            textField.setValue("[]");
            textField.onChange((newValue) => {
              prop[key] = newValue;
            });
          });
        }
      }
    }
  }

  depthToTag(depth: number) {
    switch (depth) {
      case 1:
        return "h1";
      case 2:
        return "h2";
      case 3:
        return "h3";
      case 4:
        return "h4";
      case 5:
        return "h5";
      case 6:
        return "h6";
    }
    return "h1";
  }

  onClose() {
    super.onClose();
  }
}
