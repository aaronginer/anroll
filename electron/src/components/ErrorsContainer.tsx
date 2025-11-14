import CanvasViewer from "./CanvasViewer";
import { useAppData } from "../data/app_data/AppData";

function ErrorsContainer() {
    const appData = useAppData();

    const activeStyle: React.CSSProperties = {
        backgroundColor: "var(--bs-gray-800)",
    }

    return <>
        <div className="d-flex" style={{minHeight: 0}}>
            <div className="d-flex flex-fill clickable position-relative justify-content-center" style={appData.state.persistentState.errorOverlayTarget == "xerror" ? activeStyle : {}} 
                onClick={() => {appData.updateState("TOGGLE_ERROR_OVERLAY_TARGET")("xerror");}}>
                <CanvasViewer id="xerror" data={appData.state.dynamicState.errorImageData1}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>Horizontal</strong>
            </div>
            <div className={"d-flex flex-fill clickable position-relative justify-content-center"} style={appData.state.persistentState.errorOverlayTarget == "yerror" ? activeStyle : {}} 
                onClick={() => {appData.updateState("TOGGLE_ERROR_OVERLAY_TARGET")("yerror");}}>
                <CanvasViewer id="yerror" data={appData.state.dynamicState.errorImageData2}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>Vertical</strong>
            </div>
        </div>
        <div className="d-flex" style={{minHeight: 0 }}>
            <div className="d-flex flex-fill clickable position-relative justify-content-center" style={appData.state.persistentState.errorOverlayTarget == "rerror" ? activeStyle : {}}
                onClick={() => {appData.updateState("TOGGLE_ERROR_OVERLAY_TARGET")("rerror");}}>
                <CanvasViewer id="rerror" data={appData.state.dynamicState.errorImageData4}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>Anisotropic</strong>
            </div>
            <div className="d-flex flex-fill clickable position-relative justify-content-center" style={appData.state.persistentState.errorOverlayTarget == "aerror" ? activeStyle : {}} 
                onClick={() => {appData.updateState("TOGGLE_ERROR_OVERLAY_TARGET")("aerror");}}>
                <CanvasViewer id="aerror" data={appData.state.dynamicState.errorImageData5}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>Angular</strong>
            </div>
        </div>
        <div className="d-flex" style={{minHeight: 0 }}>
            <div className="d-flex flex-fill clickable position-relative justify-content-center" style={appData.state.persistentState.errorOverlayTarget == "xyerror" ? activeStyle : {}} 
                onClick={() => {appData.updateState("TOGGLE_ERROR_OVERLAY_TARGET")("xyerror");}}>
                <CanvasViewer id="xyerror" data={appData.state.dynamicState.errorImageData3}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>H/V Average </strong>
            </div>
            <div className="d-flex flex-fill position-relative justify-content-center" style={{opacity: 0}} 
                onClick={() => {}}>
                <CanvasViewer id="xyerror-copy" data={appData.state.dynamicState.errorImageData3}/>
                <strong style={{position: "absolute", top: -2, color: "var(--bs-gray-600)", fontSize: "0.6em"}}>H/V Average Copy</strong>
            </div>
        </div>
    </>
}

export default ErrorsContainer;