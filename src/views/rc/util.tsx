import { TFile, type App } from "obsidian";
import { createContext, useContext } from "react";
import { WORLD_ENGINE_HOVER_SOURCE } from "src/constants";
import { FormattedNumber, numberF } from "src/util/formatUtils";
import { WBNote } from "src/world/notes/wbNote";
import { randomUUID } from "crypto";
import type WorldBuildingPlugin from "src/main";

export const AppContext = createContext<App | undefined>(undefined);
export const useAppContext = (): App | undefined => {
  return useContext(AppContext);
};

export const WorldEngineViewContext = createContext<RContext | undefined>(undefined);
export const useWorldEngineViewContext = (): RContext | undefined => {
  return useContext(WorldEngineViewContext);
};

export interface RContext {
  note?: WBNote;
  file?: TFile;
  plugin: WorldBuildingPlugin;
  popoverParent: any;
  eventContext?: any;
}

const hoverPopoverHook = (e: any, file: TFile, plugin: WorldBuildingPlugin, popoverParent: any) => {
  plugin.app.workspace.trigger("hover-link", {
    event: e,
    source: WORLD_ENGINE_HOVER_SOURCE,
    hoverParent: popoverParent,
    targetEl: e.target,
    linktext: file.path,
  });
};

const clickLinkHook = async (file: TFile, plugin: WorldBuildingPlugin) => {
  await plugin.app.workspace.openLinkText(file.path, "", true);
};

const buildAnchorLink = (displayText: string, file: TFile, plugin: WorldBuildingPlugin, popoverParent: any) => {
  const onMouseOver = (e: any) => {
    return hoverPopoverHook(e, file, plugin, popoverParent);
  };
  const onClick = (_e: any) => {
    return clickLinkHook(file, plugin);
  };

  return (
    <a onMouseOver={onMouseOver} onClick={onClick}>
      {displayText}
    </a>
  );
};

export const buildNoteLink = (context: RContext, displayText?: string) => {
  if (context.note === undefined) return;
  const displayTextFinal = displayText === undefined ? context.note.name : displayText;
  context.file = context.note.file;
  return buildAnchorLink(displayTextFinal, context.file, context.plugin, context.popoverParent);
};

export const buildFileLink = (context: RContext, displayText?: string) => {
  if (context.file === undefined) return;
  const displayTextFinal = displayText === undefined ? context.file.name : displayText;
  return buildAnchorLink(displayTextFinal, context.file, context.plugin, context.popoverParent);
};

export const formatTable = (headers: string[], rows: any[][], context: RContext) => {
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
              } else if (cell instanceof TFile) {
                return <td key={randomUUID()}>{buildFileLink({ ...context, file: cell })}</td>;
              } else if (cell instanceof WBNote) {
                return <td key={randomUUID()}>{buildNoteLink({ ...context, note: cell })}</td>;
              }
              return <td key={randomUUID()}>{cell}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
