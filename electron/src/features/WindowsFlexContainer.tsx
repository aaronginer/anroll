import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export const WindowsFlexContainerContext = createContext<any>(null);

interface WindowsFlexContainerProps {
    children: ReactNode,
    id?: string,
    classes: string;
    width?: string;
    height?: string;
}

function WindowsFlexContainer({ children, id="", classes, width="", height="" }: WindowsFlexContainerProps) {
    const wcc = useContext(WindowsFlexContainerContext);
    const [numWindows, setNumWindows] = useState(0);

    const updateNumWindows = useCallback((detached: boolean) =>
    {
        setNumWindows(prevNumWindows => prevNumWindows + (detached ? -1 : 1));
        if (wcc) // allows for nested WindowsFlexContainers
        {
            wcc.updateNumWindows(detached);
        }
    }, []);
    
    const contextValue = {
        updateNumWindows,
    }

    return <WindowsFlexContainerContext.Provider value={contextValue}>
        <div id={id} className={classes} style={{
            width: (numWindows > 0 ? width : "0px"), height: (numWindows > 0 ? height : "0px"), 
            margin: 1, overflowY: "auto", overflowX: "auto", minWidth: 0, minHeight: 0
        }}>
            {children}
        </div>
    </WindowsFlexContainerContext.Provider>
}

export default WindowsFlexContainer;