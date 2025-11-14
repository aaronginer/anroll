import WindowContainer from "../features/WindowContainer";
import CanvasViewer from "./CanvasViewer";
import { useAppData } from "../data/app_data/AppData";
import error_legend_1d from "../assets/1d_error_legend.png";
import error_legend_2d from "../assets/average_error_legend.png";

function PreviewContainer() {
    const appData = useAppData();
    
    return <WindowContainer title="Preview" initDetached={false} resizableWhenAttached={false} fill={true}>
        <CanvasViewer id="preview" data={appData.state.dynamicState.previewImageData}/>
        <div style={{position: "absolute", float: "right", bottom: 0, right: 0}}>
            {appData.state.errorSettings.errorLegend && <>
                {appData.state.persistentState.errorOverlayTarget == "xyerror" &&
                    <img src={error_legend_2d} width={"200"} />
                }
                {(appData.state.persistentState.errorOverlayTarget == "aerror"
                    || appData.state.persistentState.errorOverlayTarget == "xerror" 
                    || appData.state.persistentState.errorOverlayTarget == "yerror" 
                    || appData.state.persistentState.errorOverlayTarget == "rerror") && 
                    <img src={error_legend_1d} width={"200"} />
                }
            </>}
        </div>
    </WindowContainer>
}

export default PreviewContainer;