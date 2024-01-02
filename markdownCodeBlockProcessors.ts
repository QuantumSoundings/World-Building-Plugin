import WorldBuildingPlugin from "main";
import { parse } from 'csv-parse/sync';
import { DataviewApi, getAPI } from "obsidian-dataview";

export function registerCSVMarkdownCodeBlockProcessor(plugin: WorldBuildingPlugin)
{
  // Renders CSV tables
  plugin.registerMarkdownCodeBlockProcessor("wb-csv", async (source, el, _) => {
    // Source should be a file name
    const dv: DataviewApi | null  = getAPI();
    if (!dv) {
      el.createEl("p", { text: "Dataview plugin not installed" });
      return;
    }

    const raw_content = await dv.io.load(source);
    const parsed = parse(raw_content);

    const table = el.createEl("table");
    const body = table.createEl("tbody");

    for (let i = 0; i < parsed.length; i++) {
      const cols = parsed[i];

      const row = body.createEl("tr");

      for (let j = 0; j < cols.length; j++) {
        row.createEl("td", { text: cols[j] });
      }
    }
  });
}