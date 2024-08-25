import { FormatUtils } from "src/util/formatUtils";
import type { CharacterNote } from "src/world/notes/characterNotes";

export function generateCharacterView(note: CharacterNote, el: HTMLElement): void {
  el.createEl("h2", { text: "Overview" });
  FormatUtils.markdownTableToHtml(el, generateOverviewTable(note));
}

function generateOverviewTable(note: CharacterNote) {
  let overviewTable = FormatUtils.formatRow(["Overview", "-"]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  overviewTable += FormatUtils.formatRow(["Name", note.name]);
  overviewTable += FormatUtils.formatRow(["Age", note.age]);
  overviewTable += FormatUtils.formatRow(["Species", note.species]);
  overviewTable += FormatUtils.formatRow(["Citizenship", note.citizenship]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  overviewTable += FormatUtils.formatRow(["Mana Cultivation", note.mana.cultivation]);
  overviewTable += FormatUtils.formatRow(["Mana Attributes", note.mana.attributes.join(", ")]);
  overviewTable += FormatUtils.formatRow(["Mana Blessing", note.mana.blessing]);
  overviewTable += FormatUtils.formatRow(["---", "---"]);
  overviewTable += FormatUtils.formatRow(["Physical Talent", note.talent.physical]);
  overviewTable += FormatUtils.formatRow(["Mana Talent", note.talent.mana]);
  overviewTable += FormatUtils.formatRow(["Blessing Talent", note.talent.blessing]);
  return overviewTable;
}
