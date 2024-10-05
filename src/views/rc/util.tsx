import { getLinkpath, type App } from "obsidian";
import { createContext, useContext } from "react";
import { WORLD_ENGINE_HOVER_SOURCE } from "src/constants";
import { FormattedNumber, numberF } from "src/util/formatUtils";
import type { WorldEngineView } from "../worldEngineView";
import type { WBNote } from "src/world/notes/wbNote";
import { randomUUID } from "crypto";
import { FileUtils } from "src/util/fileUtils";
import type WorldBuildingPlugin from "src/main";

export const AppContext = createContext<App | undefined>(undefined);
export const useAppContext = (): App | undefined => {
  return useContext(AppContext);
};

export const WorldEngineViewContext = createContext<WorldEngineView | undefined>(undefined);
export const useWorldEngineViewContext = (): WorldEngineView | undefined => {
  return useContext(WorldEngineViewContext);
};

export interface RCUtilContext {
  note?: WBNote;
  plugin?: WorldBuildingPlugin;
  app?: App;
  popoverParent?: any;
  eventContext?: any;
}

const hoverPopoverHook = (e, context: RCUtilContext) => {
  if (context === undefined) return;
  if (context.note === undefined) return;
  if (context.app === undefined) return;
  if (context.popoverParent === undefined) return;
  const note = context.note;
  const app = context.app;
  const popoverParent = context.popoverParent;

  app.workspace.trigger("hover-link", {
    event: e,
    source: WORLD_ENGINE_HOVER_SOURCE,
    hoverParent: popoverParent,
    targetEl: e.target,
    linktext: note.file.path,
  });
};

const clickLinkHook = async (context: RCUtilContext) => {
  if (context === undefined) return;
  if (context.note === undefined) return;
  if (context.app === undefined) return;
  await context.app.workspace.openLinkText(context.note.file.path, "", true);
};

export enum LinkElement {
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6",
  P = "p",
  DIV = "div",
  NONE = "none",
}

const buildAnchorLink = (displayText: string, context: RCUtilContext) => {
  const onMouseOver = (e) => {
    return hoverPopoverHook(e, context);
  };
  const onClick = (e) => {
    return clickLinkHook(context);
  };

  return (
    <a onMouseOver={onMouseOver} onClick={onClick}>
      {displayText}
    </a>
  );
};

export const buildLink = (linkType: LinkElement, context: RCUtilContext, displayText?: string) => {
  if (context.note === undefined) return;
  const displayTextFinal = displayText === undefined ? context.note.name : displayText;
  if (linkType === LinkElement.H2) {
    return <h2>{buildAnchorLink(displayTextFinal, context)}</h2>;
  } else if (linkType === LinkElement.H3) {
    return <h3>{buildAnchorLink(displayTextFinal, context)}</h3>;
  } else if (linkType === LinkElement.H4) {
    return <h4>{buildAnchorLink(displayTextFinal, context)}</h4>;
  } else if (linkType === LinkElement.H5) {
    return <h5>{buildAnchorLink(displayTextFinal, context)}</h5>;
  } else if (linkType === LinkElement.H6) {
    return <h6>{buildAnchorLink(displayTextFinal, context)}</h6>;
  } else if (linkType === LinkElement.P) {
    return <p>{buildAnchorLink(displayTextFinal, context)}</p>;
  } else if (linkType === LinkElement.DIV) {
    return <div>{buildAnchorLink(displayTextFinal, context)}</div>;
  } else if (linkType === LinkElement.NONE) {
    return buildAnchorLink(displayTextFinal, context);
  }
};

export const attemptLink = async (linkText: string, linkType: LinkElement, context: RCUtilContext) => {
  const parsedLinkText = getLinkpath(FileUtils.parseBracketLink(linkText));
  const note = await context.plugin?.worldEngine.getWBNoteByName(parsedLinkText);
  if (note === undefined) {
    return linkText;
  }
  return buildLink(linkType, { ...context, note: note });
};

export const formatTable = (headers: string[], rows: any[][]) => {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={randomUUID()}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={randomUUID()}>
            {row.map((cell) => {
              if (typeof cell === "number" || cell instanceof FormattedNumber) {
                const formatted = numberF(cell);
                return <td key={randomUUID()}>{formatted}</td>;
              }
              return <td key={randomUUID()}>{cell}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
