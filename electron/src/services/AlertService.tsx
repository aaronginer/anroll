import { createContext, useContext, useState, type ReactNode } from "react";

export interface AlertContextType {
    addAlert: (text: string) => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertServicePros
{
    children: ReactNode;
}

function AlertService({children}: AlertServicePros) {
    const [alerts, setAlerts] = useState<Set<string>>(new Set());

    function addAlert(text: string) {
        setAlerts(prev => {
            if (prev.has(text)) return prev;
            const newSet = new Set(prev);
            newSet.add(text);
            return newSet;
        });
    }

    function removeAlert(text: string) {
        setAlerts(prev => {
            if (!prev.has(text)) return prev;
            const newSet = new Set(prev);
            newSet.delete(text);
            return newSet;
        });
    }

    const alertElement = (text: string) => {
        return <div className="alert-item">
            <strong>{text}</strong>
            <button className="btn btn-secondary mt-2" style={{position: "relative"}} onClick={() => removeAlert(text)}>
                Ok
            </button>
        </div> 
    }

    const alertsJSX = [...alerts].map((text) => (
        <div key={text}>
            {alertElement(text)}
        </div>
    ));

    return <AlertContext.Provider value={{addAlert}}>
        <div className="alert-box">            
            {alertsJSX}        
        </div>
        {children}
    </AlertContext.Provider>
}

export function useAlertService() {
    const context = useContext(AlertContext);
    if (!context) throw new Error("useAlertService must be used within AlertContextProvider");
    return context;
}

export default AlertService;