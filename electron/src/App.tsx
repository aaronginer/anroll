import AppData from "./data/app_data/AppData"
import Layout from "./components/Layout"
import WebSocketService from "./services/WebSocketService"
import AlertService from "./services/AlertService"
function App() {
    return <AppData>
        <AlertService>
            <WebSocketService>
                    <Layout/>
            </WebSocketService>
        </AlertService>
    </AppData>
}

export default App
