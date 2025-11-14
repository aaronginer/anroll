import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { reducer, type Action, type ActionType } from "./Reducer";
import { initState, type AppState } from "./State";

export interface AppDataContextType {
  state: AppState;
  stateRef: React.RefObject<AppState>;
  dispatch: React.Dispatch<Action>;
  updateState: (type: ActionType) => (payload?: any) => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProps
{
    children: ReactNode;
}

function AppData({children}: AppDataProps) {
    const [state, dispatch] = useReducer(reducer, initState);
    const stateRef = useRef<AppState>(initState);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    function updateState(type: ActionType): (payload?: any) => void {
        return (payload: any = undefined) => dispatch({type: type, payload: payload});
    } 

    return <AppDataContext.Provider value={{state, stateRef, dispatch, updateState}}>
        {children}
    </AppDataContext.Provider>
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (!context) throw new Error("useAppData must be used within AppDataProvider");
    return context;
}

export default AppData;