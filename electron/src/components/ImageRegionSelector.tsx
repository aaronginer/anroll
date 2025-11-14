import { useEffect, useRef, useState } from "react";
import { useAppData } from "../data/app_data/AppData";
import { createPortal } from "react-dom";

interface ImageRegionSelectorProps {
    id: string,
    imageUrl: string
}

function ImageRegionSelector({ id, imageUrl }: ImageRegionSelectorProps) {
    const appData = useAppData();

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({x: 0, y: 0}); // translate offsets

    const [selectStart, setSelectStart] = useState({x: 0, y: 0});
    const [selectEnd, setSelectEnd] = useState({x: 0, y: 0});
    const [selectStartGlobal, setSelectStartGlobal] = useState({x: 0, y: 0});
    const [selectEndGlobal, setSelectEndGlobal] = useState({x: 0, y: 0});

    const [leftClickActive, setLeftClickActive] = useState(false);
    const [rightClickActive, setRightClickActive] = useState(false);

    const imageRef = useRef<HTMLImageElement | null>(null);

    const clickDeactivate = (e: any) => {
        if (e.button === 0) {
            if (!leftClickActive) return;
            setLeftClickActive(false);
            const pos = getMousePosition(e);
            if (pos)
            {
                if (pos.ratioY >= 0 && pos.ratioY <= 1)
                {
                    selectEnd.y = pos.ratioY;
                }
                if (pos.ratioX >= 0 && pos.ratioX <= 2)
                {
                    selectEnd.x = pos.ratioX;
                }
            }
            let rot = ((selectStart.x + selectEnd.x) / 2) % 1; // average x positions and normalize to [0, 1]
            rot = (0.5 + (1 - rot)) % 1; // normalize to 0.5 at the center
            appData.updateState("SET_IMAGE_ROTATION")(rot);
            const diffX = Math.min(1, Math.abs(selectStart.x - selectEnd.x));
            const diffY = Math.min(1, Math.abs(selectStart.y - selectEnd.y));

            if (diffX > 0.05) {
                appData.updateState("SET_CROP_LEFT")(0.5 - diffX / 2);
                appData.updateState("SET_CROP_RIGHT")(1 - (0.5 + diffX / 2));
            }
            if (diffY > 0.05) {
                appData.updateState("SET_CROP_TOP")(Math.min(selectStart.y, selectEnd.y));
                appData.updateState("SET_CROP_BOTTOM")(1-Math.max(selectStart.y, selectEnd.y));
            }
        }
        else if (e.button === 2) {
            setRightClickActive(false);
        }
    }
    const clickActivate = (e: any) => {
        const pos = getMousePosition(e);
        if (e.button === 0) {
            if (!pos) return;
            if (pos.ratioY < 0 || pos.ratioY > 1 || pos.ratioX < 0 || pos.ratioX > 2) return;
            setLeftClickActive(true);
            setSelectStart({x: pos.ratioX, y: pos.ratioY});
            setSelectStartGlobal({x: e.clientX, y: e.clientY});
            setSelectEndGlobal({x: e.clientX, y: e.clientY});
        }
        else if (e.button === 2) {
            setRightClickActive(true);
        }
    }

    useEffect(() => {
        window.addEventListener("mouseup", clickDeactivate);
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mouseup", clickDeactivate);
            window.removeEventListener("mousemove", handleMouseMove);
        }
    });

    // GPT assisted
    function getMousePosition(e: any): { pixelX: number, pixelY: number, ratioX: number, ratioY: number } | null { 
        const imageElement = imageRef.current;
        if (!imageElement) return null;

        const rect = imageElement.getBoundingClientRect();
        const styles = window.getComputedStyle(imageElement);

        // Extract paddings
        const paddingLeft = parseFloat(styles.paddingLeft) * zoom;
        const paddingTop = parseFloat(styles.paddingTop) * zoom;
        const paddingRight = parseFloat(styles.paddingRight) * zoom;
        const paddingBottom = parseFloat(styles.paddingBottom) * zoom;

        // Extract borders
        const borderLeft = parseFloat(styles.borderLeftWidth) * zoom;
        const borderTop = parseFloat(styles.borderTopWidth) * zoom;
        const borderRight = parseFloat(styles.borderRightWidth) * zoom;
        const borderBottom = parseFloat(styles.borderBottomWidth) * zoom;

        // Calculate local click position relative to content area
        const contentX = e.clientX - rect.left - borderLeft - paddingLeft;
        const contentY = e.clientY - rect.top - borderTop - paddingTop;

        // Optional: map to content size (e.g., image pixels)
        const contentWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
        const contentHeight = rect.height - paddingTop - paddingBottom - borderTop - borderBottom;

        const ratioX = contentX / contentWidth;
        const ratioY = contentY / contentHeight;

        const pixelX = Math.round(ratioX * imageElement.naturalWidth - 0.5);
        const pixelY = Math.round(ratioY * imageElement.naturalHeight - 0.5);

        return { pixelX, pixelY, ratioX, ratioY };
    }


    const handleMouseMove = (e: any) => {
        if (!rightClickActive && !leftClickActive) return;

        const dx = e.movementX;
        const dy = e.movementY;

        if (rightClickActive)
        {
            setOffset((prevOffset) => ({
                x: prevOffset.x + dx / zoom,
                y: prevOffset.y + dy / zoom
            }));
        }
        else if (leftClickActive)
        {
            const pos = getMousePosition(e);
            if (!pos) return;
            // update x and y seperately for smooth selection
            if (pos.ratioY >= 0 && pos.ratioY <= 1)
            {
                setSelectEnd((prev) => ({...prev, y: pos.ratioY}));
                setSelectEndGlobal((prev) => ({...prev, y: e.clientY}));
            }
            if (pos.ratioX >= 0 && pos.ratioX <= 2)
            {
                setSelectEnd((prev) => ({...prev, x: pos.ratioX}));
                setSelectEndGlobal((prev) => ({...prev, x: e.clientX}));
            }
        }
    }

    const handleWheelZoom = (e: React.WheelEvent) => {
        if (!imageRef.current) return;

        const oldZoom = zoom;

        let newZoom;
        if (e.deltaY < 0) {
            newZoom = Math.min(50, oldZoom*1.2);
        } else {
            newZoom = Math.max(-10, oldZoom*0.8);
        }

        setZoom(newZoom);
    };

    return <>
        <div className="image-editor-container" onWheel={handleWheelZoom}  style={{scale: zoom, transform: `translateY(${offset.y}px) translateX(${offset.x}px)`, imageRendering: "pixelated"}}>
            <img ref={imageRef} src={imageUrl} className="image-editor pt-3 pb-3" id={id} onClick={() => {}} onMouseDown={clickActivate} onContextMenu={(e) => e.preventDefault()} draggable={false}/>
            <img src={imageUrl} className="image-editor pt-3 pb-3" id={id} onClick={() => {}} onMouseDown={clickActivate} onContextMenu={(e) => e.preventDefault()} draggable={false}/>
        </div>

        { leftClickActive &&
            createPortal(<div className="selection-box" style={{
                position: "absolute",
                border: "2px dashed var(--bs-primary)",
                left: Math.min(selectStartGlobal.x, selectEndGlobal.x),
                top: Math.min(selectStartGlobal.y, selectEndGlobal.y),
                width: Math.abs(selectEndGlobal.x - selectStartGlobal.x),
                height: Math.abs(selectEndGlobal.y - selectStartGlobal.y),
                zIndex: 250,
                pointerEvents: "none",
                backgroundColor: "rgba(0, 0, 255, 0.2)"
            }} />, document.body)
        }
    </>
}

export default ImageRegionSelector;