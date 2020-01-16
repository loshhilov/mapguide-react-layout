import { ILocalizedMessages } from "./msgdef";
import { DEG } from '../constants';

const STRINGS_EN: ILocalizedMessages = {
    "OK": "OK",
    "NONE": "NONE",
    "ERROR": "Error",
    "WARNING": "Warning",
    "INIT_WARNINGS_FOUND": "The following warnings were encountered loading the viewer",
    "INIT_WARNING_BING_API_KEY_REQD": "A Bing Maps API key is required. Sign up for an API key at http://www.bingmapsportal.com/",
    "INIT_WARNING_BING_UNKNOWN_LAYER": "Unknown bing maps layer type {type}. This layer was skipped",
    "INIT_WARNING_UNSUPPORTED_GOOGLE_MAPS": "This viewer does not support Google Maps base layers",
    "INIT_WARNING_NO_CONTEXT_MENU": "Could not find the context menu configuration. Right-clicking the map will show an empty context menu. If you are loading from a Flexible Layout, it must have a container named '{containerName}'",
    "LAYER_TRANSPARENCY": "Layer Transparency",
    "LAYER_ID_BASE": "Base Layers",
    "LAYER_ID_MG_BASE": "MapGuide Map",
    "LAYER_ID_MG_SEL_OVERLAY": "MapGuide Selection Overlay",
    "UNKNOWN_WIDGET": "This button references an unknown or unsupported widget: {widget}",
    "UNKNOWN_COMMAND_REFERENCE": "This button references an unknown command or unsupported: {command}",
    "INIT": "Initializing",
    "INIT_DESC": "Please wait while the viewer is loading required assets ...",
    "INIT_ERROR_TITLE": "An error occurred during startup",
    "INIT_ERROR_UNKNOWN_RESOURCE_TYPE": "<p>Unknown or unsupported resource type for resource: <strong>{resourceId}</strong></p>",
    "INIT_ERROR_MISSING_RESOURCE_PARAM": "<p>No <strong>resource</strong> parameter found. This viewer requires this parameter to be set in the query string and must refer to a valid Web Layout or Application Definition</p>",
    "INIT_ERROR_UNSUPPORTED_COORD_SYS": "<p>The Map Definition <strong>{mapDefinition}</strong>, uses a coordinate system that does not resolve to a valid EPSG code and cannot be loaded in this viewer</p><p>Solution:</p><ul><li>Change the coordinate system of this Map Definition to one that resolves to an EPSG code</li><li>Please note: There will be a small performance overhead for server-side re-projection as a result of doing this</li></ul>",
    "INIT_ERROR_UNREGISTERED_EPSG_CODE": "<p>The Map Definition <strong>{mapDefinition}</strong>, uses a coordinate system that resolves to a valid EPSG code (<strong>EPSG:{epsg}</strong>), but no projection for this EPSG code has been registered</p><p>Solution:</p><ol><li>Search for the matching proj4js definition at <a href='http://epsg.io/'>http://epsg.io/</a></li><li>Register this projection to the viewer before mounting it</li></ol>",
    "INIT_ERROR_EXPIRED_SESSION": "<p>The session id given has expired: <strong>{sessionId}</strong></p><p>Reload the viewer without the <strong>session</strong> parameter, or supply a valid session id for the <strong>session</strong> parameter</p>",
    "INIT_ERROR_RESOURCE_NOT_FOUND": "Attempted to load the following resource, but it was not found: <strong>{resourceId}</strong>",
    "INIT_ERROR_NO_CONNECTION": "<p>There is no connection between the MapGuide Web Tier and the MapGuide Server.</p><p>Possible causes:</p><ul><li>MapGuide Server is not running or is no longer responding</li><li>Internet connection problems</li></ul><p>Possible solutions:</p><ul><li>Restart the MapGuide Server Service</li><li>Contact your server administrator</li></ul>",
    "TPL_SIDEBAR_OPEN_TASKPANE": "Open Task Pane",
    "TPL_SIDEBAR_OPEN_LEGEND": "Open Legend",
    "TPL_SIDEBAR_OPEN_SELECTION_PANEL": "Open Selection Panel",
    "TPL_TITLE_TASKPANE": "Task Pane",
    "TPL_TITLE_LEGEND": "Legend",
    "TPL_TITLE_SELECTION_PANEL": "Selection",
    "TT_GO_HOME": "Go home",
    "TT_GO_BACK": "Go back",
    "TT_GO_FORWARD": "Go forward",
    "SESSION_EXPIRED": "Session Expired",
    "SESSION_EXPIRED_DETAILED": "Your current MapGuide session has expired",
    "SESSION_EXPIRED_AVAILABLE_ACTIONS": "Available Actions:",
    "SESSION_EXPIRED_RELOAD_VIEWER": "Reload the viewer",
    "ERR_UNREGISTERED_LAYOUT": "ERROR: No layout named ({layout}) registered",
    "ERR_UNREGISTERED_COMPONENT": "ERROR: No such registered component ({componentId}). Ensure the component has been registered in the component registry with an id of: {componentId}",
    "ERR_NO_COMPONENT_ID": "No component id specified",
    "LOADING_MSG": "Loading ...",
    "MENU_TASKS": "Tasks",
    "NO_SELECTED_FEATURES": "No selected features",
    "FMT_SCALE_DISPLAY": "Scale - 1:{scale}",
    "FMT_SELECTION_COUNT": "Selected {total} features in {layerCount} layers",
    "DIGITIZE_POINT_PROMPT": "Click to finish and draw a point at this location<br/><br/>Press ESC to cancel",
    "DIGITIZE_LINE_PROMPT": "Click to set this position as the start.<br/>Click again to finish the line at this position<br/><br/>Press ESC to cancel",
    "DIGITIZE_LINESTRING_PROMPT": "Click to set this position as the start.<br/>Click again to add a vertex at this position.<br/>If you drew a vertex at the wrong spot, you can press {key} to undo.<br/>Hold SHIFT and drag while digitizing to draw in freehand mode<br/></br>Double click to finish<br/>Press ESC to cancel",
    "DIGITIZE_CIRCLE_PROMPT": "Click to set this position as the center.<br/>Move out to the desired radius and click again to finish<br/><br/>Press ESC to cancel",
    "DIGITIZE_RECT_PROMPT": "Click to set this position as one corner.<br/>Click again to finish and set this position as the other corner<br/><br/>Press ESC to cancel",
    "DIGITIZE_POLYGON_PROMPT": "Click to set this positon as the start.<br/>Click again to add a vertex at this position.<br/>If you drew a vertex at the wrong spot, you can press {key} to undo<br/>Hold SHIFT and drag while digitizing to draw in freehand mode<br/><br/>Double click to finish and close the polygon<br/>Press ESC to cancel",
    "MEASURE": "Measure",
    "MEASURE_SEGMENT": "Segment",
    "MEASURE_LENGTH": "Length",
    "MEASURE_SEGMENT_PART": "Segment {segment}",
    "MEASURE_TOTAL_AREA": "Total Area",
    "MEASURE_TOTAL_LENGTH": "Total Length",
    "MEASURING": "Measuring",
    "MEASURING_MESSAGE": "You are currently measuring",
    "MEASUREMENT": "Measurement",
    "MEASUREMENT_TYPE": "Measurement Type",
    "MEASUREMENT_TYPE_LENGTH": "Length (LineString)",
    "MEASUREMENT_TYPE_AREA": "Area (Polygon)",
    "MEASUREMENT_CLEAR": "Clear",
    "MEASUREMENT_CONTINUE_POLYGON": "Click to continue drawing the polygon. Double-click to finish.",
    "MEASUREMENT_CONTINUE_LINE": "Click to continue drawing the line. Double-click to finish.",
    "MEASUREMENT_START_DRAWING": "Click to start drawing",
    "MEASUREMENT_START": "Start",
    "MEASUREMENT_END": "End",
    "NAVIGATOR_PAN_EAST": "Pan East",
    "NAVIGATOR_PAN_WEST": "Pan West",
    "NAVIGATOR_PAN_SOUTH": "Pan South",
    "NAVIGATOR_PAN_NORTH": "Pan North",
    "NAVIGATOR_ZOOM_OUT": "Zoom Out",
    "NAVIGATOR_ZOOM_IN": "Zoom In",
    "FMT_NAVIGATOR_ZOOM_TO_SCALE": "Zoom to 1:{scale}",
    "EXTERNAL_BASE_LAYERS": "External Base Layers",
    "SELECTION_PROPERTY": "Property",
    "SELECTION_VALUE": "Value",
    "SELECTION_PREV_FEATURE": "Previous Feature",
    "SELECTION_NEXT_FEATURE": "Next Feature",
    "SELECTION_ZOOMTO_FEATURE": "Zoom to selected feature",
    "VIEWER_OPTIONS": "Viewer Options",
    "ABOUT": "About",
    "HELP": "Help",
    "QUICKPLOT_HEADER": "Quick Plot",
    "QUICKPLOT_TITLE": "Title",
    "QUICKPLOT_SUBTITLE": "Sub-Title",
    "QUICKPLOT_PAPER_SIZE": "Paper Size",
    "QUICKPLOT_ORIENTATION": "Orientation",
    "QUICKPLOT_ORIENTATION_P": "Portrait",
    "QUICKPLOT_ORIENTATION_L": "Landscape",
    "QUICKPLOT_SHOWELEMENTS": "Show Elements",
    "QUICKPLOT_SHOWLEGEND": "Show Legend",
    "QUICKPLOT_SHOWNORTHARROW": "Show North Arrow",
    "QUICKPLOT_SHOWCOORDINTES": "Show Coordinates",
    "QUICKPLOT_SHOWSCALEBAR": "Show Scalebar",
    "QUICKPLOT_SHOWDISCLAIMER": "Show Disclaimer",
    "QUICKPLOT_ADVANCED_OPTIONS": "Advanced Options",
    "QUICKPLOT_SCALING": "Scale",
    "QUICKPLOT_DPI": "DPI",
    "QUICKPLOT_BOX_INFO": "Quick Plot Map Capture box is active. Map rotation is disabled while box is active",
    "QUICKPLOT_BOX_ROTATION": "Capture Box Rotation",
    "QUICKPLOT_GENERATE": "Generate Plot",
    "QUICKPLOT_COMMERCIAL_LAYER_WARNING": "Quick Plot will NOT include any visible commercial map layers",
    "FEATURE_TOOLTIPS": "Feature Tooltips",
    "MANUAL_FEATURE_TOOLTIPS": "Manual Feature Tooltips (click to show)",
    "GEOLOCATION_SUCCESS": "Zoomed to your position",
    "GEOLOCATION_WARN_OUTSIDE_MAP": "Zoomed to your position. It is outside the extents of your map",
    "GEOLOCATION_ERROR": "Geolocation error: {message} ({code})",
    "TASK_PANE_RESIZING": "Task Pane is resizing ...",
    "TASK_PANE_LOADING": "Loading",
    "TASK_PANE_LOADING_DESC": "Task Pane content is loading ...",
    "COORDTRACKER": "Coordinate Tracker",
    "COORDTRACKER_NO_PROJECTIONS": "You have no projections configured for this component",
    "MAP_SIZE_DISPLAY_UNITS": "Map view size display units",
    "ADD_MANAGE_LAYERS": "Add/Manage Layers",
    "ADD_LAYER": "Add Layer",
    "ADD_LAYER_TILED": "Add Tiled Layer",
    "MANAGE_LAYERS": "Manage Layers",
    "LAYER_TYPE": "Layer Type",
    "SELECT_LAYER_TYPE": "Select Layer Type ...",
    "ADD_WMS_LAYER_URL": "WMS Service URL",
    "ADD_WMS_LAYER_LOADING": "Loading",
    "ADD_WMS_LAYER_LOADING_DESC": "Loading WMS Capabilities",
    "ADD_WMS_LAYER_NO_LAYERS": "No WMS Layers",
    "WMS_VERSION": "WMS Version: {version}",
    "ADD_WFS_LAYER_URL": "WFS Service URL",
    "ADD_WFS_LAYER_LOADING": "Loading",
    "ADD_WFS_LAYER_LOADING_DESC": "Loading WFS Capabilities",
    "ADD_WFS_LAYER_NO_LAYERS": "No WFS Layers",
    "WFS_NO_LAYER_DESCRIPTION": "Enter a WFS Service URL above and click the button beside it to load available layers",
    "WFS_VERSION": "WFS Version: {version}",
    "OWS_SERVICE_NAME": "Name: {name}",
    "OWS_SERVICE_TITLE": "Title: {title}",
    "OWS_SERVICE_ABSTRACT": "Abstract: {abstract}",
    "WMS_LAYERS": "WMS Layers",
    "WFS_LAYERS": "WFS Layers",
    "OWS_LAYER_NAME": "Name: {name}",
    "OWS_LAYER_TITLE": "Title: {title}",
    "OWS_LAYER_ABSTRACT": "Abstract: {abstract}",
    "OWS_LAYER_CRS": "CRS: {crs}",
    "OWS_ADD_LAYER_PROMPT": "Click this layer to add it to the map",
    "ADDED_LAYER": "Added layer: {name}",
    "REMOVED_LAYER": "Removed layer: {name}",
    "ADD_WFS_LAYER": "Add WFS Layer",
    "SHARE_LINK_COPY_CLIPBOARD": "Copy Link",
    "SHARE_LINK_COPIED": "Link copied",
    "WMS_NO_LAYER_DESCRIPTION": "Enter a WMS Service URL above and click the button beside it to load available layers",
    "UNIT_UNKNOWN": "Unknown",
    "UNIT_INCHES": "Inches",
    "UNIT_FEET": "Feet",
    "UNIT_YARDS": "Yards",
    "UNIT_MILES": "Miles",
    "UNIT_NAUT_MILES": "Nautical Miles",
    "UNIT_MILLIMETERS": "Millimeters",
    "UNIT_CENTIMETERS": "Centimeters",
    "UNIT_METERS": "Meters",
    "UNIT_KILOMETERS": "Kilometers",
    "UNIT_DEGREES": "Degrees",
    "UNIT_DEC_DEGREES": "Decimal Degrees",
    "UNIT_DMS": "Degrees Minutes Seconds",
    "UNIT_PIXELS": "Pixels",
    "UNIT_ABBR_UNKNOWN": "unk",
    "UNIT_ABBR_INCHES": "in",
    "UNIT_ABBR_FEET": "ft",
    "UNIT_ABBR_YARDS": "yd",
    "UNIT_ABBR_MILES": "mi",
    "UNIT_ABBR_NAUT_MILES": "nm",
    "UNIT_ABBR_MILLIMETERS": "mm",
    "UNIT_ABBR_CENTIMETERS": "cm",
    "UNIT_ABBR_METERS": "m",
    "UNIT_ABBR_KILOMETERS": "km",
    "UNIT_ABBR_DEGREES": DEG,
    "UNIT_ABBR_DEC_DEGREES": DEG,
    "UNIT_ABBR_DMS": DEG,
    "UNIT_ABBR_PIXELS": "px",
    "UNIT_FMT_M": "{value} m",
    "UNIT_FMT_SQM": "{value} m<sup>2</sup>",
    "UNIT_FMT_SQKM": "{value} km<sup>2</sup>",
    "OL_ATTRIBUTION_TIP": "Attributions",
    "OL_OVERVIEWMAP_TIP": "Overview Map",
    "OL_RESET_ROTATION_TIP": "Reset Rotation",
    "FEATURE_TOOLTIP_URL_HELP_TEXT": "Click for more information",
    "SHARE_LINK_INCLUDE_SESSION": "Include Session ID",
    "WINDOW_RESIZING": "Resizing Window",
    "WINDOW_MOVING": "Moving Window",
    "OTHER_THEME_RULE_COUNT": "... ({count} other theme rules)",
    "LEGEND_FILTER_LAYERS": "Filter/search for layers or groups",
    "ADD_LAYER_KIND_PROMPT": "What kind of layer do you want to add?",
    "LAYER_KIND_FILE": "A local file-based layer",
    "LAYER_KIND_URL": "A remote url-based layer",
    "ADD_FILE": "Add Local File",
    "ADD_FILE_INSTRUCTIONS": "Click here to choose a file or drag and drop a file here to view it locally on the map (it won't be saved or uploaded to the internet)",
    "FMT_UPLOADED_FILE": "(size: {size} bytes, type: {type})",
    "ADD_LOCAL_FILE_LAYER_FAILURE_NOT_TEXT": "Could not read text content from this file",
    "ADD_LOCAL_FILE_LAYER_FAILURE": "Failed to load file as layer. It is probably an unsupported file format",
    "WMS_UNSUPPORTED_VERSION": "Unsupported WMS version: {version}",
    "NO_EXTERNAL_LAYERS": "No Layers",
    "NO_EXTERNAL_LAYERS_DESC": "Add layers via the {tabName} tab above",
    "LAYER_OPACITY": "Opacity",
    "LAYER_NAME_EXISTS": "A layer named {name} already exists",
    "LAYER_MANAGER_TT_MOVE_UP": "Move this layer up the draw order",
    "LAYER_MANAGER_TT_MOVE_DOWN": "Move this layer down the draw order",
    "LAYER_MANAGER_TT_ZOOM_EXTENTS": "Zoom to the extents of this layer",
    "LAYER_MANAGER_TT_REMOVE": "Remove this layer",
    "LAYER_MANAGER_TT_EDIT_STYLE": "Edit style",
    "LAYER_MANAGER_TT_MORE_OPTIONS": "Show more layer options",
    "CANCEL": "Cancel",
    "UNKNOWN_FILE_TYPE": "Unknown",
    "WMS_SERVICE_INFO": "WMS Service Info",
    "WFS_SERVICE_INFO": "WFS Service Info",
    "WMS_AVAILABLE_LAYERS": "Available WMS Layers",
    "WFS_AVAILABLE_LAYERS": "Available WFS Layers",
    "ADD_LAYER_WITH_WMS_STYLE": "Add layer ({style})",
    "ADD_LAYER_WITH_WMS_STYLE_TILED": "Add tiled layer ({style})",
    "WMS_LEGEND": "WMS Legend",
    "VSED_NO_STYLES_TITLE": "No Styles",
    "VSED_NO_STYLES_DESC": "This editor is not configured to edit any styles",
    "VECTOR_LAYER_STYLE": "Vector Layer Style",
    "VSED_PT_FILL_COLOR": "Point Fill Color",
    "VSED_PT_FILL_COLOR_ALPHA": "Point Fill Color Alpha",
    "VSED_PT_RADIUS": "Point Radius",
    "VSED_PT_OUTLINE_COLOR": "Point Outline Color",
    "VSED_PT_OUTLINE_COLOR_ALPHA": "Point Outline Color Alpha",
    "VSED_PT_OUTLINE_WIDTH": "Point Outline Thickness",
    "VSED_LN_OUTLINE_COLOR": "Line Color",
    "VSED_LN_OUTLINE_COLOR_ALPHA": "Line Color Alpha",
    "VSED_LN_OUTLINE_THICKNESS": "Line Thickness",
    "VSED_PL_FILL_COLOR": "Fill Color",
    "VSED_PL_FILL_COLOR_ALPHA": "Fill Color Alpha",
    "VSED_PL_OUTLINE_COLOR": "Outline Color",
    "VSED_PL_OUTLINE_COLOR_ALPHA": "Outline Color Alpha",
    "VSED_PL_OUTLINE_THICKNESS": "Outline Thickness",
    "VSED_TAB_POINT": "Point",
    "VSED_TAB_LINE": "Line",
    "VSED_TAB_POLY": "Polygon",
    "ADD_LAYER_PROJECTION": "Projection of this layer",
    "ADDING_LAYER_ERROR": "Error adding layer",
    "LOADING_LAYER": "Loading layer: {name}",
    "ACTION_CLOSE": "Close",
    "MORE_LAYER_OPTIONS": "More Layer Options"
};

export default STRINGS_EN;