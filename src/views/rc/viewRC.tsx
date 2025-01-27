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
import type { WBNote } from "src/world/notes/wbNote";

interface WorldEngineRCProps {
  note: WBNote | undefined;
  paused: boolean;
}

export const WorldEngineRC = ({ note, paused }: WorldEngineRCProps) => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;

  const [currentDate, setCurrentDate] = useState(context.plugin.settings.currentDate);

  const dateHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    context.plugin.settings.currentDate = e.target.value;
    setCurrentDate(e.target.value);
    if (note !== undefined) {
      note.update();
    }
  };

  let content = null;
  if (note !== undefined) {
    if (note.error !== undefined) {
      content = <h3>{note.error}</h3>;
    } else if (note instanceof CharacterNote) {
      content = <CharacterRC note={note} />;
    } else if (note instanceof NationNote) {
      content = <NationRC note={note} />;
    } else if (note instanceof SettlementNote) {
      content = <SettlementRC note={note} />;
    } else if (note instanceof ProseNote) {
      content = <ProseRC note={note} />;
    } else if (note instanceof OrganizationNote) {
      content = <OrganizationRC note={note} />;
    }
  }

  return (
    <div className="selectable-text">
      <HeaderRC paused={paused} currentDate={currentDate} dateHandler={dateHandler} />
      {content}
    </div>
  );
};
