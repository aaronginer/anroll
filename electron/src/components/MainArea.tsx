import WindowContainer from "../features/WindowContainer";
import ErrorsContainer from "./ErrorsContainer";
import ImageViewer from "./ImageViewer";
import ModelViewer from "./ModelViewer";
import InterpolationPlot from "./InterpolationPlot";
import IFCurvePlot from "./IFCurvePlot";
import WindowsFlexContainer from "../features/WindowsFlexContainer";
import { useAppData } from "../data/app_data/AppData";
import PreviewContainer from "./PreviewContainer";
import { highlightMaskImageHalf, rotateImage } from "../util/ImageUtil";
import ImageEditor from "./ImageEditor";
import ImageRegionSelector from "./ImageRegionSelector";

function MainArea() {
    const appData = useAppData();

    return <div id="main" className="bg-dark d-flex flex-column flex-fill">
        {!appData.state.dynamicState.modelLoaded && !appData.state.dynamicState.editMode && <>
            {appData.state.persistentState.maskImageUrl != "" && (!appData.state.dynamicState.adjustingModel || appData.state.dynamicState.loadType != "model") &&
                <WindowContainer title="Mask" initDetached={false} detachable={false} widthResizableWhenAttached={false} initHeight={500}>
                    <ImageViewer id="mask-viewer" imageUrl={appData.state.persistentState.maskImageUrl} asyncCallbackOnUpdate={async (dataUrl) => {
                        const rotatedDataUrl = await rotateImage(dataUrl, appData.state.persistentState.maskImageRotation);
                        return highlightMaskImageHalf(rotatedDataUrl, appData.state.persistentState.maskImageUseLeftHalf, appData.state.persistentState.maskImageCenter);
                    }} 
                    editable={true} onEdit={() => {
                        appData.updateState("SET_EDIT_MODE")(true);
                        appData.updateState("SET_EDIT_IMAGE_URL")(appData.state.persistentState.maskImageUrl);
                        appData.updateHooks("SET_UPDATE_EDIT_IMAGE_URL_CALLBACK")(appData.updateState("SET_MASK_IMAGE_URL"));
                    }}/>
                </WindowContainer>
            }
            {appData.state.persistentState.unrollingImageUrl != "" && (!appData.state.dynamicState.adjustingModel || appData.state.dynamicState.loadType != "model") &&
                <WindowContainer title="Unrolling" initDetached={false} detachable={false} widthResizableWhenAttached={false} initHeight={500}>
                    <ImageViewer id="unrolling-viewer" imageUrl={appData.state.persistentState.unrollingImageUrl}/>
                </WindowContainer>
            }
            {appData.state.dynamicState.singlePhotoImageUrl != "" && appData.state.dynamicState.loadType == "singlePhoto" &&
                <WindowContainer title="Photo Viewer" initDetached={false} detachable={false} widthResizableWhenAttached={false} initHeight={500}>
                    <ImageViewer id="photo-viewer" imageUrl={appData.state.dynamicState.singlePhotoImageUrl} asyncCallbackOnUpdate={async (dataUrl) => {
                        const rotatedDataUrl = await rotateImage(dataUrl, appData.state.persistentState.maskImageRotation);
                        return rotatedDataUrl;
                    }}
                    editable={true} onEdit={() => {
                        appData.updateState("SET_EDIT_MODE")(true);
                        appData.updateState("SET_EDIT_IMAGE_URL")(appData.state.dynamicState.singlePhotoImageUrl);
                        appData.updateHooks("SET_UPDATE_EDIT_IMAGE_URL_CALLBACK")(appData.updateState("SET_SINGLE_PHOTO_IMAGE_URL"));
                    }}/>
                </WindowContainer>
            }
            {appData.state.dynamicState.loadType == "model" && <>
                <WindowContainer id="model-viewer-window" title="Model Viewer" initDetached={false} detachable={false} resizableWhenAttached={false} fill={true} hidden={!appData.state.dynamicState.adjustingModel}>
                    <ModelViewer model={appData.state.dynamicState.model}/>
                </WindowContainer>
            </>}
        </>}
        {appData.state.dynamicState.editMode &&
                <WindowContainer id="draw-container" title="Edit Image" initDetached={false} resizableWhenAttached={false}>
                    <ImageEditor id="image-editor" imageUrl={appData.state.dynamicState.editImageUrl}/>
                </WindowContainer>
        }
        {appData.state.dynamicState.modelLoaded && <>
            {appData.state.persistentState.mainLayout == "horizontal" && 
                <div className="bg-dark d-flex flex-row flex-fill" style={{overflowY: "auto"}}>
                    <div className="bg-dark d-flex flex-column flex-fill" style={{width: "75%"}}>
                        <PreviewContainer/>
                    </div>
                    <WindowsFlexContainer classes="bg-dark d-flex flex-column flex-shrink-1" width="25%">
                        {appData.state.errorSettings.errorsActive && 
                            <WindowContainer title="Distortion Maps" initDetached={false} widthResizableWhenAttached={false}>
                                <ErrorsContainer/>
                            </WindowContainer> 
                        }
                        {appData.state.imageSettings.imageRegionSelectorActive &&
                            <WindowContainer title="Region Selector" initDetached={false} resizableWhenAttached={false} fill={true}>
                                <ImageRegionSelector id="image-region-selector" imageUrl={appData.state.persistentState.unrollingImageUrl}/>
                            </WindowContainer>
                        }
                        {appData.state.plotSettings.plotInterp && 
                            <WindowContainer title="Interpolation Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
                                <InterpolationPlot/>
                            </WindowContainer> 
                        }
                        {appData.state.plotSettings.plotIFCurve && 
                            <WindowContainer title="IFCurve Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
                                <IFCurvePlot/>
                            </WindowContainer> 
                        }
                    </WindowsFlexContainer>
                </div>
            }
            {appData.state.persistentState.mainLayout == "vertical" &&
                <div className="bg-dark d-flex flex-column flex-fill" style={{overflowY: "auto"}}>
                    <div className="bg-dark d-flex flex-row flex-fill" style={{height: "75%"}}>
                        <PreviewContainer/>
                    </div>
                    <WindowsFlexContainer classes="bg-dark d-flex flex-row flex-shrink-1" height="25%">
                        {appData.state.errorSettings.errorsActive && 
                            <WindowContainer title="Distortion Maps" initDetached={false} heightResizableWhenAttached={false}>
                                <ErrorsContainer/>
                            </WindowContainer> 
                        }
                        {appData.state.imageSettings.imageRegionSelectorActive &&
                            <WindowContainer title="Region Selector" initDetached={false} resizableWhenAttached={false} fill={true}>
                                <ImageRegionSelector id="image-region-selector" imageUrl={appData.state.persistentState.unrollingImageUrl}/>
                            </WindowContainer>
                        }
                        {appData.state.plotSettings.plotInterp && 
                            <WindowContainer title="Interpolation Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
                                <InterpolationPlot/>
                            </WindowContainer> 
                        }
                        {appData.state.plotSettings.plotIFCurve && 
                            <WindowContainer title="IFCurve Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
                                <IFCurvePlot/>
                            </WindowContainer> 
                        }
                    </WindowsFlexContainer>
                </div>
            }
        </>}     
    </div>
}

/*
<WindowsFlexContainer classes="bg-dark d-flex flex-column flex-shrink-1 flex-grow-1">
    {appData.state.plotSettings.plotInterp && 
        <WindowContainer title="Interpolation Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
            <InterpolationPlot/>
        </WindowContainer> 
    }
    {appData.state.plotSettings.plotIFCurve && 
        <WindowContainer title="IFCurve Plot" initDetached={false} resizableWhenAttached={false} fill={true}>  
            <IFCurvePlot/>
        </WindowContainer> 
    }
</WindowsFlexContainer>
*/

export default MainArea;