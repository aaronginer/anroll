import { useAppData } from "../data/app_data/AppData";
import LoadingCircleSpinner from "./LoadingCircleSpinner";
import SidebarTextInput from "./SidebarTextInput";

function Connecting() {
    const appData = useAppData();
    return <div className="d-flex flex-column align-items-center justify-content-center rounded-3 m-1" style={{border: "2px solid red"}}>
        <div className="d-flex align-items-center mb-3">
            <h2 
                style={{
                    color: "#606060",
                    fontFamily: "Courier New",
                    fontWeight: "bold",
                    margin: 15,
                    marginRight: 20
                }}
            >
                Waiting to Connect
            </h2>
            <LoadingCircleSpinner width={30} height={30}/>
        </div>
        <div className="d-flex align-items-center mb-3" style={{width: "fit-content"}}>
            <SidebarTextInput 
                id="socket-address" 
                placeholder="Enter socket address..." 
                value={appData.state.dynamicState.socketAddress} 
                setValue={appData.updateState("SET_SOCKET_ADDRESS")}
            />
        </div>
    </div>
}

export default Connecting;