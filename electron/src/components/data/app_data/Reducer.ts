import { blendImageData } from "../../../util/Util";
import { MAX_CROP } from "./Constants";
import { initAdvancedSettings, initErrorSettings, initGridSettings, initImageSettings, initModelSettings, initPlotSettings, initState, type AppState } from "./State";

export type ActionType =
    | "SET_INTERPOLATION_FACTOR"
    | "SET_D_FACTOR"
    | "SET_RADIUS_MODIFIER"
    | "SET_ENFORCE_ISOTROPY"
    | "RESET_MODEL_SETTINGS"
    | "SET_IMAGE_ACTIVE"
    | "SET_IMAGE_ROTATION"
    | "SET_CROP_TOP"
    | "SET_CROP_BOTTOM"
    | "SET_PREVIEW_SCALE"
    | "RESET_IMAGE_SETTINGS"
    | "SET_GRID_ACTIVE"
    | "SET_GRID_UNIFORM"
    | "SET_GRID_THICKNESS"
    | "SET_GRID_X"
    | "SET_GRID_Y"
    | "RESET_GRID_SETTINGS"
    | "SET_ERRORS_ACTIVE"
    | "SET_ERRORS_QUALITY"
    | "SET_ERROR_OVERLAY_TARGET"
    | "TOGGLE_ERROR_OVERLAY_TARGET"
    | "SET_ERROR_OVERLAY_OPACITY"
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
    | "RESET_STATE"
    | "SET_READY_TO_LOAD"
    | "SET_LOAD_TYPE"
    | "SET_MODEL"
    | "SET_MODEL_MATERIAL"
    | "SET_CENTRAL_AXIS_SET"
    | "SET_UPDATE_CENTRAL_AXIS_CALLBACK"
    | "SET_ADJUSTING_MODEL"
    | "SET_MASK_IMAGE_URL"
    | "SET_UNROLLING_IMAGE_URL"
    | "SET_MAIN_IMAGE_DATA"
    | "SET_ERROR_IMAGE_DATA1"
    | "SET_ERROR_IMAGE_DATA2"
    | "SET_ERROR_IMAGE_DATA3"
    | "SET_ERROR_IMAGE_DATA4"
    | "SET_IMAGE_DATA";

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
                errorImageData = state.webState.errorImageData1;
                break;
            case "yerror":
                errorImageData = state.webState.errorImageData2;
                break;
            case "xyerror":
                errorImageData = state.webState.errorImageData3;
                break;
            case "rerror":
                errorImageData = state.webState.errorImageData4;
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
        case "SET_RADIUS_MODIFIER":
            return {
                ...state,
                modelSettings: {
                    ...state.modelSettings,
                    radiusModifier: payload as number,
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
        case "SET_CROP_TOP":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropTop: payload as number,
                    cropBottom: payload + state.imageSettings.cropBottom > MAX_CROP ? MAX_CROP - payload : state.imageSettings.cropBottom
                },
            };
        case "SET_CROP_BOTTOM":
            return {
                ...state,
                imageSettings: {
                    ...state.imageSettings,
                    cropBottom: payload as number,
                    cropTop: payload + state.imageSettings.cropTop > MAX_CROP ? MAX_CROP - payload : state.imageSettings.cropTop
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
                webState: {
                    ...state.webState,
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
        case "RESET_ERROR_SETTINGS":
            return {
                ...state,
                errorSettings: initErrorSettings,
                webState: {
                    ...state.webState,
                    errorOverlayTarget: ""
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
            state.webState.commandQueue.setCapacity(payload as number);
            return {
                ...state,
                advancedSettings: {
                    ...state.advancedSettings,
                    commandQueueCapacity: payload as number,
                },
            };
        case "RESET_ADVANCED_SETTINGS":
            return {
                ...state,
                advancedSettings: initAdvancedSettings
            };

        // Logic State
        case "SET_MODEL_LOADED":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    modelLoaded: payload as boolean,
                },
            };
        case "SET_CAN_SEND_COMMAND":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    canSendCommand: payload as boolean,
                },
            };
        case "SET_COMMAND_QUEUE_SIZE":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    commandQueueSize: payload as number,
                },
            };
        case "SET_PLOT_INTERP_DATA":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    plotInterpData: payload,
                }
            };
        case "SET_PLOT_IFCURVE_DATA":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    plotIFCurveData: payload,
                }
            };
        case "SET_MAIN_LAYOUT":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    mainLayout: payload,
                }
            };
        case "TOGGLE_MAIN_LAYOUT":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    mainLayout: state.webState.mainLayout == "horizontal" ? "vertical" : "horizontal",
                }
            };
        case "SET_EXPORT_INCLUDE_ERROR_MAPS":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    exportIncludeErrorMaps: payload,
                }
            };
        case "SET_ERROR_OVERLAY_TARGET":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    errorOverlayTarget: payload as string,
                },
            };
        case "TOGGLE_ERROR_OVERLAY_TARGET":
            const newTarget = state.webState.errorOverlayTarget == payload ? "" : payload;
            return {
                ...state,
                webState: {
                    ...state.webState,
                    previewImageData: (newTarget == "" ? state.webState.mainImageData : blendImageData(state.webState.mainImageData, getErrorData(newTarget), state.webState.errorOverlayOpacity)),
                    errorOverlayTarget: newTarget
                }
            }
        case "SET_ERROR_OVERLAY_OPACITY":
            return {
                ...state,
                webState: {
                    ...state.webState,
                    previewImageData: blendImageData(state.webState.mainImageData, getErrorData(state.webState.errorOverlayTarget), payload as number),
                    errorOverlayOpacity: payload as number,
                },
            };
        case "SET_READY_TO_LOAD":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        readyToLoad: payload,
                    }
                };
        case "SET_LOAD_TYPE":
            const type = payload as "singlePhoto" | "maskAndCylindrical" | "model";
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        loadType: type,
                        adjustingModel: type == "model" 
                    }
                };
        case "SET_MODEL":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        model: payload,
                    }
                };
        case "SET_MODEL_MATERIAL":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        modelMaterial: payload,
                    }
                };
        case "SET_CENTRAL_AXIS_SET":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        centralAxisSet: payload,
                    }
                };
        case "SET_UPDATE_CENTRAL_AXIS_CALLBACK":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        updateCentralAxisCallback: payload as ()=>void,
                    }
                };
        case "SET_ADJUSTING_MODEL":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        adjustingModel: payload,
                    }
                };
        case "SET_MASK_IMAGE_URL":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        maskImageUrl: payload,
                        readyToLoad: payload != "" && state.webState.unrollingImageUrl != ""
                    }
                };
        case "SET_UNROLLING_IMAGE_URL":
            return {
                    ...state,
                    webState: {
                        ...state.webState,
                        unrollingImageUrl: payload,
                        readyToLoad: payload != "" && state.webState.maskImageUrl != ""
                    }
                };
        case "SET_IMAGE_DATA":
            const imageData: ImageData = payload.data;
            const target: string = payload.target;

            let newPreviewImageData: ImageData | null = null;

            if (target == "preview" && state.webState.errorOverlayTarget == "") 
            {
                newPreviewImageData = imageData;
            }
            else if (target != "preview" && state.webState.errorOverlayTarget == target)
            {
                newPreviewImageData = blendImageData(state.webState.mainImageData, imageData, state.webState.errorOverlayOpacity);
            }

            return {
                ...state,
                webState: {
                    ...state.webState,
                    previewImageData: newPreviewImageData,
                    ...(target == "preview" && {mainImageData: imageData}),
                    ...(target == "xerror" && {errorImageData1: imageData}),
                    ...(target == "yerror" && {errorImageData2: imageData}),
                    ...(target == "xyerror" && {errorImageData3: imageData}),
                    ...(target == "rerror" && {errorImageData4: imageData}),
                }
            } 
        case "RESET_STATE":
            return initState;
        
        default:
            return state;
    }
}