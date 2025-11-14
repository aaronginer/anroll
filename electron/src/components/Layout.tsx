import MainArea from "./MainArea"
import { useContext } from "react"
import Connecting from "./Connecting"
import { WebSocketContext } from "../services/WebSocketService"
import CommandQueueIndicator from "./StatusIndicator"
import Sidebar from "./Sidebar"
import RecordingOverlay from "./RecordingOverlay"

function Layout() {
    const ws = useContext(WebSocketContext);

    return <>
        {ws.readyState != WebSocket.OPEN && <Connecting/>}
        {ws.readyState == WebSocket.OPEN && <div>
            <div id="layout">
                <RecordingOverlay />
                <div className="bg-dark d-flex flex-row flex-fill">
                    <Sidebar/>
                    <MainArea/>
                </div>
                <CommandQueueIndicator />
            </div>
        </div>}
    </>
}

export default Layout;