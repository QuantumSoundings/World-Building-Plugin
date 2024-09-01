import { CharacterNote } from "src/world/notes/characterNotes";
import { HeaderRC } from "./headerRC";
import { CharacterRC } from "./characterRC";
import { NationNote } from "src/world/notes/nationNote";
import { NationRC } from "./nationRC";
import { SettlementNote } from "src/world/notes/settlementNote";
import { SettlementRC } from "./settlementRC";

export const WorldEngineRC = (props) => {
  const { note, app, hoverParent } = props;

  let content = null;
  if (note !== undefined) {
    if (note instanceof CharacterNote) {
      content = <CharacterRC note={note} />;
    } else if (note instanceof NationNote) {
      content = <NationRC note={note} />;
    } else if (note instanceof SettlementNote) {
      content = <SettlementRC note={note} />;
    }
  }

  return (
    <div className="selectable-text">
      <HeaderRC note={note} app={app} hoverParent={hoverParent} paused={props.paused} />
      {content}
    </div>
  );
};
