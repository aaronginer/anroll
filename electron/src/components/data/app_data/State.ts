import { CommandQueue } from "../../../util/CommandQueue"
import { mapExponential } from "../../../util/Util"
import { COMMAND_QUEUE_CAPACITY, CROP_BOTTOM, CROP_TOP, D_FACTOR, ENFORCE_ISOTROPY, ERROR_OVERLAY_OPACITY, ERROR_OVERLAY_TARGET, ERRORS_ACTIVE, ERRORS_QUALITY, GRID_ACTIVE, GRID_THICKNESS, GRID_UNIFORM, GRID_X, GRID_Y, IMAGE_ACTIVE, IMAGE_ROTATION, INTERPOLATION_FACTOR, PLOT_IFCURVE, PLOT_INTERP, PREVIEW_SCALE, RADIUS_MODIFIER, SPLINE_SMOOTHING } from "./Constants"
import * as THREE from 'three';

interface ModelSettings {
    interpolationFactor: number,
    dFactor: number,
    radiusModifier: number,
    enforceIsotropy: boolean
};

interface ImageSettings {
    imageActive: boolean,
    imageRotation: number,
    cropTop: number,
    cropBottom: number,
    previewScale: number
}

interface GridSettings {
    gridActive: boolean,
    gridUniform: boolean,
    gridThickness: number,
    gridX: number,
    gridY: number
}

interface ErrorSettings {
    errorsQuality: number,
    errorsActive: boolean
}

interface PlotSettings {
    plotInterp: boolean,
    plotIFCurve: boolean
}

interface AdvancedSettings {
    splineSmoothingDisplay: number,
    splineSmoothing: number,
    commandQueueCapacity: number,
}

interface WebState {
    modelLoaded: boolean,
    canSendCommand: boolean,
    commandQueue: CommandQueue<string>,
    commandQueueSize: number,
    previewImageData: ImageData | null,
    mainImageData: ImageData | null,
    errorImageData1: ImageData | null,
    errorImageData2: ImageData | null,
    errorImageData3: ImageData | null,
    errorImageData4: ImageData | null,
    errorOverlayTarget: string,
    errorOverlayOpacity: number,
    plotInterpData: any,
    plotIFCurveData: any,
    mainLayout: "vertical" | "horizontal",
    exportIncludeErrorMaps: boolean,
    // project loading
    readyToLoad: boolean
    loadType: "singlePhoto" | "maskAndCylindrical" | "model",
    model: THREE.Mesh | null,
    modelMaterial: THREE.Material | null,
    centralAxisSet: boolean,
    updateCentralAxisCallback: ()=>void,
    adjustingModel: boolean,
    maskImageUrl: string,
    unrollingImageUrl: string,
}

export interface AppState {
    modelSettings: ModelSettings
    imageSettings: ImageSettings,
    gridSettings: GridSettings,
    errorSettings: ErrorSettings,
    plotSettings: PlotSettings,
    advancedSettings: AdvancedSettings,
    webState: WebState
};

export const initModelSettings: ModelSettings = {
    interpolationFactor: INTERPOLATION_FACTOR,
    dFactor: D_FACTOR,
    radiusModifier: RADIUS_MODIFIER,
    enforceIsotropy: ENFORCE_ISOTROPY
};

export const initImageSettings: ImageSettings = {
    imageActive: IMAGE_ACTIVE,
    imageRotation: IMAGE_ROTATION,
    cropTop: CROP_TOP,
    cropBottom: CROP_BOTTOM,
    previewScale: PREVIEW_SCALE
};

export const initGridSettings: GridSettings = {
    gridActive: GRID_ACTIVE,
    gridUniform: GRID_UNIFORM,
    gridThickness: GRID_THICKNESS,
    gridX: GRID_X,
    gridY: GRID_Y
};

export const initErrorSettings: ErrorSettings = {
    errorsActive: ERRORS_ACTIVE,
    errorsQuality: ERRORS_QUALITY
};

export const initPlotSettings: PlotSettings = {
    plotInterp: PLOT_INTERP,
    plotIFCurve: PLOT_IFCURVE
}

export const initAdvancedSettings: AdvancedSettings = {
    splineSmoothingDisplay: SPLINE_SMOOTHING,
    splineSmoothing: mapExponential(SPLINE_SMOOTHING),
    commandQueueCapacity: COMMAND_QUEUE_CAPACITY
}

export const initWebState: WebState = {
    canSendCommand: true,
    modelLoaded: false,
    commandQueue: new CommandQueue<string>(COMMAND_QUEUE_CAPACITY),
    commandQueueSize: 0,
    previewImageData: null,
    mainImageData: null,
    errorImageData1: null,
    errorImageData2: null,
    errorImageData3: null,
    errorImageData4: null,
    errorOverlayTarget: ERROR_OVERLAY_TARGET,
    errorOverlayOpacity: ERROR_OVERLAY_OPACITY,
    plotInterpData: null,
    plotIFCurveData: null,
    mainLayout: "horizontal",
    exportIncludeErrorMaps: false,
    readyToLoad: false,
    loadType: "maskAndCylindrical",
    model: null,
    modelMaterial: null,
    centralAxisSet: false,
    updateCentralAxisCallback: ()=>{},
    adjustingModel: false,
    maskImageUrl: "",
    unrollingImageUrl: "",
}

export const initState: AppState = {
    modelSettings: initModelSettings,
    imageSettings: initImageSettings,
    gridSettings: initGridSettings,
    errorSettings: initErrorSettings,
    plotSettings: initPlotSettings,
    advancedSettings: initAdvancedSettings,
    webState: initWebState,
};