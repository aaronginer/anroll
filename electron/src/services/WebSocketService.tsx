import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAppData } from "../data/app_data/AppData";
import { fillMaskHoles, maskMirrorHalf, rotateImage } from "../util/ImageUtil";
import { useAlertService } from "./AlertService";
import type { ActionType } from "../data/app_data/Reducer";
import type { AppState } from "../data/app_data/State";

export const WebSocketContext = createContext<any>(null);

interface WebSocketServicePros
{
    children: ReactNode;
}

function WebSocketService({children}: WebSocketServicePros) {  
    const appData = useAppData();
    const alertService = useAlertService();
    
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

    const ws = useRef<WebSocket | null>(null);
    const retryTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const connect = () => {
            const url = "ws://" + appData.stateRef.current.dynamicState.socketAddress;
            if (!url) return;

            console.log("Trying to connect to " + url);
            if (ws.current) return;

            let socket: WebSocket | null = null;
            try {
                socket = new WebSocket(url);
            }
            catch (e) 
            {
                alertService.addAlert("Invalid socket address.");
                ws.current = null;
                retryTimer.current = setTimeout(connect, 1000);
                return;
            }

            socket.binaryType = "arraybuffer";

            socket.onopen = () => {
                console.log("WebSocket connected.");
                setReadyState(WebSocket.OPEN);
                if (retryTimer.current)
                {
                    clearTimeout(retryTimer.current);
                    retryTimer.current = null;
                }
                ws.current = socket;
            };

            socket.onmessage = (msg) => {
                const data = new Uint8Array(msg.data);
                if (data.length < 4) {
                    console.error("Message too short to contain length header", data.length);
                    return;
                }
                const jsonLen = new DataView(data.buffer).getUint32(0, true); // little-endian
                const jsonStr = new TextDecoder().decode(data.slice(4, 4 + jsonLen));
                const meta = JSON.parse(jsonStr);

                if (meta.command == "modelLoaded")
                {
                    appData.updateState("SET_MODEL_LOADED")(true);
                }
                else if (meta.command == "plot")
                {
                    if (meta.data.target == "interp")
                    {
                        appData.updateState("SET_PLOT_INTERP_DATA")(meta.data);
                    }
                    else if (meta.data.target == "ifcurve")
                    {
                        appData.updateState("SET_PLOT_IFCURVE_DATA")(meta.data);
                    }
                }
                else if (meta.command == "image") 
                {
                    const width = meta.width;
                    const height = meta.height;
                    const target = meta.target;
                    const rgba = data.slice(4 + jsonLen);

                    const imageData: ImageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
                    appData.updateState("SET_IMAGE_DATA")({ data: imageData, target: target});

                }
                else if (meta.command == "feedback") // property updates from the server
                {
                    for (const [key, value] of Object.entries(meta.feedback)) {
                        if (typeof value !== "number") continue;
                        appData.updateState(key as ActionType)(Math.round(value * 100) / 100);
                    }
                }
                else if (meta.command == "finished")
                {
                    appData.updateState("SET_CAN_SEND_COMMAND")(true);
                }
                else if (meta.command == "error")
                {
                    alertService.addAlert(meta.text);
                }
            }

            socket.onclose = () => {
                console.log('WebSocket Disconnected');
                setReadyState(WebSocket.CLOSED);
                ws.current = null;
                retryTimer.current = setTimeout(connect, 1000);
                appData.updateState("RESET_STATE")();
            };

            socket.onerror = (e) => {
                console.error('WebSocket Error:', e);
            };
        }

        connect();

        return () => {
            if (retryTimer.current)
            {
                clearTimeout(retryTimer.current);
                retryTimer.current = null;
            }
            if (ws.current) 
            {
                ws.current.onclose = null;
                ws.current.onerror = null;
                ws.current.close();
                ws.current = null;
            }
        };
    }, []);

    function addCommandToQueue(command: string, params: Record<string, string | number | boolean>) {
        if (ws.current == null || ws.current.readyState != ws.current.OPEN) return;

        const payload = JSON.stringify({ "command": command, ...params });
        appData.state.dynamicState.commandQueue.enqueue(payload);
        appData.updateState("SET_COMMAND_QUEUE_SIZE")(appData.state.dynamicState.commandQueue.size());
    }

    function sendParameters(state: AppState): void {
        addCommandToQueue("tune", {
            "if": state.modelSettings.interpolationFactor,
            "d": state.modelSettings.dFactor,
            "dr": state.modelSettings.dFactorRestrict,
            "rad": state.modelSettings.radiusModifier,
            "enforce_isotropy": state.modelSettings.enforceIsotropy,
            "opt_active": state.optimizationSettings.optimizationActive,
            "opt_max_iter": state.optimizationSettings.optimizationMaxIterations,
            "opt_e0w": state.optimizationSettings.error0Weight,
            "opt_e1w": state.optimizationSettings.error1Weight,
            "opt_e2w": state.optimizationSettings.error2Weight,
            "opt_e3w": state.optimizationSettings.error3Weight,
            "opt_if": state.optimizationSettings.optimizeInterpolationFactor,
            "opt_d": state.optimizationSettings.optimizeDFactor,
            "opt_rad": state.optimizationSettings.optimizeRadiusModifier,
            "image_active": state.imageSettings.imageActive,
            "ir": state.imageSettings.imageRotation,
            "iry": state.imageSettings.verticalShift,
            "croptop": state.imageSettings.cropTop, 
            "cropbottom": state.imageSettings.cropBottom,
            "cropright": state.imageSettings.cropRight,
            "cropleft": state.imageSettings.cropLeft,
            "pif": state.imageSettings.previewScale,
            "grid_active": state.gridSettings.gridActive,
            "grid_alp": state.gridSettings.gridUniform,
            "grid_thickness": state.gridSettings.gridThickness,
            "gridx": state.gridSettings.gridX,
            "gridy": state.gridSettings.gridY,
            "errors_quality": state.errorSettings.errorsQuality,
            "errors_active": state.errorSettings.errorsActive,
            "errors_use_gpu": state.errorSettings.errorsUseGPU,
            "plot_interp": state.plotSettings.plotInterp,
            "plot_ifcurve": state.plotSettings.plotIFCurve,
            "spline_smoothing": state.advancedSettings.splineSmoothing,
            "tilt": state.advancedSettings.tilt,
            "render_max_res": state.persistentState.renderMaxResolution
        });
    }

    useEffect(() => {
        sendParameters(appData.state);
    }, [appData.state.modelSettings.enforceIsotropy,
        appData.state.modelSettings.dFactorRestrict,
        appData.state.optimizationSettings,
        appData.state.imageSettings, 
        appData.state.gridSettings, appData.state.errorSettings, 
        appData.state.plotSettings, appData.state.advancedSettings.splineSmoothing,
        appData.state.advancedSettings.tilt,
        appData.state.persistentState.mainLayout /* resend parameters on layout change (update workaround for now) */, 
        appData.state.dynamicState.modelLoaded /* initial send of parameters once the server has loaded the model */,
        appData.state.persistentState.renderMaxResolution
    ]);

    useEffect(() => {
        if (appData.state.optimizationSettings.optimizeInterpolationFactor && appData.state.optimizationSettings.optimizationActive) {
            return;
        }

        sendParameters(appData.state);
    }, [appData.state.modelSettings.interpolationFactor]);

    useEffect(() => {
        if (appData.state.optimizationSettings.optimizeDFactor && appData.state.optimizationSettings.optimizationActive) {
            return;
        }

        sendParameters(appData.state);
    }, [appData.state.modelSettings.dFactor]);

    useEffect(() => {
        if (appData.state.optimizationSettings.optimizeRadiusModifier && appData.state.optimizationSettings.optimizationActive) {
            return;
        }

        sendParameters(appData.state);
    }, [appData.state.modelSettings.radiusModifier]);

    async function loadProject() {
        const maskImageUrl = await fillMaskHoles(appData.state.persistentState.maskImageCenter, appData.state.persistentState.maskImageUrl);
        let maskData = await maskMirrorHalf(maskImageUrl, appData.state.persistentState.maskImageUseLeftHalf, appData.state.persistentState.maskImageCenter);
        maskData = await rotateImage(maskData, appData.state.persistentState.maskImageRotation);
        maskData = maskData.split(",")[1];
        const unrolledData = appData.state.persistentState.unrollingImageUrl.split(",")[1];

        if (maskData == "" || unrolledData == "")
        {
            console.log("Error occured with mask/unrolling data.");
            return;
        }
        addCommandToQueue("loadProject", {
            "mask": maskData,
            "unrolling": unrolledData
        });
    }

    useEffect(() => {
        if (appData.state.persistentState.maskImageUrl == "" || appData.state.persistentState.unrollingImageUrl == "") return;
        loadProject();
    }, [appData.state.dynamicState.projectFileLoaded]);

    function fastForwardCommandQueue() {
        appData.state.dynamicState.commandQueue.fastForward();
        appData.updateState("SET_COMMAND_QUEUE_SIZE")(appData.state.dynamicState.commandQueue.size());
    }

    function sendNextCommand() {
        if (!ws.current || !appData.state.dynamicState.canSendCommand || appData.state.dynamicState.commandQueue.size() <= 0) return;

        const currentCommand = appData.state.dynamicState.commandQueue.dequeue();
        
        if (currentCommand != undefined)
        {
            ws.current.send(currentCommand);
            appData.updateState("SET_COMMAND_QUEUE_SIZE")(appData.state.dynamicState.commandQueue.size());
            appData.updateState("SET_CAN_SEND_COMMAND")(false);
        }
    }

    // dispatch commands
    useEffect(() => {
        sendNextCommand();
    }, [appData.state.dynamicState.canSendCommand, appData.state.dynamicState.commandQueueSize]);

    const contextValue = {
        readyState,
        fastForwardCommandQueue,
        loadProject,
        sendParameters
    }

    return <WebSocketContext.Provider value={contextValue}>
        {children}
    </WebSocketContext.Provider>
}

export default WebSocketService;