import { CharacterNote } from "src/world/notes/characterNote";
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
import { OrganizationNote } from "src/world/notes/organizationNote";
import { OrganizationRC } from "./organizationRC";

export const WorldEngineRC = () => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;
  const note = context.note;

  const [force, forceUpdate] = useState(0);
  const view = context.plugin.getWorldEngineView();
  if (view === undefined) return <div>View is undefined</div>;
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
    } else if (note instanceof OrganizationNote) {
      content = <OrganizationRC />;
    }
  }

  return (
    <div className="selectable-text">
      <HeaderRC />
      {content}
    </div>
  );
};
