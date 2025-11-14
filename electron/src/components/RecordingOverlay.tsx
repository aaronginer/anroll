import { useAppData } from "../data/app_data/AppData";

function RecordingOverlay() {
    const appData = useAppData();

    return <>
        {appData.state.dynamicState.recordingVideo && (
            <div className="recording-overlay">
                <div className="recording-overlay-content">
                    <h2>Creating Video</h2>
                    <p>{appData.state.dynamicState.recordingProgress.action}</p>
                    <p>{appData.state.dynamicState.recordingProgress.done} / {appData.state.dynamicState.recordingProgress.of}</p>
                </div>
            </div>
        )}
    </>
}

export default RecordingOverlay;