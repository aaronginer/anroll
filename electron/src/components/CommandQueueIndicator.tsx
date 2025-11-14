import LoadingCircleSpinner from "./LoadingCircleSpinner";
import { useAppData } from "../data/app_data/AppData";

/*
<div style={{width:80, height: 40}}>
    <SidebarSimpleButton name="Skip" id="skip-command-queue" callback={ws.fastForwardCommandQueue}/>
</div>
*/
function CommandQueueIndicator() {
    const appData = useAppData();

    return <>
        {appData.state.dynamicState.commandQueueSize > 0 && <>
            <div className="d-flex align-items-center justify-content-center rounded-3 m-1" style={{
                border: "2px solid red", position: "absolute", bottom: 0, right: 0, float: "right", padding: 5,
                backgroundColor: "var(--bs-gray-900)"
            }}>
                <strong style={{color: "#606060", fontFamily: "Courier New", fontWeight: "bold", paddingRight: 10}}>{appData.state.dynamicState.commandQueueSize}</strong>
                <LoadingCircleSpinner width={15} height={15}/>
            </div>
        </>
        }
    </>
}

export default CommandQueueIndicator;