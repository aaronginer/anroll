import LoadingCircleSpinner from "./LoadingCircleSpinner";
import { useAppData } from "../data/app_data/AppData";

/*
<div style={{width:80, height: 40}}>
    <SidebarSimpleButton name="Skip" id="skip-command-queue" callback={ws.fastForwardStatus}/>
</div>
*/
function StatusIndicator() {
    const appData = useAppData();

    const showQueue = appData.state.dynamicState.commandQueueSize > 0;
    const showWorking = !appData.state.dynamicState.canSendCommand;

    // Wenn nichts angezeigt werden soll, gib null zurück
    if (!showQueue && !showWorking) return null;

    return (
        <div
            style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                display: "flex",
                flexDirection: "row",
                gap: 0,
                zIndex: 1000
            }}>
            {showWorking && (
                <div className="d-flex align-items-center justify-content-center rounded-3 m-1"
                    style={{
                        border: "2px solid red",
                        padding: 5,
                        backgroundColor: "var(--bs-gray-900)"
                    }}>
                    <strong style={{ color: "#606060", fontFamily: "Courier New", fontWeight: "bold", paddingRight: 10 }}>
                        Working
                    </strong>
                    <LoadingCircleSpinner width={15} height={15} />
                </div>
            )}
            {showQueue && (
                <div className="d-flex align-items-center justify-content-center rounded-3 m-1"
                    style={{
                        border: "2px solid red",
                        padding: 5,
                        backgroundColor: "var(--bs-gray-900)"
                    }}>
                    <strong style={{ color: "#606060", fontFamily: "Courier New", fontWeight: "bold", paddingRight: 10 }}>
                        {appData.state.dynamicState.commandQueueSize}
                    </strong>
                    <LoadingCircleSpinner width={15} height={15} />
                </div>
            )}
        </div>
    );
}

export default StatusIndicator;