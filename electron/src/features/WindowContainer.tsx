import { useState, useEffect, useRef, useCallback, type ReactNode, useContext } from "react";
import { WindowsFlexContainerContext } from "./WindowsFlexContainer";

interface WindowContainerProps {
    children?: ReactNode;
    id?: string;
    detachable?: boolean;
    initDetached?: boolean;
    title?: string,
    initWidth?: number;
    initHeight?: number;
    initPosX?: number;
    initPosY?: number;
    minWidth?: number;
    minHeight?: number;
    borderWhenAttached?: boolean;
    borderWhenDetached?: boolean;
    widthResizableWhenAttached?: boolean;
    widthResizableWhenDetached?: boolean;
    heightResizableWhenAttached?: boolean;
    heightResizableWhenDetached?: boolean;
    resizableWhenAttached?: boolean;
    resizableWhenDetached?: boolean;
    fill?: boolean;
    hidden?: boolean;
}

type ResizeHandle = "top" | "right" | "bottom" | "left" | "position" | null;

function WindowContainer({ children, id="", title = "", 
        detachable = true, initDetached = true,  
        initWidth = 200, initHeight = 200, initPosX = 50, initPosY = 50, 
        minWidth = 30, minHeight = 30, 
        borderWhenAttached = true, borderWhenDetached = true, 
        widthResizableWhenAttached = true, widthResizableWhenDetached = true,
        heightResizableWhenAttached = true, heightResizableWhenDetached = true,
        resizableWhenAttached = true, resizableWhenDetached = true, fill = false, hidden = false
    }: WindowContainerProps) {
    const wcc = useContext(WindowsFlexContainerContext);

    const [width, setWidth] = useState(initWidth);
    const [height, setHeight] = useState(initHeight);
    const [posX, setPosX] = useState(initPosX);
    const [posY, setPosY] = useState(initPosY);
    const [cursor, setCursor] = useState("default");
    const [detached, setDetached] = useState(initDetached)
    const [canResizeWidth, setCanResizeWidth] = useState(false);
    const [canResizeHeight, setCanResizeHeight] = useState(false);

    const containerRef = useRef(null);

    const dragInfo = useRef({
    isActive: false,
    handle: null as ResizeHandle,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0
    });

    useEffect(() => {
        if (!wcc) return;
        // TODO: careful, this is buggy when windows start off in detached mode!
        wcc.updateNumWindows(false);
        return () => {
            wcc.updateNumWindows(true);
        };
    }, [initDetached]);

    useEffect(() => {
        setCanResizeWidth((detached && widthResizableWhenDetached && resizableWhenDetached) || (!detached && widthResizableWhenAttached && resizableWhenAttached));
        setCanResizeHeight((detached && heightResizableWhenDetached && resizableWhenDetached) || (!detached && heightResizableWhenAttached && resizableWhenAttached));
        
    }, [detached]);

    const handleDrag = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isActive) return;

        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;

        switch (dragInfo.current.handle) {
            case "right":
                setWidth(Math.max(dragInfo.current.startWidth + dx, minWidth));
                break;
            case "left":
                setWidth(Math.max(dragInfo.current.startWidth - dx, minWidth));
                setPosX(Math.min(window.innerWidth-30, Math.max(10, dragInfo.current.startPosX + dx)));
                break;
            case "bottom":
                setHeight(Math.max(dragInfo.current.startHeight + dy, minHeight));
                break;
            case "top":
                setHeight(Math.max(dragInfo.current.startHeight - dy, minHeight));
                setPosY(Math.min(window.innerHeight-30, Math.max(10, dragInfo.current.startPosY + dy)));
                break;
            case "position":
                setPosX(Math.min(window.innerWidth-30, Math.max(10, dragInfo.current.startPosX + dx)));
                setPosY(Math.min(window.innerHeight-30, Math.max(10, dragInfo.current.startPosY + dy)));
                break;
            default:
                break;
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        dragInfo.current.isActive = false;
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleDragEnd);
    }, [handleDrag]);


    const updateCursor = (e: React.MouseEvent<HTMLDivElement>) => {
        if (dragInfo.current.isActive) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const threshold = 10;

        const nearLeft = e.clientX - rect.left < threshold;
        const nearRight = rect.right - e.clientX < threshold;
        const nearTop = e.clientY - rect.top < threshold;
        const nearBottom = rect.bottom - e.clientY < threshold;

        if (canResizeWidth && nearRight) setCursor("col-resize");
        else if (canResizeWidth && nearLeft) setCursor("col-resize");
        else if (canResizeHeight && nearBottom) setCursor("row-resize");
        else if (canResizeHeight && !detached && nearTop) setCursor("row-resize");
        else if (detached && nearTop) setCursor("all-scroll")
        else setCursor("default");
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const threshold = 10;

        const nearLeft = e.clientX - rect.left < threshold;
        const nearRight = rect.right - e.clientX < threshold;
        const nearTop = e.clientY - rect.top < threshold;
        const nearBottom = rect.bottom - e.clientY < threshold;

        let handle: ResizeHandle = null;
        if (canResizeWidth && nearRight) handle = "right";
        else if (canResizeWidth && nearLeft) handle = "left";
        else if (canResizeHeight && nearBottom) handle = "bottom";
        else if (canResizeHeight && !detached && nearTop) handle = "top";
        else if (detached && nearTop) handle = "position";

        if (!handle) return;

        dragInfo.current = {
            isActive: true,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: width,
            startHeight: height,
            startPosX: posX,
            startPosY: posY
        };

        window.addEventListener("mousemove", handleDrag);
        window.addEventListener("mouseup", handleDragEnd);
    };

    const toggleDetach = () => {
        if (wcc)
        {
            wcc.updateNumWindows(!detached);
        }
        setDetached(!detached);
    }

    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleDragEnd);
        };
    }, [handleDrag, handleDragEnd]);

    
    const detachedStyle: React.CSSProperties = detached ? {
        position: "absolute",
        left: posX + "px",
        top: posY + "px",
        zIndex: 200
    } : {};

    const fillStyle: React.CSSProperties = !detached && fill ? {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0
    } : {};

    const widthStyle: React.CSSProperties = canResizeWidth ? {
        width: width+"px",
    } : {};

    const heightStyle: React.CSSProperties = canResizeHeight ? {
        height: height+"px",
    } : {};

    const borderStyle: React.CSSProperties = (detached && borderWhenDetached) || (!detached && borderWhenAttached) ? {
        borderStyle: "solid",
        borderColor: "var(--bs-gray-600)",
        margin: "3px",
    } : {};

    const extraStyle: React.CSSProperties = {
        
    };

    return <div ref={containerRef}
        className={"window-container rounded-2 d-flex flex-column" + (hidden ? " visually-hidden" : "")}
        style={{
            ...widthStyle,
            ...heightStyle,
            ...detachedStyle,
            ...borderStyle,
            ...fillStyle,
            ...extraStyle,
            cursor: cursor,
            minWidth: 0,
            minHeight: 0,
            maxWidth: "100%",
            maxHeight: "100%"
        }}
        onMouseMove={updateCursor}
        onMouseDown={onMouseDown}
    >
        <div className="window-container-content d-flex flex-column flex-fill" onContextMenu={(e) => e.preventDefault()}>
            {title != "" && <>
                    <strong style={{color: "var(--bs-gray-600)", paddingLeft: 5, pointerEvents: "none", zIndex: 100}}>
                        {title}
                    </strong>
                </>
            }
            {detachable && <button className="detach-button" onClick={toggleDetach}></button>}
            <div id={id} className="d-flex flex-fill flex-column" style={{minHeight: 0}}>
                {children}
            </div>
        </div>
    </div> 
}

export default WindowContainer;