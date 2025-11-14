import { imageDataToDataURL } from "../../util/ImageUtil";
import { blendImageData } from "../../util/Util";
import type { VideoRecordingProgress } from "../../util/VideoRecorder";
import { D_FACTOR_RESTRICT, ERROR_OVERLAY_OPACITY, ERROR_OVERLAY_TARGET, MAX_CROP } from "./Constants";
import { initAdvancedSettings, initErrorSettings, initGridSettings, initImageSettings, initModelSettings, initOptimizationSettings, initPlotSettings, initState, type AppState, type Hooks } from "./State";

export type ActionType =
    | "SET_INTERPOLATION_FACTOR"
    | "SET_D_FACTOR"
    | "SET_D_FACTOR_RESTRICT"
    | "SET_RADIUS_MODIFIER"
    | "SET_ENFORCE_ISOTROPY"
    | "SET_TILT"
    | "SET_OPTIMIZATION_ACTIVE"
    | "SET_OPTIMIZATION_MAX_ITERATIONS"
    | "SET_ERROR0_WEIGHT"
    | "SET_ERROR1_WEIGHT"
    | "SET_ERROR2_WEIGHT"
    | "SET_ERROR3_WEIGHT"
    | "SET_OPTIMIZE_INTERPOLATION_FACTOR"
    | "SET_OPTIMIZE_DFACTOR"
    | "SET_OPTIMIZE_RADIUS_MODIFIER"
    | "RESET_OPTIMIZATION_SETTINGS"
    | "RESET_MODEL_SETTINGS"
    | "SET_IMAGE_ACTIVE"
    | "SET_IMAGE_ROTATION"
    | "SET_VERTICAL_SHIFT"
    | "SET_CROP_TOP"
    | "SET_CROP_BOTTOM"
    | "SET_CROP_RIGHT"
    | "SET_CROP_LEFT"
    | "SET_IMAGE_REGION_SELECTOR_ACTIVE"
    | "SET_PREVIEW_SCALE"
    | "RESET_IMAGE_SETTINGS"
    | "SET_GRID_ACTIVE"
    | "SET_GRID_UNIFORM"
    | "SET_GRID_THICKNESS"
    | "SET_GRID_X"
    | "SET_GRID_Y"
    | "RESET_GRID_SETTINGS"
    | "SET_ERRORS_ACTIVE"
    | "SET_ERRORS_USE_GPU"
    | "SET_ERRORS_QUALITY"
    | "SET_ERROR_OVERLAY_TARGET"
    | "TOGGLE_ERROR_OVERLAY_TARGET"
    | "SET_ERROR_OVERLAY_OPACITY"
    | "SET_ERROR_LEGEND"
    | "RESET_ERROR_SETTINGS"
    | "SET_PLOT_INTERP"
    | "SET_PLOT_IFCURVE"
    | "SET_PLOT_INTERP_DATA"
    | "SET_PLOT_IFCURVE_DATA"
    | "RESET_PLOT_SETTINGS"
    | "SET_SPLINE_SMOOTHING_DISPLAY"
    | "SET_SPLINE_SMOOTHING"
    | "SET_COMMAND_QUEUE_CAPACITY"
    | "SET_COMMAND_QUEUE_SIZE"
    | "RESET_ADVANCED_SETTINGS"
    | "SET_MODEL_LOADED"
    | "SET_CAN_SEND_COMMAND"
    | "SET_MAIN_LAYOUT"
    | "TOGGLE_MAIN_LAYOUT"
    | "SET_EXPORT_INCLUDE_ERROR_MAPS"
    | "SET_EXPORT_PREFIX"
    | "RESET_STATE"
    | "LOAD_STATE"
    | "SET_READY_TO_LOAD"
    | "SET_LOAD_TYPE"
    | "SET_MODEL"
    | "SET_MODEL_MATERIAL"
    | "SET_CENTRAL_AXIS_SET"
    | "SET_ADJUSTING_MODEL"
    | "SET_MASK_IMAGE_URL"
    | "UPDATE_MASK_IMAGE_URL"
    | "SET_UNROLLING_IMAGE_URL"
    | "SET_MAIN_IMAGE_DATA"
    | "SET_ERROR_IMAGE_DATA1"
    | "SET_ERROR_IMAGE_DATA2"
    | "SET_ERROR_IMAGE_DATA3"
    | "SET_ERROR_IMAGE_DATA4"
    | "SET_IMAGE_DATA"
    | "SET_UPDATE_CENTRAL_AXIS_CALLBACK"
    | "SET_MASK_IMAGE_USE_LEFT_HALF"
    | "SET_MASK_IMAGE_CENTER"
    | "SET_MASK_IMAGE_ROTATION"
    | "RESET_MASK_SETTINGS"
    | "SET_SINGLE_PHOTO_IMAGE_URL"
    | "SET_EDIT_MODE"
    | "SET_EDIT_IMAGE_URL"
    | "SET_SOCKET_ADDRESS"
    | "SET_UPDATE_EDIT_IMAGE_URL_CALLBACK"
    | "SET_RECORDING_VIDEO"
    | "SET_RECORDING_PROGRESS"
    | "SET_VIDEO_READY"
    | "SET_UNROLLING_WIDTH"
    | "SET_UNROLLING_BRIGHTNESS"
    | "SET_RENDER_MAX_RESOLUTION"
    | "SET_EXPORT_INCLUDE_MASK"
    | "SET_EXPORT_INCLUDE_UNROLLING";

export type Action = {
    type: ActionType;
    payload?: any;
}

export function reducer(state: AppState, { type, payload = null }: Action): AppState {    
    function getErrorData(target: string): ImageData | null
    {
        let errorImageData = null;
        switch (target) {
            case "xerror":
                errorImageData = state.dynamicState.errorImageData1;
                break;
            case "yerror":
                errorImageData = state.dynamicState.errorImageData2;
                break;
            case "xyerror":
                errorImageData = state.dynamicState.errorImageData3;
                break;
            case "rerror":
                errorImageData = state.dynamicState.errorImageData4;
                break;
            case "aerror":
                errorImageData = state.dynamicState.errorImageData5;
                break;
        }
        return errorImageData;
    }

    switch (type) {
        // Model Settings
        case "SET_INTERPOLATION_FACTOR":
            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    interpolationFactor: payload as number,
                },
            };
        case "SET_D_FACTOR":
            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    dFactor: payload as number,
                },
            };
        case "SET_D_FACTOR_RESTRICT":   
            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    dFactorRestrict: payload as boolean,
                },
            };
        case "SET_RADIUS_MODIFIER":
            let rad_modifier = payload as number;
            if (rad_modifier > -1 && rad_modifier < 1)
            {
                rad_modifier = rad_modifier > state.modelSettings.radiusModifier ? 1 : -1; 
            }

            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    radiusModifier: rad_modifier as number,
                },
            };
        case "SET_ENFORCE_ISOTROPY":
            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    enforceIsotropy: payload as boolean,
                },
            };
        case "RESET_MODEL_SETTINGS":
            return {
                ...state,
                modelSettings: initModelSettings
            };
        case "SET_OPTIMIZATION_ACTIVE":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    optimizationActive: payload as boolean,
                },
            };
        case "SET_OPTIMIZATION_MAX_ITERATIONS":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    optimizationMaxIterations: payload as number,
                },
            };
        case "SET_ERROR0_WEIGHT":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    error0Weight: payload as number,
                },
            };
        case "SET_ERROR1_WEIGHT":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    error1Weight: payload as number,
                },
            };
        case "SET_ERROR2_WEIGHT":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    error2Weight: payload as number,
                },
            };
        case "SET_ERROR3_WEIGHT":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    error3Weight: payload as number,
                },
            };
        case "SET_OPTIMIZE_INTERPOLATION_FACTOR":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    optimizeInterpolationFactor: payload as boolean,
                },
            };
        case "SET_OPTIMIZE_DFACTOR":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    optimizeDFactor: payload as boolean,
                },
            };
        case "SET_OPTIMIZE_RADIUS_MODIFIER":
            return {
                ...state,
                optimizationSettings: {
                    ...state.optimizationSettings,
                    optimizeRadiusModifier: payload as boolean,
                },
            };
        case "RESET_OPTIMIZATION_SETTINGS":
            return {
                ...state,
                optimizationSettings: initOptimizationSettings
            };
        // Image Settings
        case "SET_IMAGE_ACTIVE":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    imageActive: payload as boolean,
                },  
            };
        case "SET_IMAGE_ROTATION":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    imageRotation: payload as number,
                },
            };
        case "SET_VERTICAL_SHIFT":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    verticalShift: payload as number,
                },
            };
        case "SET_CROP_TOP":
            const cropTop = Math.min(0.95, payload as number);
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropTop: cropTop,
                    cropBottom: cropTop + state.imageSettings.cropBottom > MAX_CROP ? MAX_CROP - cropTop : state.imageSettings.cropBottom
                },
            };
        case "SET_CROP_BOTTOM":
            const cropBottom = Math.min(0.95, payload as number);
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropBottom: cropBottom,
                    cropTop: cropBottom + state.imageSettings.cropTop > MAX_CROP ? MAX_CROP - cropBottom : state.imageSettings.cropTop
                },
            };
        case "SET_CROP_RIGHT":
            const cropRight = Math.min(0.95, payload as number);
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropRight: cropRight,
                    cropLeft: cropRight + state.imageSettings.cropLeft > MAX_CROP ? MAX_CROP - cropRight : state.imageSettings.cropLeft
                },
            };
        case "SET_CROP_LEFT":
            const cropLeft = Math.min(0.95, payload as number);
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropLeft: cropLeft,
                    cropRight: cropLeft + state.imageSettings.cropRight > MAX_CROP ? MAX_CROP - cropLeft : state.imageSettings.cropRight
                },
            };
        case "SET_IMAGE_REGION_SELECTOR_ACTIVE":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    imageRegionSelectorActive: payload as boolean,
                },
            };
        case "SET_PREVIEW_SCALE":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    previewScale: payload as number,
                },
            };
        case "RESET_IMAGE_SETTINGS":
            return {
                ...state,
                imageSettings: initImageSettings
            };
        // Grid Settings
        case "SET_GRID_ACTIVE":
            return {
                ...state,
                gridSettings: {
                    ...state.gridSettings,
                    gridActive: payload as boolean,
                },
            };
        case "SET_GRID_UNIFORM":
            return {
                ...state,
                gridSettings: {
                    ...state.gridSettings,
                    gridUniform: payload as boolean,
                },
            };
        case "SET_GRID_THICKNESS":
            return {
                ...state,
                gridSettings: {
                    ...state.gridSettings,
                    gridThickness: payload as number,
                },
            };
        case "SET_GRID_X":
            return {
                ...state,
                gridSettings: {
                    ...state.gridSettings,
                    gridX: payload as number,
                },
            };
        case "SET_GRID_Y":
            return {
                ...state,
                gridSettings: {
                    ...state.gridSettings,
                    gridY: payload as number,
                },
            };
        case "RESET_GRID_SETTINGS":
            return {
                ...state,
                gridSettings: initGridSettings
            };

        // Error Settings
        case "SET_ERRORS_ACTIVE":
            return {
                ...state,
                errorSettings: {
                    ...state.errorSettings,
                    errorsActive: payload as boolean,
                },
                persistentState: {
                    ...state.persistentState,
                    ...(payload == false && { errorOverlayTarget: ""})
                }
            };
        case "SET_ERRORS_QUALITY":
            return {
                ...state,
                errorSettings: {
                    ...state.errorSettings,
                    errorsQuality: payload as number,
                },
            };
        case "SET_ERRORS_USE_GPU":
            return {
                ...state,
                errorSettings: {
                    ...state.errorSettings,
                    errorsUseGPU: payload as boolean,
                }
            };
        case "RESET_ERROR_SETTINGS":
            return {
                ...state,
                errorSettings: initErrorSettings,
                persistentState: {
                    ...state.persistentState,
                    errorOverlayTarget: ERROR_OVERLAY_TARGET,
                    errorOverlayOpacity: ERROR_OVERLAY_OPACITY
                }
            };

        // Plot Settings
        case "SET_PLOT_INTERP":
            return {
                ...state,
                plotSettings: {
                    ...state.plotSettings,
                    plotInterp: payload as boolean,
                },
            };
        case "SET_PLOT_IFCURVE":
            return {
                ...state,
                plotSettings: {
                    ...state.plotSettings,
                    plotIFCurve: payload as boolean,
                },
            };
        case "RESET_PLOT_SETTINGS":
            return {
                ...state,
                plotSettings: initPlotSettings
            };

        // Advanced Settings
        case "SET_SPLINE_SMOOTHING_DISPLAY":
            return {
                ...state,
                advancedSettings: {
                    ...state.advancedSettings,
                    splineSmoothingDisplay: payload as number,
                },
            };
        case "SET_SPLINE_SMOOTHING":
            return {
                ...state,
                advancedSettings: {
                    ...state.advancedSettings,
                    splineSmoothing: payload as number,
                },
            };
        case "SET_COMMAND_QUEUE_CAPACITY":
            state.dynamicState.commandQueue.setCapacity(payload as number);
            return {
                ...state,
                advancedSettings: {
                    ...state.advancedSettings,
                    commandQueueCapacity: payload as number,
                },
            };
        case "SET_TILT":
            return {
                ...state,
                advancedSettings: {
                    ...state.advancedSettings,
                    tilt: payload as number,
                },
            };
        case "RESET_ADVANCED_SETTINGS":
            return {
                ...state,
                advancedSettings: initAdvancedSettings,
                persistentState: {
                    ...state.persistentState,
                    mainLayout: "horizontal",
                }
            };

        // Logic State
        case "SET_MODEL_LOADED":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    modelLoaded: payload as boolean,
                },
            };
        case "SET_CAN_SEND_COMMAND":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    canSendCommand: payload as boolean,
                },
            };
        case "SET_COMMAND_QUEUE_SIZE":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    commandQueueSize: payload as number,
                },
            };
        case "SET_PLOT_INTERP_DATA":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    plotInterpData: payload,
                }
            };
        case "SET_PLOT_IFCURVE_DATA":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    plotIFCurveData: payload,
                }
            };
        case "SET_MAIN_LAYOUT":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    mainLayout: payload,
                }
            };
        case "TOGGLE_MAIN_LAYOUT":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    mainLayout: state.persistentState.mainLayout == "horizontal" ? "vertical" : "horizontal",
                }
            };
        case "SET_EXPORT_INCLUDE_ERROR_MAPS":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    exportIncludeErrorMaps: payload,
                }
            };
        case "SET_EXPORT_INCLUDE_MASK":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    exportIncludeMask: payload,
                }
            };
        case "SET_EXPORT_INCLUDE_UNROLLING":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    exportIncludeUnrolling: payload,
                }
            };
        case "SET_EXPORT_PREFIX":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    exportPrefix: payload,
                }
            };
        case "SET_RENDER_MAX_RESOLUTION":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    renderMaxResolution: payload,
                }
            };
        case "SET_ERROR_OVERLAY_TARGET":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    errorOverlayTarget: payload as string,
                },
            };
        case "TOGGLE_ERROR_OVERLAY_TARGET":
            const newTarget = state.persistentState.errorOverlayTarget == payload ? "" : payload;
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    errorOverlayTarget: newTarget
                },
                dynamicState: {
                    ...state.dynamicState,
                    previewImageData: (newTarget == "" ? state.dynamicState.mainImageData : blendImageData(state.dynamicState.mainImageData, getErrorData(newTarget), state.persistentState.errorOverlayOpacity)),
                }
            }
        case "SET_ERROR_OVERLAY_OPACITY":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    errorOverlayOpacity: payload as number,
                },
                dynamicState: {
                    ...state.dynamicState,
                    previewImageData: blendImageData(state.dynamicState.mainImageData, getErrorData(state.persistentState.errorOverlayTarget), payload as number),
                },
            };
        case "SET_ERROR_LEGEND":
            return {
                ...state,
                errorSettings: {
                    ...state.errorSettings,
                    errorLegend: payload as boolean,
                },
            };
        case "SET_READY_TO_LOAD":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    readyToLoad: payload,
                }
            };
        case "SET_LOAD_TYPE":
            const type = payload as "singlePhoto" | "maskAndCylindrical" | "model";
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    loadType: type,
                    adjustingModel: type == "model" 
                }
            };
        case "SET_MODEL":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    model: payload,
                }
            };
        case "SET_MODEL_MATERIAL":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    modelMaterial: payload,
                }
            };
        case "SET_CENTRAL_AXIS_SET":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    centralAxisSet: payload,
                }
            };
        case "SET_ADJUSTING_MODEL":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    adjustingModel: payload,
                }
            };
        case "SET_MASK_IMAGE_URL":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageUrl: payload,
                },
                dynamicState: {
                    ...state.dynamicState,
                    readyToLoad: payload != "" && state.persistentState.unrollingImageUrl != "",
                }
            };
        case "UPDATE_MASK_IMAGE_URL":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageUrl: payload,
                }
            };
        case "SET_UNROLLING_IMAGE_URL":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    unrollingImageUrl: payload,
                },
                dynamicState: {
                    ...state.dynamicState,
                    readyToLoad: payload != "" && state.persistentState.maskImageUrl != ""
                }
            };
        case "SET_IMAGE_DATA":
            const imageData: ImageData = payload.data;
            const target: string = payload.target;

            let newPreviewImageData: ImageData | null = null;

            if (target == "preview" && state.persistentState.errorOverlayTarget == "") 
            {
                newPreviewImageData = imageData;
                if (state.dynamicState.recorder?.isRecording && newPreviewImageData) {
                    state.dynamicState.recorder.addFrame(imageDataToDataURL(newPreviewImageData, true));
                }
            }
            else if (target != "preview" && state.persistentState.errorOverlayTarget == target)
            {
                newPreviewImageData = blendImageData(state.dynamicState.mainImageData, imageData, state.persistentState.errorOverlayOpacity);
                if (state.dynamicState.recorder?.isRecording && newPreviewImageData && target != "") {
                    // state.dynamicState.recorder.addFrame(imageDataToDataURL(newPreviewImageData, true));
                }
            }

            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    previewImageData: newPreviewImageData,
                    ...(target == "preview" && {mainImageData: imageData}),
                    ...(target == "xerror" && {errorImageData1: imageData}),
                    ...(target == "yerror" && {errorImageData2: imageData}),
                    ...(target == "xyerror" && {errorImageData3: imageData}),
                    ...(target == "rerror" && {errorImageData4: imageData}),
                    ...(target == "aerror" && {errorImageData5: imageData}),
                }
            } 
        case "SET_SINGLE_PHOTO_IMAGE_URL":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    singlePhotoImageUrl: payload as string,
                }
            };
        case "SET_MASK_IMAGE_USE_LEFT_HALF": 
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageUseLeftHalf: payload as boolean,
                }
            };
        case "SET_MASK_IMAGE_CENTER": 
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageCenter: payload as number,
                }
            };
        case "SET_MASK_IMAGE_ROTATION":
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageRotation: payload as number,
                }
            };
        case "RESET_MASK_SETTINGS": 
            return {
                ...state,
                persistentState: {
                    ...state.persistentState,
                    maskImageUseLeftHalf: false,
                    maskImageCenter: 0.5,
                    maskImageRotation: 0,
                },
            };
        case "SET_EDIT_MODE":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    editMode: payload as boolean,
                }
            };
        case "SET_EDIT_IMAGE_URL":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    editImageUrl: payload as string,
                }
            };
        case "SET_SOCKET_ADDRESS": 
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    socketAddress: payload as string,
                }
            };
        case "SET_RECORDING_VIDEO":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    recordingVideo: payload as boolean,
                }
            };
        case "SET_RECORDING_PROGRESS":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    recordingProgress: payload as VideoRecordingProgress,
                }
            };
        case "SET_VIDEO_READY":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    videoReady: payload as boolean,
                }
            };
        case "SET_UNROLLING_WIDTH":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    unrollingWidth: payload as number,
                }
            };
        case "SET_UNROLLING_BRIGHTNESS":
            return {
                ...state,
                dynamicState: {
                    ...state.dynamicState,
                    unrollingBrightness: payload as number,
                }
            };
        case "RESET_STATE":
            return { 
                ...initState,
                dynamicState: {
                    ...initState.dynamicState,
                    socketAddress: state.dynamicState.socketAddress
                }
            };
        case "LOAD_STATE":
            const p = payload as AppState;
            return {
                ...state,
                modelSettings: {
                    ...p.modelSettings,
                    dFactorRestrict: p.modelSettings.dFactorRestrict == undefined ? D_FACTOR_RESTRICT : p.modelSettings.dFactorRestrict,
                },
                optimizationSettings: p.optimizationSettings,
                imageSettings: p.imageSettings,
                gridSettings: p.gridSettings,
                errorSettings: p.errorSettings,
                plotSettings: p.plotSettings,
                advancedSettings: p.advancedSettings,
                persistentState: {
                    ...p.persistentState,
                    maskImageUseLeftHalf: p.persistentState.maskImageUseLeftHalf == undefined ? false : p.persistentState.maskImageUseLeftHalf,
                    maskImageCenter: p.persistentState.maskImageCenter == undefined ? 0.5 : p.persistentState.maskImageCenter,
                    maskImageRotation: p.persistentState.maskImageRotation == undefined ? 0 : p.persistentState.maskImageRotation,
                },
                dynamicState: {
                    ...state.dynamicState,
                    projectFileLoaded: true
                }
            }
        default:
            return state;
    }
}

export function reducerHooks(state: Hooks, { type, payload = null }: Action): Hooks {    
    switch (type) {
        // HOOKS
        case "SET_UPDATE_CENTRAL_AXIS_CALLBACK":
            return {
                    ...state,
                    updateCentralAxisCallback: payload as ()=>void,
                };
        case "SET_UPDATE_EDIT_IMAGE_URL_CALLBACK":
            return {
                    ...state,
                    updateEditImageUrlCallback: payload as ()=>void,
                };

        default:
            return state;
    }
}