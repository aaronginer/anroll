import SidebarSection from "./SidebarSection";
import SidebarSliderControl from "./SidebarSliderControl";
import SidebarSectionElementDivider from "./SidebarSectionElementDivider";
import SidebarCheckboxControl from "./SidebarCheckboxControl";
import SiderbarTextDoubleControl from "./SiderbarTextDoubleControl";
import WindowContainer from "../features/WindowContainer";
import ProjectLoader from "./ProjectLoader";
import WindowsFlexContainer from "../features/WindowsFlexContainer";
import { mapExponential } from "../util/Util";
import { useAppData } from "../data/app_data/AppData";
import Export from "./Export";
import SidebarLabel from "./SidebarLabel";
import SidebarSimpleButton from "./SidebarSimpleButton";
import { useContext } from "react";
import { WebSocketContext } from "../services/WebSocketService";
import type { AppState } from "../data/app_data/State";
import { fillMaskHoles } from "../util/ImageUtil";

function Sidebar() {
    const appData = useAppData();
    const ws = useContext(WebSocketContext);

    return <WindowsFlexContainer id="sidebar" classes="flex-column bg-dark flex-shrink-0" width="250px"> 
        {!appData.state.dynamicState.editMode &&
            <WindowContainer detachable={true} initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Project" active={true} resetButton={false}>
                    <ProjectLoader/>
                </SidebarSection>
            </WindowContainer>
        }
        {!appData.state.dynamicState.modelLoaded && appData.state.persistentState.maskImageUrl != "" && !appData.state.dynamicState.editMode &&
            <WindowContainer detachable={true} initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Mask" active={true} resetButton={true} resetButtonCallback={appData.updateState("RESET_MASK_SETTINGS")}>
                    <SidebarCheckboxControl name="Use Left Half" setValue={appData.updateState("SET_MASK_IMAGE_USE_LEFT_HALF")} id_prefix="mask-use-left-half" value={appData.state.persistentState.maskImageUseLeftHalf}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Center" id_prefix="mask-set-center" min_value={0.3} max_value={0.7} min_slider_value={0.3} max_slider_value={0.7} value={appData.state.persistentState.maskImageCenter} step_size={0.005} setValue={appData.updateState("SET_MASK_IMAGE_CENTER")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Rotation" id_prefix="mask-set-rotation" min_value={-45} max_value={45} min_slider_value={-45} max_slider_value={45} value={appData.state.persistentState.maskImageRotation} step_size={0.1} setValue={appData.updateState("SET_MASK_IMAGE_ROTATION")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSimpleButton name="Fill Mask Holes" id="fill-mask-holes" callback={() => {
                        fillMaskHoles(appData.state.persistentState.maskImageCenter, appData.state.persistentState.maskImageUrl).then((maskDataUrl) => {
                            appData.updateState("SET_MASK_IMAGE_URL")(maskDataUrl);
                        });
                    }}/>
                </SidebarSection>
            </WindowContainer>
        }
        {appData.state.dynamicState.adjustingModel && 
            <WindowContainer detachable={true} initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Cylindrical Unrolling" active={true} resetButton={true} resetButtonCallback={appData.updateState("RESET_MASK_SETTINGS")}>
                    <SidebarSliderControl name="Width (px)" id_prefix="cyl-unroll-width" min_value={500} max_value={5000} min_slider_value={500} max_slider_value={5000} value={appData.state.dynamicState.unrollingWidth} step_size={10} setValue={appData.updateState("SET_UNROLLING_WIDTH")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Brightness" id_prefix="cyl-unroll-brightness" min_value={0} max_value={5} min_slider_value={0} max_slider_value={5} value={appData.state.dynamicState.unrollingBrightness} step_size={0.1} setValue={appData.updateState("SET_UNROLLING_BRIGHTNESS")}/>
                </SidebarSection>
            </WindowContainer>
        }
        {appData.state.dynamicState.modelLoaded && <>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Model" active={false} resetButtonCallback={appData.updateState("RESET_MODEL_SETTINGS")}>
                    <SidebarSliderControl name="Interpolation Factor" id_prefix="interpolation-factor" value={appData.state.modelSettings.interpolationFactor} min_value={0} max_value={1}
                        min_slider_value={0} max_slider_value={1} step_size={0.05} disabled={appData.state.optimizationSettings.optimizeInterpolationFactor && appData.state.optimizationSettings.optimizationActive} setValue={appData.updateState("SET_INTERPOLATION_FACTOR")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Uniformity" id_prefix="uniformity" value={appData.state.modelSettings.dFactor} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} disabled={appData.state.optimizationSettings.optimizeDFactor && appData.state.optimizationSettings.optimizationActive} setValue={appData.updateState("SET_D_FACTOR")}/>
                    <SidebarCheckboxControl name="Restrict" id_prefix={"uniformity-restrict"} value={appData.state.modelSettings.dFactorRestrict} setValue={appData.updateState("SET_D_FACTOR_RESTRICT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Radius Factor" id_prefix="radius-factor" value={appData.state.modelSettings.radiusModifier} min_value={-1000} max_value={1000} 
                        min_slider_value={-20} max_slider_value={20} step_size={0.1} disabled={appData.state.optimizationSettings.optimizeRadiusModifier && appData.state.optimizationSettings.optimizationActive} setValue={appData.updateState("SET_RADIUS_MODIFIER")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Enforce Isotropy" id_prefix="enforce-isotropy" value={appData.state.modelSettings.enforceIsotropy} setValue={appData.updateState("SET_ENFORCE_ISOTROPY")}/>
                </SidebarSection>
            </WindowContainer>            
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Image" active={false} resetButtonCallback={appData.updateState("RESET_IMAGE_SETTINGS")}>
                    <SidebarCheckboxControl name="Active" id_prefix="image-active" value={appData.state.imageSettings.imageActive} setValue={(val) => appData.updateState("SET_IMAGE_ACTIVE")(val)}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Region Selector" id_prefix="image-region-selector-active" value={appData.state.imageSettings.imageRegionSelectorActive} 
                        setValue={appData.updateState("SET_IMAGE_REGION_SELECTOR_ACTIVE")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Rotation" id_prefix="image-rotation" value={appData.state.imageSettings.imageRotation} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.02} setValue={appData.updateState("SET_IMAGE_ROTATION")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Vertical Shift" id_prefix="image-rotation-y" value={appData.state.imageSettings.verticalShift} min_value={-0.5} max_value={0.5} 
                        min_slider_value={-0.5} max_slider_value={0.5} step_size={0.001} setValue={appData.updateState("SET_VERTICAL_SHIFT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Crop Top" id_prefix="crop-top" value={appData.state.imageSettings.cropTop} min_value={0} max_value={0.95} step_size={0.005} 
                        min_slider_value={0} max_slider_value={0.95} setValue={appData.updateState("SET_CROP_TOP")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Crop Bottom" id_prefix="crop-bottom" value={appData.state.imageSettings.cropBottom} min_value={0} max_value={0.95} 
                        step_size={0.005} min_slider_value={0} max_slider_value={0.95} setValue={appData.updateState("SET_CROP_BOTTOM")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Crop Right" id_prefix="crop-right" value={appData.state.imageSettings.cropRight} min_value={0} max_value={0.95} 
                        step_size={0.005} min_slider_value={0} max_slider_value={0.95} setValue={appData.updateState("SET_CROP_RIGHT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Crop Left" id_prefix="crop-left" value={appData.state.imageSettings.cropLeft} min_value={0} max_value={0.95} 
                        step_size={0.005} min_slider_value={0} max_slider_value={0.95} setValue={appData.updateState("SET_CROP_LEFT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Input Resolution" id_prefix="preview-scale" value={appData.state.imageSettings.previewScale} min_value={0.01} max_value={1} 
                        step_size={0.01} min_slider_value={0.01} max_slider_value={1} setValue={appData.updateState("SET_PREVIEW_SCALE")}/>
                    <SidebarSliderControl name="Output Resolution" id_prefix="render-res" value={appData.state.persistentState.renderMaxResolution} min_value={1000} max_value={10000} 
                        step_size={100} min_slider_value={1000} max_slider_value={10000} setValue={appData.updateState("SET_RENDER_MAX_RESOLUTION")}/>
                </SidebarSection>
            </WindowContainer>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Grid" active={false} resetButtonCallback={appData.updateState("RESET_GRID_SETTINGS")}>
                    <SidebarCheckboxControl name="Active" id_prefix="grid-active" value={appData.stateRef.current.gridSettings.gridActive} setValue={appData.updateState("SET_GRID_ACTIVE")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Uniform" id_prefix="grid-alp" value={appData.state.gridSettings.gridUniform} setValue={appData.updateState("SET_GRID_UNIFORM")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Line Thickness" id_prefix="grid-line-thickness" value={appData.state.gridSettings.gridThickness} min_value={1} max_value={10} 
                        step_size={1} min_slider_value={1} max_slider_value={10} setValue={appData.updateState("SET_GRID_THICKNESS")}/>
                    <SidebarSectionElementDivider/>
                    <SiderbarTextDoubleControl 
                        name_left="Lines V" id_left="grid-lines-v" value_left={appData.state.gridSettings.gridX} min_value_left={3} max_value_left={99} setValueLeft={appData.updateState("SET_GRID_X")} 
                        name_right="Lines H" id_right="grid-lines-h" value_right={appData.state.gridSettings.gridY} min_value_right={3} max_value_right={99} setValueRight={appData.updateState("SET_GRID_Y")}
                    /> 
                </SidebarSection>
            </WindowContainer>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Distortion Maps" active={false} resetButtonCallback={appData.updateState("RESET_ERROR_SETTINGS")}>
                    <SidebarCheckboxControl name="Active" id_prefix="show-errors" value={appData.state.errorSettings.errorsActive} setValue={appData.updateState("SET_ERRORS_ACTIVE")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Show Legend" id_prefix="show-error-legend" value={appData.state.errorSettings.errorLegend} setValue={appData.updateState("SET_ERROR_LEGEND")}/>
                    <SidebarSectionElementDivider/>
                    {/*<SidebarCheckboxControl name="Use GPU" id_prefix="use-gpu-errors" value={appData.state.errorSettings.errorsUseGPU} setValue={appData.updateState("SET_ERRORS_USE_GPU")}/>
                    <SidebarSectionElementDivider/>*/}
                    <SidebarSliderControl name="Quality" id_prefix="error-quality" value={appData.state.errorSettings.errorsQuality} min_value={0.2} max_value={5} 
                        min_slider_value={0.2} max_slider_value={1} step_size={0.05} setValue={appData.updateState("SET_ERRORS_QUALITY")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Overlay Opacity" id_prefix="error-overlay-opacity" value={appData.state.persistentState.errorOverlayOpacity} min_value={0.05} max_value={1} 
                        min_slider_value={0.05} max_slider_value={1} step_size={0.05} setValue={appData.updateState("SET_ERROR_OVERLAY_OPACITY")}/>
                </SidebarSection>
            </WindowContainer>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Optimization" active={false} resetButtonCallback={appData.updateState("RESET_OPTIMIZATION_SETTINGS")}>
                    <SidebarCheckboxControl name="Auto-Optimize" id_prefix="optimization-active" value={appData.state.optimizationSettings.optimizationActive} setValue={appData.updateState("SET_OPTIMIZATION_ACTIVE")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Max Iterations" id_prefix="optimization-max-iterations" value={appData.state.optimizationSettings.optimizationMaxIterations} min_value={1} max_value={10000} 
                        min_slider_value={1} max_slider_value={1000} step_size={1} setValue={appData.updateState("SET_OPTIMIZATION_MAX_ITERATIONS")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarLabel><strong>Optimization Weights</strong></SidebarLabel>
                    <SidebarSliderControl name="Horizontal" id_prefix="optimization-xerror-weight" value={appData.state.optimizationSettings.error0Weight} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} setValue={appData.updateState("SET_ERROR0_WEIGHT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Vertical" id_prefix="optimization-yerror-weight" value={appData.state.optimizationSettings.error1Weight} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} setValue={appData.updateState("SET_ERROR1_WEIGHT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Anisotropic" id_prefix="optimization-rerror-weight" value={appData.state.optimizationSettings.error2Weight} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} setValue={appData.updateState("SET_ERROR2_WEIGHT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Angular" id_prefix="optimization-aerror-weight" value={appData.state.optimizationSettings.error3Weight} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} setValue={appData.updateState("SET_ERROR3_WEIGHT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarLabel>
                        <strong>Optimize Parameters</strong>
                    </SidebarLabel>
                    <SidebarCheckboxControl name="Interpolation Factor" id_prefix="optimize-interpolation-factor" value={appData.state.optimizationSettings.optimizeInterpolationFactor} setValue={appData.updateState("SET_OPTIMIZE_INTERPOLATION_FACTOR")}/> 
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Uniformity" id_prefix="optimize-uniformity" value={appData.state.optimizationSettings.optimizeDFactor} setValue={appData.updateState("SET_OPTIMIZE_DFACTOR")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Radius Factor" id_prefix="optimize-radius-factor" value={appData.state.optimizationSettings.optimizeRadiusModifier} setValue={appData.updateState("SET_OPTIMIZE_RADIUS_MODIFIER")}/>                    
                    {!appData.state.optimizationSettings.optimizationActive && <>
                        <SidebarSectionElementDivider/>
                        <SidebarSimpleButton name="Optimize" id="start-optimization" callback={() => {
                            const sendState: AppState = {
                                ...appData.state,
                                optimizationSettings: {
                                    ...appData.state.optimizationSettings,
                                    optimizationActive: true
                                }
                            }
                            ws.sendParameters(sendState);
                        }}/>
                    </>}
                </SidebarSection>
            </WindowContainer>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Plot" active={false} resetButtonCallback={appData.updateState("RESET_PLOT_SETTINGS")}>
                    <SidebarCheckboxControl name="Plot Interpolation" id_prefix="plot-interp" value={appData.state.plotSettings.plotInterp} setValue={appData.updateState("SET_PLOT_INTERP")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Plot IFCurve" id_prefix="plot-ifcurve" value={appData.state.plotSettings.plotIFCurve} setValue={appData.updateState("SET_PLOT_IFCURVE")}/>
                </SidebarSection>
            </WindowContainer>
            <WindowContainer initDetached={false} resizableWhenAttached={false} heightResizableWhenDetached={false} borderWhenAttached={false} borderWhenDetached={false}>
                <SidebarSection title="Advanced" active={false} resetButtonCallback={appData.updateState("RESET_ADVANCED_SETTINGS")}>
                    <SidebarSliderControl name="Artificial Tilt" id_prefix="tilt" value={appData.state.advancedSettings.tilt} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.01} setValue={appData.updateState("SET_TILT")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarSliderControl name="Smoothness" id_prefix="spline-smoothing" value={appData.state.advancedSettings.splineSmoothingDisplay} min_value={0} max_value={1} 
                        min_slider_value={0} max_slider_value={1} step_size={0.001} setValue={(val: number) => {
                            appData.updateState("SET_SPLINE_SMOOTHING_DISPLAY")(val);
                            appData.updateState("SET_SPLINE_SMOOTHING")(mapExponential(val));
                        }}/> 
                    <SidebarSectionElementDivider/> 
                    <SidebarSliderControl name="Command Buffer Size" id_prefix="command-buffer-size" value={appData.state.advancedSettings.commandQueueCapacity} min_value={1} max_value={100} 
                        min_slider_value={1} max_slider_value={100} step_size={1} setValue={appData.updateState("SET_COMMAND_QUEUE_CAPACITY")}/>
                    <SidebarSectionElementDivider/>
                    <SidebarCheckboxControl name="Horizontal Layout" id_prefix="layout-select" value={appData.state.persistentState.mainLayout == "horizontal"} setValue={appData.updateState("TOGGLE_MAIN_LAYOUT")} />                
                </SidebarSection>
            </WindowContainer>
            <Export/>
        </>}
    </WindowsFlexContainer>
}

export default Sidebar;