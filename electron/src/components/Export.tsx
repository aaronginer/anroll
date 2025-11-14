import { useAppData } from "../data/app_data/AppData";
import WindowContainer from "../features/WindowContainer";
import SidebarSection from "./SidebarSection";
import SidebarCheckboxControl from "./SidebarCheckboxControl";
import SidebarSectionElementDivider from "./SidebarSectionElementDivider";
import SidebarTextInput from "./SidebarTextInput";
import SidebarSimpleButton from "./SidebarSimpleButton";
import { exportImages, exportVideo } from "../util/Util";
import type { AppState } from "../data/app_data/State";
import { useContext, useEffect, useState } from "react";
import { WebSocketContext } from "../services/WebSocketService";
import SidebarPosNegButton from "./SidebarPosNegButton";
import SidebarSliderControl from "./SidebarSliderControl";
import { useAlertService } from "../services/AlertService";

interface StateTransition {
    start: AppState | null;
    end: AppState | null;
    duration: number; // in seconds
}

function Export() {
    const ws = useContext(WebSocketContext);
    const appData = useAppData();
    const alerts = useAlertService();
    const [stateTransitions, setStateTransitions] = useState<StateTransition[]>([]);

    useEffect(() => {
        setStateTransitions([]);
    }, []);

    function createVideo() {
        // interpolate all states to create intermediate states
        const states: AppState[] = [];

        for (let i = 0; i < stateTransitions.length; i++) {
            const transition = stateTransitions[i];
            const start = transition.start;
            const end = transition.end;
            const duration = transition.duration;

            if (!start || !end) continue;

            const frames = Math.round(duration * 24); // assuming 24 FPS

            for (let t = 0; t < frames-1; t += 1) { // increment by 1 frame
                const progress = t / (frames - 1);
                const interpolatedState: AppState = {
                    ...start,
                    modelSettings: {
                        ...start.modelSettings,
                        interpolationFactor: start.modelSettings.interpolationFactor + (end.modelSettings.interpolationFactor - start.modelSettings.interpolationFactor) * progress,
                        dFactor: start.modelSettings.dFactor + (end.modelSettings.dFactor - start.modelSettings.dFactor) * progress,
                        radiusModifier: start.modelSettings.radiusModifier + (end.modelSettings.radiusModifier - start.modelSettings.radiusModifier) * progress,
                    },
                    imageSettings: {
                        ...start.imageSettings,
                        imageRotation: start.imageSettings.imageRotation + (end.imageSettings.imageRotation - start.imageSettings.imageRotation) * progress,
                        cropTop: start.imageSettings.cropTop + (end.imageSettings.cropTop - start.imageSettings.cropTop) * progress,
                        cropBottom: start.imageSettings.cropBottom + (end.imageSettings.cropBottom - start.imageSettings.cropBottom) * progress,
                        cropLeft: start.imageSettings.cropLeft + (end.imageSettings.cropLeft - start.imageSettings.cropLeft) * progress,
                        cropRight: start.imageSettings.cropRight + (end.imageSettings.cropRight - start.imageSettings.cropRight) * progress,
                        previewScale: start.imageSettings.previewScale + (end.imageSettings.previewScale - start.imageSettings.previewScale) * progress,
                    },
                    gridSettings: {
                        ...start.gridSettings,
                        gridThickness: start.gridSettings.gridThickness + (end.gridSettings.gridThickness - start.gridSettings.gridThickness) * progress,
                        gridX: start.gridSettings.gridX + (end.gridSettings.gridX - start.gridSettings.gridX) * progress,
                        gridY: start.gridSettings.gridY + (end.gridSettings.gridY - start.gridSettings.gridY) * progress,
                    },
                    advancedSettings: {
                        ...start.advancedSettings,
                        splineSmoothing: start.advancedSettings.splineSmoothing + (end.advancedSettings.splineSmoothing - start.advancedSettings.splineSmoothing) * progress,
                        tilt: start.advancedSettings.tilt + (end.advancedSettings.tilt - start.advancedSettings.tilt) * progress,
                    },
                    optimizationSettings: {
                        ...start.optimizationSettings,
                        error0Weight: start.optimizationSettings.error0Weight + (end.optimizationSettings.error0Weight - start.optimizationSettings.error0Weight) * progress,
                        error1Weight: start.optimizationSettings.error1Weight + (end.optimizationSettings.error1Weight - start.optimizationSettings.error1Weight) * progress,
                        error2Weight: start.optimizationSettings.error2Weight + (end.optimizationSettings.error2Weight - start.optimizationSettings.error2Weight) * progress,
                        error3Weight: start.optimizationSettings.error3Weight + (end.optimizationSettings.error3Weight - start.optimizationSettings.error3Weight) * progress,
                    }
                };
                states.push(interpolatedState);
            }
            states.push(end); // add the final state
        }

        if (states.length === 0) {
            alerts.addAlert("No valid state transitions found. Please add at least one start and end state for the video export.");
            return;
        }

        appData.state.dynamicState.recorder.setTotalFrames(states.length);
        // its unnecessary to set these every time, but for now it's fine
        appData.state.dynamicState.recorder.setVideoReadyCallback(appData.updateState("SET_VIDEO_READY"));
        appData.state.dynamicState.recorder.setRecordingVideoCallback(appData.updateState("SET_RECORDING_VIDEO"));
        appData.state.dynamicState.recorder.setProgressCallback(appData.updateState("SET_RECORDING_PROGRESS"));
        const currentCQCapacity = appData.state.dynamicState.commandQueue.capacity;
        appData.state.dynamicState.recorder.setRecordingFinishedCallback(() => {
            appData.state.dynamicState.commandQueue.capacity = currentCQCapacity;
        });
        appData.state.dynamicState.recorder.startCapture();

        appData.state.dynamicState.commandQueue.clear();
        appData.state.dynamicState.commandQueueSize = 0;
        appData.state.dynamicState.commandQueue.capacity = states.length;
        for (let i = 0; i < states.length; i++) {
            const state = states[i];
            ws.sendParameters(state);
        }
    }

    return <>
        <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
            <SidebarSection title="Export Images" active={false} buttonBackgroundColor="Crimson" borderColor="Maroon" resetButton={false}>
                <SidebarCheckboxControl name="Distortion Maps" id_prefix="export-error-maps" value={appData.state.persistentState.exportIncludeErrorMaps} setValue={() => {
                    appData.updateState("SET_EXPORT_INCLUDE_ERROR_MAPS")(!appData.state.persistentState.exportIncludeErrorMaps);
                    appData.updateState("SET_ERRORS_ACTIVE")(!appData.state.persistentState.exportIncludeErrorMaps || appData.state.errorSettings.errorsActive);
                }} />
                <SidebarCheckboxControl name="Input Mask" id_prefix="export-include-mask" value={appData.state.persistentState.exportIncludeMask} setValue={() => {
                    appData.updateState("SET_EXPORT_INCLUDE_MASK")(!appData.state.persistentState.exportIncludeMask);
                }} />
                <SidebarCheckboxControl name="Cylindrical Unrolling" id_prefix="export-include-unrolling" value={appData.state.persistentState.exportIncludeUnrolling} setValue={() => {
                    appData.updateState("SET_EXPORT_INCLUDE_UNROLLING")(!appData.state.persistentState.exportIncludeUnrolling);
                }} />
                <SidebarSectionElementDivider/>
                <SidebarTextInput id="export-prefix" placeholder="Enter export name..." value={appData.state.persistentState.exportPrefix} setValue={appData.updateState("SET_EXPORT_PREFIX")}/>
                <SidebarSectionElementDivider/>
                <SidebarSimpleButton name="Export" id="export-images" callback={() => { 
                    const maskDataUrl = appData.state.persistentState.exportIncludeMask ? appData.state.persistentState.maskImageUrl : "";
                    const cylUnrolling = appData.state.persistentState.exportIncludeUnrolling ? appData.state.persistentState.unrollingImageUrl : "";
                    exportImages(appData.state.persistentState.exportIncludeErrorMaps, maskDataUrl, cylUnrolling, appData.state.persistentState.exportPrefix); }}/>
            </SidebarSection>
        </WindowContainer>
        <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
            <SidebarSection title="Export Video" active={false} buttonBackgroundColor="Crimson" borderColor="Maroon" resetButton={false}>
                {stateTransitions.map((transition, index) => (<>
                    <div style={{ border: "2px solid var(--bs-gray-800)", borderRadius: 5, marginBottom: 5, padding: 5}}>
                        Transition {index + 1}
                        <div className={"d-flex row justify-content-between align-items-center"}>
                            <div className={"col-6"}>
                                <SidebarPosNegButton name={"Start"} id={`transition-${index + 1}`} condition={transition.start != null} callback={() => {setStateTransitions(stateTransitions.map((t, i) => i === index ? { ...t, start: appData.state } : t));}} />
                            </div>
                            <div className={"col-6"}>
                                <SidebarPosNegButton name={"End"} id={`transition-${index + 1}`} condition={transition.end != null} callback={() => {setStateTransitions(stateTransitions.map((t, i) => i === index ? { ...t, end: appData.state } : t));}} />
                            </div>
                        </div>
                        <SidebarSliderControl name="Duration (s)" id_prefix={`transition-${index + 1}`} min_value={0.5} max_value={30} min_slider_value={0.5} max_slider_value={30} step_size={0.1}
                            value={transition.duration}
                            setValue={(value) => {
                                setStateTransitions(stateTransitions.map((t, i) => i === index ? { ...t, duration: value, displayDuration: value.toString() } : t));
                            }}
                        />
                        <SidebarSimpleButton name="Remove" id="remove-transition" callback={() => {
                            setStateTransitions(stateTransitions.filter((_, i) => i !== index));
                        }}/>
                    </div>
                </>))}
                <SidebarSimpleButton name="Add Transition" id="add-transition" callback={() => {
                    setStateTransitions([...stateTransitions, { start: null, end: null, duration: 1 }]);
                }} />
                {stateTransitions.length > 0 && <>
                    <SidebarSectionElementDivider/>
                    <SidebarSimpleButton name="Create Video" id="start-recording" callback={createVideo}/>
                </>}
                
                {appData.state.dynamicState.videoReady && 
                    <>
                        <SidebarSectionElementDivider/>
                        <SidebarSimpleButton name="Export" id="export-video" callback={() => { exportVideo(appData.state.dynamicState.recorder ? appData.state.dynamicState.recorder.getVideoBlob() : null); }}/>
                    </>
                }
            </SidebarSection>
        </WindowContainer>
    </>
}

export default Export;