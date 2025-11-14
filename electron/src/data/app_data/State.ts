import { CommandQueue } from "../../util/CommandQueue"
import { mapExponential } from "../../util/Util"
import { VideoRecorder, type VideoRecordingProgress } from "../../util/VideoRecorder";
import { COMMAND_QUEUE_CAPACITY, CROP_BOTTOM, CROP_LEFT, CROP_RIGHT, CROP_TOP, D_FACTOR, D_FACTOR_RESTRICT, ENFORCE_ISOTROPY, ERROR_OVERLAY_OPACITY, ERROR_OVERLAY_TARGET, ERRORS_ACTIVE, ERRORS_QUALITY, ERRORS_SHOW_LEGEND, ERRORS_USE_GPU, EXPORT_INCLUDE_ERROR_MAPS, EXPORT_INCLUDE_MASK, EXPORT_INCLUDE_UNROLLING, GRID_ACTIVE, GRID_THICKNESS, GRID_UNIFORM, GRID_X, GRID_Y, IMAGE_ACTIVE, IMAGE_REGION_SELECTOR_ACTIVE, IMAGE_ROTATION, INTERPOLATION_FACTOR, IPA, OPTIMIZATION_ACTIVE, OPTIMIZATION_MAX_ITERATIONS, OPTIMIZE_DFACTOR, OPTIMIZE_INTERPOLATION_FACTOR, OPTIMIZE_RADIUS_MODIFIER, PLOT_IFCURVE, PLOT_INTERP, PORT, PREVIEW_SCALE, RADIUS_MODIFIER, RENDER_MAX_RESOLUTION, SPLINE_SMOOTHING, TILT, VERTICAL_SHIFT } from "./Constants"
import * as THREE from 'three';

interface ModelSettings {
    interpolationFactor: number,
    dFactor: number,
    dFactorRestrict: boolean,
    radiusModifier: number,
    enforceIsotropy: boolean
};

interface OptimizationSettings {
    optimizationActive: boolean,
    optimizationMaxIterations: number,
    error0Weight: number,
    error1Weight: number,
    error2Weight: number,
    error3Weight: number,
    optimizeInterpolationFactor: boolean,
    optimizeDFactor: boolean,
    optimizeRadiusModifier: boolean,
}

interface ImageSettings {
    imageActive: boolean,
    imageRotation: number,
    verticalShift: number,
    cropTop: number,
    cropBottom: number,
    cropRight: number,
    cropLeft: number,
    imageRegionSelectorActive: boolean, // whether the image editor is active
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
    errorsActive: boolean,
    errorsUseGPU: boolean,
    errorLegend: boolean
}

interface PlotSettings {
    plotInterp: boolean,
    plotIFCurve: boolean
}

interface AdvancedSettings {
    splineSmoothingDisplay: number,
    splineSmoothing: number,
    commandQueueCapacity: number,
    tilt: number,
}

// all of the things that are not model settings, but are saved in the project file
interface PersistentState {
    errorOverlayTarget: string,
    errorOverlayOpacity: number,
    exportIncludeErrorMaps: boolean,
    exportIncludeMask: boolean,
    exportIncludeUnrolling: boolean,
    exportPrefix: string,
    renderMaxResolution: number,
    mainLayout: "vertical" | "horizontal",
    maskImageUrl: string,
    maskImageUseLeftHalf: boolean,
    maskImageCenter: number,
    maskImageRotation: number,
    unrollingImageUrl: string,
}

// all of the things that are neither model settings, nor saved in the project file
interface DynamicState {
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
    errorImageData5: ImageData | null,
    plotInterpData: any,
    plotIFCurveData: any,
    // project loading
    loadType: "singlePhoto" | "maskAndCylindrical" | "model" | "projectFile",
    model: THREE.Mesh | null,
    modelMaterial: THREE.Material | null,
    centralAxisSet: boolean,
    adjustingModel: boolean,
    readyToLoad: boolean,
    projectFileLoaded: boolean,
    singlePhotoImageUrl: string,
    editMode: boolean,
    editImageUrl: string,
    socketAddress: string,
    recorder: VideoRecorder,
    recordingVideo: boolean,
    recordingProgress: VideoRecordingProgress,
    videoReady: boolean,
    unrollingWidth: number,
    unrollingBrightness: number,
}

export interface AppState {
    modelSettings: ModelSettings
    optimizationSettings: OptimizationSettings,
    imageSettings: ImageSettings,
    gridSettings: GridSettings,
    errorSettings: ErrorSettings,
    plotSettings: PlotSettings,
    advancedSettings: AdvancedSettings,
    persistentState: PersistentState,
    dynamicState: DynamicState
};

export interface Hooks {
    updateCentralAxisCallback: ()=>void,
    updateEditImageUrlCallback: (dataUrl: string) => void,
}

export const initModelSettings: ModelSettings = {
    interpolationFactor: INTERPOLATION_FACTOR,
    dFactor: D_FACTOR,
    dFactorRestrict: D_FACTOR_RESTRICT,
    radiusModifier: RADIUS_MODIFIER,
    enforceIsotropy: ENFORCE_ISOTROPY
};

export const initOptimizationSettings: OptimizationSettings = {
    optimizationActive: OPTIMIZATION_ACTIVE,
    optimizationMaxIterations: OPTIMIZATION_MAX_ITERATIONS,
    error0Weight: 1.0, // xerror
    error1Weight: 1.0, // yerror
    error2Weight: 1.0, // rerror
    error3Weight: 1.0, // aerror
    optimizeInterpolationFactor: OPTIMIZE_INTERPOLATION_FACTOR,
    optimizeDFactor: OPTIMIZE_DFACTOR,
    optimizeRadiusModifier: OPTIMIZE_RADIUS_MODIFIER,
};

export const initImageSettings: ImageSettings = {
    imageActive: IMAGE_ACTIVE,
    imageRotation: IMAGE_ROTATION,
    verticalShift: VERTICAL_SHIFT,
    cropTop: CROP_TOP,
    cropBottom: CROP_BOTTOM,
    cropRight: CROP_RIGHT,
    cropLeft: CROP_LEFT,
    imageRegionSelectorActive: IMAGE_REGION_SELECTOR_ACTIVE,
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
    errorsQuality: ERRORS_QUALITY,
    errorsUseGPU: ERRORS_USE_GPU,
    errorLegend: ERRORS_SHOW_LEGEND
};

export const initPlotSettings: PlotSettings = {
    plotInterp: PLOT_INTERP,
    plotIFCurve: PLOT_IFCURVE
}

export const initAdvancedSettings: AdvancedSettings = {
    splineSmoothingDisplay: SPLINE_SMOOTHING,
    splineSmoothing: mapExponential(SPLINE_SMOOTHING),
    commandQueueCapacity: COMMAND_QUEUE_CAPACITY,
    tilt: TILT,
}

export const initPersistentState: PersistentState = {
    errorOverlayTarget: ERROR_OVERLAY_TARGET,
    errorOverlayOpacity: ERROR_OVERLAY_OPACITY,
    exportIncludeErrorMaps: EXPORT_INCLUDE_ERROR_MAPS,
    exportIncludeMask: EXPORT_INCLUDE_MASK,
    exportIncludeUnrolling: EXPORT_INCLUDE_UNROLLING,
    exportPrefix: "",
    renderMaxResolution: RENDER_MAX_RESOLUTION,
    mainLayout: "horizontal",
    maskImageUrl: "",
    maskImageUseLeftHalf: false,
    maskImageCenter: 0.5,
    maskImageRotation: 0,
    unrollingImageUrl: "",
}

export const initDynamicState: DynamicState = {
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
    errorImageData5: null,
    plotInterpData: null,
    plotIFCurveData: null,
    readyToLoad: false,
    loadType: "maskAndCylindrical",
    model: null,
    modelMaterial: null,
    centralAxisSet: false,
    adjustingModel: false,
    projectFileLoaded: false,
    singlePhotoImageUrl: "",
    editMode: false,
    editImageUrl: "",
    socketAddress: IPA+":"+PORT,
    recorder: new VideoRecorder(24),
    recordingVideo: false,
    recordingProgress: {action: "", done: 0, of: 0},
    videoReady: false,
    unrollingWidth: 2000,
    unrollingBrightness: 1.0,
}

export const initState: AppState = {
    modelSettings: initModelSettings,
    optimizationSettings: initOptimizationSettings,
    imageSettings: initImageSettings,
    gridSettings: initGridSettings,
    errorSettings: initErrorSettings,
    plotSettings: initPlotSettings,
    advancedSettings: initAdvancedSettings,
    persistentState: initPersistentState,
    dynamicState: initDynamicState,
};

export const initHooks: Hooks = {
    updateCentralAxisCallback: ()=>{},
    updateEditImageUrlCallback: ()=>{},
};