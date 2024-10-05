import { CharacterNote } from "src/world/notes/characterNotes";
import { HeaderRC } from "./headerRC";
import { CharacterRC } from "./characterRC";
import { NationNote } from "src/world/notes/nationNote";
import { NationRC } from "./nationRC";
import { SettlementNote } from "src/world/notes/settlementNote";
import { SettlementRC } from "./settlementRC";
import { useWorldEngineViewContext } from "./util";
import { useState } from "react";
import { ProseNote } from "src/world/notes/proseNote";
import { ProseRC } from "./proseRC";

export const WorldEngineRC = () => {
  const view = useWorldEngineViewContext();
  const note = view.note;

  const [force, forceUpdate] = useState(0);
  view.force = force;
  view.forceUpdate = forceUpdate;

  let content = null;
  if (note !== undefined) {
    if (note instanceof CharacterNote) {
      content = <CharacterRC />;
    } else if (note instanceof NationNote) {
      content = <NationRC />;
    } else if (note instanceof SettlementNote) {
      content = <SettlementRC />;
    } else if (note instanceof ProseNote) {
      content = <ProseRC />;
    }
  }

  return (
    <div className="selectable-text">
      <HeaderRC />
      {content}
    </div>
  );
};
