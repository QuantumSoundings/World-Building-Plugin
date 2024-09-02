import { CharacterNote } from "src/world/notes/characterNotes";
import { HeaderRC } from "./headerRC";
import { CharacterRC } from "./characterRC";
import { NationNote } from "src/world/notes/nationNote";
import { NationRC } from "./nationRC";
import { SettlementNote } from "src/world/notes/settlementNote";
import { SettlementRC } from "./settlementRC";
import { useWorldEngineViewContext } from "./util";

export const WorldEngineRC = () => {
  const { note } = useWorldEngineViewContext();

  let content = null;
  if (note !== undefined) {
    if (note instanceof CharacterNote) {
      content = <CharacterRC />;
    } else if (note instanceof NationNote) {
      content = <NationRC />;
    } else if (note instanceof SettlementNote) {
      content = <SettlementRC />;
    }
  }

  return (
    <div className="selectable-text">
      <HeaderRC />
      {content}
    </div>
  );
};
