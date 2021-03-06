import { Client } from "../api/client";
import { ReduxDispatch, Dictionary, IMapView, CommandTarget, ActiveMapTool } from "../api/common";
import { RuntimeMapFeatureFlags } from "../api/request-builder";
import { registerCommand, DefaultCommands } from "../api/registry/command";
import {
    WebLayout,
    CommandDef,
    isBasicCommand,
    isTargetedCommand,
    isSeparatorItem,
    isFlyoutItem,
    isCommandItem,
    isInvokeURLCommand,
    isSearchCommand,
    UIItem
} from "../api/contracts/weblayout";
import {
    ApplicationDefinition,
    Widget,
    UIWidget,
    MapConfiguration,
    ContainerItem
} from "../api/contracts/fusion";
import {
    IExternalBaseLayer,
    ReduxThunkedAction,
    IMapViewer
} from "../api/common";
import { strEndsWith, strReplaceAll } from "../utils/string";
import { IView } from "../api/contracts/common";
import { RuntimeMap } from "../api/contracts/runtime-map";
import { tr } from "../api/i18n";
import { MgError } from "../api/error";
import * as shortid from "shortid";
import { registerStringBundle, DEFAULT_LOCALE } from "../api/i18n";
import { assertNever } from "../utils/never";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { makeUnique } from "../utils/array";
import { ensureParameters } from "../utils/url";
import { strIsNullOrEmpty } from "../utils/string";
import { convertWidget, isFlyoutSpec, ToolbarConf, PreparedSubMenuSet } from '../api/registry/command-spec';
import {
    IFlyoutSpec,
    ISeparatorSpec,
    IUnknownCommandSpec,
    ICommandSpec
} from "../api/registry/command-spec";
import { MapInfo, IInitAppActionPayload, IAcknowledgeStartupWarningsAction, IRestoredSelectionSets } from './defs';
import { ActionType } from '../constants/actions';
import { getSelectionSet, clearSessionStore } from '../api/session-store';
import { resolveProjectionFromEpsgIoAsync } from '../api/registry/projections';
import { WEBLAYOUT_CONTEXTMENU, WEBLAYOUT_TASKMENU, WEBLAYOUT_TOOLBAR, SPRITE_INVOKE_URL, SPRITE_INVOKE_SCRIPT } from '../constants';
import { info, debug, warn } from '../utils/logger';
import { getViewer } from '../api/runtime';

function tryTranslateImageUrlToSpriteClass(imageUrl: string): string | undefined {
    switch (imageUrl) {
        case "../stdicons/icon_invokeurl.gif":
            return SPRITE_INVOKE_URL;
        case "../stdicons/icon_invokescript.gif":
            return SPRITE_INVOKE_SCRIPT;
    }
}

function isUIWidget(widget: any): widget is UIWidget {
    return widget.WidgetType === "UiWidgetType";
}

function convertFlexLayoutUIItems(items: ContainerItem[], widgetsByKey: Dictionary<Widget>, locale: string, noToolbarLabels = false): (IFlyoutSpec | ISeparatorSpec | IUnknownCommandSpec | ICommandSpec)[] {
    const converted = items.map(item => {
        switch (item.Function) {
            case "Widget":
                {
                    const widget = widgetsByKey[item.Widget];
                    if (widget && isUIWidget(widget)) {
                        return convertWidget(widget, locale, noToolbarLabels);
                    }
                }
            case "Separator":
                return { isSeparator: true } as ISeparatorSpec;
            case "Flyout":
                return {
                    label: item.Label,
                    tooltip: item.Tooltip,
                    icon: item.ImageUrl,
                    spriteClass: item.ImageClass,
                    children: convertFlexLayoutUIItems(item.Item, widgetsByKey, locale)
                } as IFlyoutSpec;
            default:
                assertNever(item);
        }
        return null;
    })
    .filter(i => i != null)
    .map(i => i as (IFlyoutSpec | ISeparatorSpec | IUnknownCommandSpec | ICommandSpec));
    return converted;
}

function convertWebLayoutUIItems(items: UIItem[] | undefined, cmdsByKey: Dictionary<CommandDef>, locale: string, noToolbarLabels = true): (IFlyoutSpec | ISeparatorSpec | IUnknownCommandSpec | ICommandSpec)[] {
    const converted = (items || []).map(item => {
        if (isCommandItem(item)) {
            const cmdDef: CommandDef = cmdsByKey[item.Command];
            if (!cmdDef) {
                warn(`Invalid reference to command: ${item.Command}`);
                return { error: tr("UNKNOWN_COMMAND_REFERENCE", locale, { command: item.Command }) } as IUnknownCommandSpec;
            } else if (cmdDef.TargetViewer != "Dwf") {
                let icon: Partial<Pick<ICommandSpec, "icon" | "spriteClass">> = {};
                if (cmdDef.ImageURL) {
                    icon.spriteClass = tryTranslateImageUrlToSpriteClass(cmdDef.ImageURL);
                    if (!icon.spriteClass) {
                        icon.icon = cmdDef.ImageURL;
                    }
                }
                const commonParams: any = {};
                if (isTargetedCommand(cmdDef)) {
                    commonParams.Target = cmdDef.Target;
                    commonParams.TargetFrame = cmdDef.TargetFrame;
                }
                if (isBasicCommand(cmdDef)) {
                    let action: string = cmdDef.Action;
                    if (action == "ZoomRectangle") {
                        action = DefaultCommands.Zoom;
                    } else if (action == "FitToWindow") {
                        action = DefaultCommands.ZoomExtents;
                    } else if (action == "Refresh") {
                        action = DefaultCommands.RefreshMap;
                    }
                    return { command: action, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams, ...icon };
                } else {
                    switch (cmdDef["@xsi:type"]) {
                        case "ViewOptionsCommandType":
                            return { command: DefaultCommands.ViewerOptions, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        case "MeasureCommandType":
                            return { command: DefaultCommands.Measure, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        case "HelpCommandType":
                            return { command: DefaultCommands.Help, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        case "BufferCommandType":
                            return { command: DefaultCommands.Buffer, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        case "SelectWithinCommandType":
                            return { command: DefaultCommands.SelectWithin, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        case "GetPrintablePageCommandType":
                            return { command: DefaultCommands.QuickPlot, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams };
                        default:
                            return { command: cmdDef.Name, label: (noToolbarLabels ? null : cmdDef.Label), tooltip: cmdDef.Tooltip, parameters: commonParams, ...icon };
                    }
                }
            }
        } else if (isSeparatorItem(item)) {
            return { isSeparator: true } as ISeparatorSpec;
        } else if (isFlyoutItem(item)) {
            return {
                label: item.Label,
                tooltip: item.Tooltip,
                children: convertWebLayoutUIItems(item.SubItem, cmdsByKey, locale, false)
            } as IFlyoutSpec;
        } else {
            assertNever(item);
        }
        return null;
    })
    .filter(i => i != null)
    .map(i => i as (IFlyoutSpec | ISeparatorSpec | IUnknownCommandSpec | ICommandSpec));
    return converted;
}

function convertToCommandTarget(fusionCmdTarget: string): CommandTarget {
    //Treat empty/undefined target as new window
    if (strIsNullOrEmpty(fusionCmdTarget)) {
        return "NewWindow";
    }
    switch (fusionCmdTarget) {
        case "SearchWindow":
        case "InvokeUrlWindow":
            return "NewWindow";
        case "TaskPane":
            return "TaskPane";
        default:
            return "SpecifiedFrame";
    }
}

function prepareSubMenus(tbConf: Dictionary<ToolbarConf>): [PreparedSubMenuSet, boolean] {
    const prepared: PreparedSubMenuSet = {
        toolbars: {},
        flyouts: {}
    };
    let bFoundContextMenu = false;
    for (const key in tbConf) {
        if (key == WEBLAYOUT_CONTEXTMENU) {
            bFoundContextMenu = true;
        }

        //Special cases: Task pane and Context Menu. Transfer all to flyout
        if (key == WEBLAYOUT_TASKMENU || key == WEBLAYOUT_CONTEXTMENU) {
            const flyoutId = key;
            prepared.flyouts[flyoutId] = {
                children: tbConf[key].items
            }
        } else {
            prepared.toolbars[key] = {
                items: []
            };
            for (const item of tbConf[key].items) {
                //Special case: contextmenu is all inline
                if (isFlyoutSpec(item) && key != WEBLAYOUT_CONTEXTMENU) {
                    const flyoutId = `${item.label}_${shortid.generate()}`;
                    prepared.toolbars[key].items.push({
                        label: item.label,
                        tooltip: item.tooltip,
                        icon: item.icon,
                        spriteClass: item.spriteClass,
                        flyoutId: flyoutId
                    } as ICommandSpec);
                    prepared.flyouts[flyoutId] = {
                        children: item.children
                    }
                } else {
                    prepared.toolbars[key].items.push(item);
                }
            }
        }
    }
    return [prepared, bFoundContextMenu]
}

function getDesiredTargetMapName(mapDef: string) {
    const lastSlash = mapDef.lastIndexOf("/");
    const lastDot = mapDef.lastIndexOf(".");
    if (lastSlash >= 0 && lastDot >= 0 && lastDot > lastSlash) {
        return `${mapDef.substring(lastSlash + 1, lastDot)}`;
    } else {
        return `Map_${shortid.generate()}`;
    }
}

function setupMaps(appDef: ApplicationDefinition, mapsByName: Dictionary<RuntimeMap>, config: any, warnings: string[]): Dictionary<MapInfo> {
    const dict: Dictionary<MapInfo> = {};
    if (appDef.MapSet) {
        for (const mgGroup of appDef.MapSet.MapGroup) {
            let mapName: string | undefined;
            //Setup external layers
            const externalBaseLayers = [] as IExternalBaseLayer[];
            for (const map of mgGroup.Map) {
                if (map.Type === "MapGuide") {
                    //TODO: Based on the schema, different MG map groups could have different
                    //settings here and our redux tree should reflect that. Currently the first one "wins"
                    if (!config.selectionColor && map.Extension.SelectionColor != null) {
                        config.selectionColor = map.Extension.SelectionColor;
                    }
                    if (!config.imageFormat && map.Extension.ImageFormat != null) {
                        config.imageFormat = map.Extension.ImageFormat;
                    }
                    if (!config.selectionImageFormat && map.Extension.SelectionFormat != null) {
                        config.selectionImageFormat = map.Extension.SelectionFormat;
                    }

                    //NOTE: Although non-sensical, if the same map definition exists across multiple
                    //MapGroups, we might be matching the wrong one. We just assume such non-sensical
                    //AppDefs won't exist
                    for (const name in mapsByName) {
                        if (mapsByName[name].MapDefinition == map.Extension.ResourceId) {
                            mapName = name;
                            break;
                        }
                    }
                } else {
                    switch (map.Type) {
                        case "Google":
                            warnings.push(tr("INIT_WARNING_UNSUPPORTED_GOOGLE_MAPS", config.locale));
                            break;
                        case "VirtualEarth":
                            {
                                //HACK: De-arrayification of arbitrary extension elements
                                //is shallow (hence name/type is string[]). Do we bother to fix this?
                                const name = map.Extension.Options.name[0];
                                const type = map.Extension.Options.type[0];
                                const options: any = {};
                                let bAdd = true;
                                switch (type)
                                {
                                    case "Aerial":
                                    case "a":
                                        options.imagerySet = "Aerial";
                                        break;
                                    case "AerialWithLabels":
                                        options.imagerySet = "AerialWithLabels";
                                        break;
                                    case "Road":
                                        options.imagerySet = "Road";
                                        break;
                                    default:
                                        bAdd = false;
                                        warnings.push(tr("INIT_WARNING_BING_UNKNOWN_LAYER", config.locale, { type: type }));
                                        break;
                                }

                                if (appDef.Extension.BingMapKey) {
                                    options.key = appDef.Extension.BingMapKey;
                                } else {
                                    bAdd = false;
                                    warnings.push(tr("INIT_WARNING_BING_API_KEY_REQD", config.locale));
                                }

                                if (bAdd) {
                                    externalBaseLayers.push({
                                        name: name,
                                        kind: "BingMaps",
                                        options: options
                                    });
                                }
                            }
                            break;
                        case "OpenStreetMap":
                            {
                                //HACK: De-arrayification of arbitrary extension elements
                                //is shallow (hence name/type is string[]). Do we bother to fix this?
                                const name = map.Extension.Options.name[0];
                                const type = map.Extension.Options.type[0];
                                const options: any = {};
                                switch (type) {
                                    case "CycleMap":
                                        options.url = "http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png";
                                        break;
                                    case "TransportMap":
                                        options.url = "http://tile2.opencyclemap.org/transport/{z}/{x}/{y}.png";
                                        break;
                                }
                                externalBaseLayers.push({
                                    name: name,
                                    kind: "OSM",
                                    options: options
                                });
                            }
                            break;
                        case "Stamen":
                            {
                                //HACK: De-arrayification of arbitrary extension elements
                                //is shallow (hence name/type is string[]). Do we bother to fix this?
                                const name = map.Extension.Options.name[0];
                                const type = map.Extension.Options.type[0];
                                externalBaseLayers.push({
                                    name: name,
                                    kind: "Stamen",
                                    options: {
                                        layer: type
                                    }
                                });
                            }
                            break;
                        case "XYZ":
                            {
                                //HACK: De-arrayification of arbitrary extension elements
                                //is shallow (hence name/type is string[]). Do we bother to fix this?
                                const name = map.Extension.Options.name[0];
                                const type = map.Extension.Options.type[0];
                                //NOTE: From a fusion appdef, we're expecting placeholder tokens to be in ${this_format} instead of
                                //{this_format} as the primary consumer is the Fusion viewer that is based on OpenLayers 2
                                //As we're not using OL2, but OL4+ the expected format is {this_format}, so we need to convert these
                                //placeholder tokens
                                const urls = (map.Extension.Options.urls || []).map((s: string) => strReplaceAll(s, "${", "{"));
                                externalBaseLayers.push({
                                    name: name,
                                    kind: "XYZ",
                                    options: {
                                        layer: type,
                                        urls: urls
                                    }
                                });
                            }
                            break;
                    }
                }
            }
            //First come, first served
            if (externalBaseLayers.length > 0) {
                externalBaseLayers[0].visible = true;
            }

            //Setup initial view
            let initialView: IView | undefined;
            if (mgGroup.InitialView) {
                initialView = {
                    x: mgGroup.InitialView.CenterX,
                    y: mgGroup.InitialView.CenterY,
                    scale: mgGroup.InitialView.Scale
                };
            }

            if (mapName) {
                dict[mapName] = {
                    mapGroupId: mgGroup["@id"],
                    map: mapsByName[mapName],
                    initialView: initialView,
                    externalBaseLayers: externalBaseLayers
                };
            }
        }
    }
    return dict;
}


function getMapGuideConfiguration(appDef: ApplicationDefinition): [string, MapConfiguration][] {
    const configs = [] as [string, MapConfiguration][];
    if (appDef.MapSet) {
        for (const mg of appDef.MapSet.MapGroup) {
            for (const map of mg.Map) {
                if (map.Type == "MapGuide") {
                    configs.push([mg["@id"], map]);
                }
            }
        }
    }
    return configs;
}

function getMapDefinitionsFromFlexLayout(appDef: ApplicationDefinition): MapToLoad[] {
    const configs = getMapGuideConfiguration(appDef);
    if (configs.length > 0) {
        return configs.map(c => ({ name: c[0], mapDef: c[1].Extension.ResourceId }));
    }
    throw new MgError("No Map Definition found in Application Definition");
}

function getExtraProjectionsFromFlexLayout(appDef: ApplicationDefinition): string[] {
    //The only widget we care about is the coordinate tracker
    const epsgs: string[] = [];
    for (const ws of appDef.WidgetSet) {
        for (const w of ws.Widget) {
            if (w.Type == "CoordinateTracker") {
                const ps = w.Extension.Projection || [];
                for (const p of ps) {
                    epsgs.push(p.split(':')[1]);
                }
            } else if (w.Type == "CursorPosition") {
                const dp = w.Extension.DisplayProjection;
                if (dp) {
                    epsgs.push(dp.split(':')[1]);
                }
            }
        }
    }
    return makeUnique(epsgs);
}

function processAndDispatchInitError(error: Error, includeStack: boolean, dispatch: ReduxDispatch, opts: IInitAsyncOptions): void {
    if (error.stack) {
        dispatch({
            type: ActionType.INIT_ERROR,
            payload: {
                error: {
                    message: error.message,
                    stack: (error.stack || "").split("\n")
                },
                includeStack: includeStack,
                options: opts
            }
        });
    } else {
        dispatch({
            type: ActionType.INIT_ERROR,
            payload: {
                error: {
                    message: error.message,
                    stack: []
                },
                includeStack: includeStack,
                options: opts
            }
        });
    }
}

export interface IInitAppLayout {
    locale: string;
    resourceId: string;
    externalBaseLayers?: IExternalBaseLayer[];
    session?: string;
    initialView?: IMapView;
    /**
     * 
     * @since 0.11
     * @type {string}
     * @memberof IInitAppLayout
     */
    initialActiveMap?: string;
    /**
     * 
     * @since 0.11
     * @type {string[]}
     * @memberof IInitAppLayout
     */
    initialShowLayers?: string[];
    /**
     * 
     * @since 0.11
     * @type {string[]}
     * @memberof IInitAppLayout
     */
    initialShowGroups?: string[];
    /**
     * 
     * @since 0.11
     * @type {string[]}
     * @memberof IInitAppLayout
     */
    initialHideLayers?: string[];
    /**
     * 
     * @since 0.11
     * @type {string[]}
     * @memberof IInitAppLayout
     */
    initialHideGroups?: string[];
    onInit?: (viewer: IMapViewer) => void;
    /**
     * Sets whether feature tooltips should be initially enabled
     * 
     * @since 0.13
     */
    featureTooltipsEnabled?: boolean;
}

export interface IInitAsyncOptions extends IInitAppLayout {
    locale: string;
}

type MapToLoad = { name: string, mapDef: string };

async function tryDescribeRuntimeMapAsync(client: Client, mapName: string, session: string, mapDef: string) {
    try {
        const map = await client.describeRuntimeMap({
            mapname: mapName,
            requestedFeatures: RuntimeMapFeatureFlags.LayerFeatureSources | RuntimeMapFeatureFlags.LayerIcons | RuntimeMapFeatureFlags.LayersAndGroups,
            session: session
        });
        return map;
    } catch (e) {
        if (e.message === "MgResourceNotFoundException") {
            const map = await client.createRuntimeMap({
                mapDefinition: mapDef,
                requestedFeatures: RuntimeMapFeatureFlags.LayerFeatureSources | RuntimeMapFeatureFlags.LayerIcons | RuntimeMapFeatureFlags.LayersAndGroups,
                session: session,
                targetMapName: mapName
            });
            return map;
        }
        throw e;
    }
}

async function createRuntimeMapsAsync<TLayout>(client: Client, session: string, opts: IInitAsyncOptions, res: TLayout, mapDefSelector: (res: TLayout) => MapToLoad[], projectionSelector: (res: TLayout) => string[], sessionWasReused: boolean): Promise<[Dictionary<RuntimeMap>, string[]]> {
    const mapDefs = mapDefSelector(res);
    const mapPromises: Promise<RuntimeMap>[] = [];
    const warnings = [] as string[];
    for (const m of mapDefs) {
        //sessionWasReused is a hint whether to create a new runtime map, or recover the last runtime map state from the given map name
        if (sessionWasReused) {
            //FIXME: If the map state we're recovering has a selection, we need to re-init the selection client-side
            info(`Session ID re-used. Attempting recovery of map state of: ${m.name}`);
            mapPromises.push(tryDescribeRuntimeMapAsync(client, m.name, session, m.mapDef));
        } else {
            info(`Creating runtime map state (${m.name}) for: ${m.mapDef}`);
            mapPromises.push(client.createRuntimeMap({
                mapDefinition: m.mapDef,
                requestedFeatures: RuntimeMapFeatureFlags.LayerFeatureSources | RuntimeMapFeatureFlags.LayerIcons | RuntimeMapFeatureFlags.LayersAndGroups,
                session: session,
                targetMapName: m.name
            }));
        }
    }
    const maps = await Promise.all(mapPromises);
    const fetchEpsgs: { epsg: string, mapDef: string }[] = [];
    //All must be non-zero
    for (const m of maps) {
        const epsg = m.CoordinateSystem.EpsgCode;
        const mapDef = m.MapDefinition;
        if (epsg == "0") {
            throw new MgError(tr("INIT_ERROR_UNSUPPORTED_COORD_SYS", opts.locale || DEFAULT_LOCALE, { mapDefinition: mapDef }));
        }
        //Must be registered to proj4js if not 4326 or 3857
        if (!proj4.defs[`EPSG:${epsg}`]) {
            fetchEpsgs.push({ epsg: epsg, mapDef: mapDef });
        }
    }
    const extraEpsgs = projectionSelector(res);
    for (const e of extraEpsgs) {
        fetchEpsgs.push({ epsg: e, mapDef: "" });
    }
    const epsgs = await Promise.all(fetchEpsgs.map(f => resolveProjectionFromEpsgIoAsync(f.epsg, opts.locale, f.mapDef)));

    //Previously, we register proj4 with OpenLayers on the bootstrap phase way before this init
    //process is started. This no longer works for OL6 where it doesn't seem to pick up the extra
    //projections we've registered with proj4 after linking proj4 to OpenLayers. So that registration
    //step has been relocated here, after all the custom projections have been fetched and registered
    //with proj4
    debug(`Register proj4 with OpenLayers`);
    register(proj4);

    //Build the Dictionary<RuntimeMap> from loaded maps
    const mapsByName: Dictionary<RuntimeMap> = {};
    for (const map of maps) {
        mapsByName[map.Name] = map;
    }
    return [mapsByName, warnings];
}

async function initFromWebLayoutAsync(webLayout: WebLayout, opts: IInitAsyncOptions, session: string, client: Client, sessionWasReused: boolean): Promise<IInitAppActionPayload> {
    const [mapsByName, warnings] = await createRuntimeMapsAsync(client, session, opts, webLayout, wl => [ { name: getDesiredTargetMapName(wl.Map.ResourceId), mapDef: wl.Map.ResourceId } ], () => [], sessionWasReused);
    const cmdsByKey: any = {};
    //Register any InvokeURL and Search commands
    for (const cmd of webLayout.CommandSet.Command) {
        if (isInvokeURLCommand(cmd)) {
            registerCommand(cmd.Name, {
                url: cmd.URL,
                disableIfSelectionEmpty: cmd.DisableIfSelectionEmpty,
                target: cmd.Target,
                targetFrame: cmd.TargetFrame,
                parameters: (cmd.AdditionalParameter || []).map(p => {
                    return { name: p.Key, value: p.Value };
                }),
                title: cmd.Label
            });
        } else if (isSearchCommand(cmd)) {
            registerCommand(cmd.Name, {
                layer: cmd.Layer,
                prompt: cmd.Prompt,
                target: cmd.Target,
                targetFrame: cmd.TargetFrame,
                resultColumns: cmd.ResultColumns,
                filter: cmd.Filter,
                matchLimit: cmd.MatchLimit,
                title: cmd.Label
            });
        }
        cmdsByKey[cmd.Name] = cmd;
    }
    const mainToolbar = (webLayout.ToolBar.Visible
                        ? convertWebLayoutUIItems(webLayout.ToolBar.Button, cmdsByKey, opts.locale)
                        : []);
    const taskBar = (webLayout.TaskPane.TaskBar.Visible
                    ? convertWebLayoutUIItems(webLayout.TaskPane.TaskBar.MenuButton, cmdsByKey, opts.locale, false)
                    : []);
    const contextMenu = (webLayout.ContextMenu.Visible
                        ? convertWebLayoutUIItems(webLayout.ContextMenu.MenuItem, cmdsByKey, opts.locale, false)
                        : []);
    const config: any = {};
    if (webLayout.SelectionColor != null) {
        config.selectionColor = webLayout.SelectionColor;
    }
    if (webLayout.MapImageFormat != null) {
        config.imageFormat = webLayout.MapImageFormat;
    }
    if (webLayout.SelectionImageFormat != null) {
        config.selectionImageFormat = webLayout.SelectionImageFormat;
    }
    if (webLayout.PointSelectionBuffer != null) {
        config.pointSelectionBuffer = webLayout.PointSelectionBuffer;
    }
    let initialView: IView | null = null;
    if (webLayout.Map.InitialView != null) {
        initialView = {
            x: webLayout.Map.InitialView.CenterX,
            y: webLayout.Map.InitialView.CenterY,
            scale: webLayout.Map.InitialView.Scale
        };
    }

    if (webLayout.Title != "") {
        document.title = webLayout.Title || document.title;
    }

    const maps: any = {};
    let firstMapName = "";
    let firstSessionId = "";
    for (const mapName in mapsByName) {
        if (!firstMapName && !firstSessionId) {
            const map = mapsByName[mapName];
            firstMapName = map.Name;
            firstSessionId = map.SessionId;
            maps[firstMapName] = {
                mapGroupId: map.Name,
                map: map,
                externalBaseLayers: opts.externalBaseLayers,
                initialView: initialView
            };
            break;
        }
    }

    const menus: Dictionary<ToolbarConf> = {};
    menus[WEBLAYOUT_TOOLBAR] = {
        items: mainToolbar
    };
    menus[WEBLAYOUT_TASKMENU] = {
        items: taskBar
    };
    menus[WEBLAYOUT_CONTEXTMENU] = {
        items: contextMenu
    };
    
    const tb = prepareSubMenus(menus)[0];
    return {
        activeMapName: firstMapName,
        featureTooltipsEnabled: opts.featureTooltipsEnabled,
        initialUrl: ensureParameters(webLayout.TaskPane.InitialTask || "server/TaskPane.html", firstMapName, firstSessionId, opts.locale),
        initialTaskPaneWidth: webLayout.TaskPane.Width,
        initialInfoPaneWidth: webLayout.InformationPane.Width,
        maps: maps,
        locale: opts.locale,
        config: config,
        capabilities: {
            hasTaskPane: webLayout.TaskPane.Visible,
            hasTaskBar: webLayout.TaskPane.TaskBar.Visible,
            hasStatusBar: webLayout.StatusBar.Visible,
            hasNavigator: webLayout.ZoomControl.Visible,
            hasSelectionPanel: webLayout.InformationPane.Visible && webLayout.InformationPane.PropertiesVisible,
            hasLegend: webLayout.InformationPane.Visible && webLayout.InformationPane.LegendVisible,
            hasToolbar: webLayout.ToolBar.Visible,
            hasViewSize: webLayout.StatusBar.Visible
        },
        toolbars: tb,
        warnings: warnings,
        initialActiveTool: ActiveMapTool.Pan
    };
}

async function initFromAppDefAsync(appDef: ApplicationDefinition, opts: IInitAsyncOptions, session: string, client: Client, sessionWasReused: boolean): Promise<IInitAppActionPayload> {
    const [mapsByName, warnings] = await createRuntimeMapsAsync(client, session, opts, appDef, fl => getMapDefinitionsFromFlexLayout(fl), fl => getExtraProjectionsFromFlexLayout(fl), sessionWasReused);
    let initialTask: string;
    let taskPane: Widget|undefined;
    let viewSize: Widget|undefined;
    let hasLegend = false;
    let hasStatus = false;
    let hasNavigator = false;
    let hasSelectionPanel = false;
    let hasTaskBar = false;
    const config: any = {};
    const tbConf: Dictionary<ToolbarConf> = {};
    const widgetsByKey: Dictionary<Widget> = {};
    //Register any InvokeURL and Search commands. Also set capabilities along the way
    for (const widgetSet of appDef.WidgetSet) {
        for (const widget of widgetSet.Widget) {
            const cmd = widget.Extension;
            switch (widget.Type) {
                case "TaskPane":
                    taskPane = widget;
                    break;
                case "ViewSize":
                    viewSize = widget;
                    break;
                case "Legend":
                    hasLegend = true;
                    break;
                case "SelectionPanel":
                    hasSelectionPanel = true;
                    break;
                case "CursorPosition":
                case "SelectionInfo":
                    hasStatus = true;
                    break;
                case "Navigator":
                    hasNavigator = true;
                    break;
                case "Search":
                    registerCommand(widget.Name, {
                        layer: cmd.Layer,
                        prompt: cmd.Prompt,
                        resultColumns: cmd.ResultColumns,
                        filter: cmd.Filter,
                        matchLimit: cmd.MatchLimit,
                        title: (cmd.Title || (isUIWidget(widget) ? widget.Label : undefined)),
                        target: convertToCommandTarget(cmd.Target),
                        targetFrame: cmd.Target
                    });
                    break;
                case "InvokeURL":
                    registerCommand(widget.Name, {
                        url: cmd.Url,
                        disableIfSelectionEmpty: cmd.DisableIfSelectionEmpty,
                        target: convertToCommandTarget(cmd.Target),
                        targetFrame: cmd.Target,
                        parameters: (cmd.AdditionalParameter || []).map((p: any) => {
                            return { name: p.Key, value: p.Value };
                        }),
                        title: isUIWidget(widget) ? widget.Label : undefined
                    });
                    break;
            }
            widgetsByKey[widget.Name] = widget;
        }
    }
    //Now build toolbar layouts
    for (const widgetSet of appDef.WidgetSet) {
        for (const cont of widgetSet.Container) {
            let tbName = cont.Name;
            tbConf[tbName] = { items: convertFlexLayoutUIItems(cont.Item, widgetsByKey, opts.locale) };
        }
        for (const w of widgetSet.Widget) {
            if (w.Type == "CursorPosition") {
                config.coordinateProjection = w.Extension.DisplayProjection;
                config.coordinateDecimals = w.Extension.Precision;
                config.coordinateDisplayFormat = w.Extension.Template;
            }
        }
    }

    const maps = setupMaps(appDef, mapsByName, config, warnings);

    if (taskPane) {
        hasTaskBar = true; //Fusion flex layouts can't control the visiblity of this
        initialTask = taskPane.Extension.InitialTask || "server/TaskPane.html";
    } else {
        initialTask = "server/TaskPane.html";
    }

    if (appDef.Title) {
        document.title = appDef.Title || document.title;
    }

    let firstMapName = "";
    let firstSessionId = "";
    for (const mapName in mapsByName) {
        if (!firstMapName && !firstSessionId) {
            const map = mapsByName[mapName];
            firstMapName = map.Name;
            firstSessionId = map.SessionId;
            break;
        }
    }
    const [tb, bFoundContextMenu] = prepareSubMenus(tbConf);
    if (!bFoundContextMenu) {
        warnings.push(tr("INIT_WARNING_NO_CONTEXT_MENU", opts.locale, { containerName: WEBLAYOUT_CONTEXTMENU }));
    }
    return {
        activeMapName: firstMapName,
        initialUrl: ensureParameters(initialTask, firstMapName, firstSessionId, opts.locale),
        featureTooltipsEnabled: opts.featureTooltipsEnabled,
        locale: opts.locale,
        maps: maps,
        config: config,
        capabilities: {
            hasTaskPane: (taskPane != null),
            hasTaskBar: hasTaskBar,
            hasStatusBar: hasStatus,
            hasNavigator: hasNavigator,
            hasSelectionPanel: hasSelectionPanel,
            hasLegend: hasLegend,
            hasToolbar: (Object.keys(tbConf).length > 0),
            hasViewSize: (viewSize != null)
        },
        toolbars: tb,
        warnings: warnings,
        initialActiveTool: ActiveMapTool.Pan
    };
}

async function sessionAcquiredAsync(opts: IInitAsyncOptions, session: string, client: Client, sessionWasReused: boolean): Promise<IInitAppActionPayload> {
    if (!opts.resourceId) {
        throw new MgError(tr("INIT_ERROR_MISSING_RESOURCE_PARAM", opts.locale));
    } else if (strEndsWith(opts.resourceId, "WebLayout")) {
        const wl = await client.getResource<WebLayout>(opts.resourceId, { SESSION: session });
        return await initFromWebLayoutAsync(wl, opts, session, client, sessionWasReused);
    } else if (strEndsWith(opts.resourceId, "ApplicationDefinition")) {
        const fl = await client.getResource<ApplicationDefinition>(opts.resourceId, { SESSION: session });
        return await initFromAppDefAsync(fl, opts, session, client, sessionWasReused);
    } else {
        throw new MgError(tr("INIT_ERROR_UNKNOWN_RESOURCE_TYPE", opts.locale, { resourceId: opts.resourceId }));
    }
} 

async function initAsync(options: IInitAsyncOptions, dispatch: ReduxDispatch, client: Client): Promise<IInitAppActionPayload> {
    //English strings are baked into this bundle. For non-en locales, we assume a strings/{locale}.json
    //exists for us to fetch
    if (options.locale != DEFAULT_LOCALE) {
        const r = await fetch(`strings/${options.locale}.json`);
        if (r.ok) {
            const res = await r.json();
            registerStringBundle(options.locale, res);
            // Dispatch the SET_LOCALE as it is safe to change UI strings at this point
            dispatch({
                type: ActionType.SET_LOCALE,
                payload: options.locale
            });
            info(`Registered string bundle for locale: ${options.locale}`);
        } else {
            //TODO: Push warning to init error/warning reducer when we implement it
            warn(`Failed to register string bundle for locale: ${options.locale}`);
        }
    }
    let session = options.session;
    let sessionWasReused = false;
    if (!session) {
        session = await client.createSession("Anonymous", "");
    } else {
        info(`Re-using session: ${session}`);
        sessionWasReused = true;
    }
    const payload = await sessionAcquiredAsync(options, session, client, sessionWasReused);
    if (sessionWasReused) {
        let initSelections: IRestoredSelectionSets = {};
        for (const mapName in payload.maps) {
            const sset = await getSelectionSet(session, mapName);
            if (sset) {
                initSelections[mapName] = sset;
            }
        }
        payload.initialSelections = initSelections;
        try {
            //In the interest of being a responsible citizen, clean up all selection-related stuff from
            //session store
            await clearSessionStore();
        } catch (e) {

        }
    }
    return payload;
}

/**
 * Initializes the viewer
 *
 * @export
 * @param {IInitAppLayout} options
 * @returns {ReduxThunkedAction}
 */
export function initLayout(options: IInitAppLayout): ReduxThunkedAction {
    const opts: IInitAsyncOptions = { ...options };
    return (dispatch, getState) => {
        const args = getState().config;
        //TODO: Fetch and init the string bundle earlier if "locale" is present
        //so the English init messages are seen only for a blink if requesting a
        //non-english string bundle
        if (args.agentUri && args.agentKind) {
            const client = new Client(args.agentUri, args.agentKind);
            initAsync(opts, dispatch, client).then(payload => {
                let initPayload = payload;
                if (opts.initialView) {
                    initPayload.initialView = {
                        ...opts.initialView
                    };
                }
                if (opts.initialActiveMap) {
                    initPayload.activeMapName = opts.initialActiveMap;
                }
                initPayload.initialHideGroups = opts.initialHideGroups;
                initPayload.initialHideLayers = opts.initialHideLayers;
                initPayload.initialShowGroups = opts.initialShowGroups;
                initPayload.initialShowLayers = opts.initialShowLayers;
                initPayload.featureTooltipsEnabled = opts.featureTooltipsEnabled;
                dispatch({
                    type: ActionType.INIT_APP,
                    payload
                });
                if (options.onInit) {
                    const viewer = getViewer();
                    if (viewer) {
                        options.onInit(viewer);
                    }
                }
            }).catch(err => {
                processAndDispatchInitError(err, false, dispatch, opts);
            })
        }
    };
}

export function acknowledgeInitWarnings(): IAcknowledgeStartupWarningsAction {
    return {
        type: ActionType.INIT_ACKNOWLEDGE_WARNINGS
    }
}