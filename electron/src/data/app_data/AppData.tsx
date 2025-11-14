import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { reducer, reducerHooks, type ActionType } from "./Reducer";
import { initHooks, initState, type AppState, type Hooks } from "./State";

export interface AppDataContextType {
  state: AppState;
  hooks: Hooks;
  stateRef: React.RefObject<AppState>;
  hooksRef: React.RefObject<Hooks>;
  updateState: (type: ActionType) => (payload?: any) => void;
  updateHooks: (type: ActionType) => (payload?: any) => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProps
{
    children: ReactNode;
}

function AppData({children}: AppDataProps) {
    const [state, dispatch] = useReducer(reducer, initState);
    const [hooks, dispatchHooks] = useReducer(reducerHooks, initHooks);

    const stateRef = useRef<AppState>(initState);
    const hooksRef = useRef<Hooks>(initHooks);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        hooksRef.current = hooks;
    }, [hooks]);

    function updateState(type: ActionType): (payload?: any) => void {
        return (payload: any = undefined) => dispatch({type: type, payload: payload});
    } 

    function updateHooks(type: ActionType): (payload?: any) => void {
        return (payload: any = undefined) => dispatchHooks({type: type, payload: payload});
    } 

    return <AppDataContext.Provider value={{state, hooks, stateRef, hooksRef, updateState, updateHooks}}>
        {children}
    </AppDataContext.Provider>
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (!context) throw new Error("useAppData must be used within AppDataProvider");
    return context;
}

export default AppData;