import { useEffect, useRef, useState } from "react";
import { useAppData } from "../data/app_data/AppData";

interface ImageEditorProps {
    id: string,
    imageUrl: string
}

function ImageEditor({ id, imageUrl }: ImageEditorProps) {
    const appData = useAppData();

    const [radius, setRadius] = useState(20);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({x: 0, y: 0}); // translate offsets
    const [drawColor, setDrawColor] = useState("white");

    const canDraw = useRef<boolean>(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas") as HTMLCanvasElement);

    const rightClickActive = useRef<boolean>(false);
    const leftClickActive = useRef<boolean>(false);
    // const lastPos = useRef({x: 0, y: 0});

    const clickDeactivate = (e: any) => {
        if (e.button === 0) {
            leftClickActive.current = false;
        }
        else if (e.button === 2) {
            rightClickActive.current = false;
        }
    }
    const clickActivate = (e: any) => {
        if (e.button === 0) {
            leftClickActive.current = true;
        }
        else if (e.button === 2) {
            rightClickActive.current = true;
        }
    }
    useEffect(() => {
        window.addEventListener("mouseup", clickDeactivate);
        return () => {
            window.removeEventListener("mouseup", clickDeactivate);
        }
    });

    const initCanvas = () => {
        if (!imageRef.current) return
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        canvasRef.current.width = imageRef.current.naturalWidth;
        canvasRef.current.height = imageRef.current.naturalHeight;
        ctx.drawImage(imageRef.current, 0, 0);
        canDraw.current = true;
    };

    // GPT assisted
    // coordinate calculation
    function getMousePosition(e: any): { pixelX: number, pixelY: number } | null { 
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

        // Clamp to avoid negatives if click is outside content
        const safeX = Math.max(0, contentX);
        const safeY = Math.max(0, contentY);

        // Optional: map to content size (e.g., image pixels)
        const contentWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
        const contentHeight = rect.height - paddingTop - paddingBottom - borderTop - borderBottom;

        const pixelX = Math.round((safeX / contentWidth) * imageElement.naturalWidth - 0.5);
        const pixelY = Math.round((safeY / contentHeight) * imageElement.naturalHeight - 0.5);

        return { pixelX, pixelY };
    } 

    function draw(e: any) {
        if (!canDraw.current) return;

        const pos = getMousePosition(e);
        if (!pos) return;
        //const dx = Math.abs(pos.pixelX - lastPos.current.x);
        //const dy = Math.abs(pos.pixelY - lastPos.current.y);
        //if (dx < 0.5 && dy < 0.5) return; // no movement
        //lastPos.current = {x: pos.pixelX, y: pos.pixelY};
        
        drawAt(pos.pixelX, pos.pixelY);

        const dataUrl = canvasRef.current.toDataURL();
        
        if (imageRef.current)
        {
            imageRef.current.src = dataUrl;
        }
    }

    function save() {
        appData.updateState("SET_EDIT_MODE")(false);
        if (!canDraw.current) return;
        appData.hooks.updateEditImageUrlCallback(canvasRef.current.toDataURL());
    }

    // GPT assisted
    function drawAt(x: number, y: number) 
    {
        const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const { data, width, height } = imageData;

        const color: number[] = drawColor === "white" ? [255, 255, 255, 255] : drawColor === "black" ? [0, 0, 0, 255] : [0, 0, 0, 0];

        if (radius == 0)
        {
            const idx = (y * width + x) * 4;
            data[idx] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            data[idx + 3] = color[3];
        }
        else
        {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const px = x + dx;
                    const py = y + dy;
                    if (
                        px >= 0 && px < width &&
                        py >= 0 && py < height &&
                        dx * dx + dy * dy <= radius * radius
                    ) {
                        const idx = (py * width + px) * 4;
                        data[idx] = color[0];   
                        data[idx + 1] = color[1];
                        data[idx + 2] = color[2];
                        data[idx + 3] = color[3];
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!rightClickActive.current && !leftClickActive.current) return;

        if (rightClickActive.current)
        {
            const dx = e.movementX;
            const dy = e.movementY;

            setOffset((prevOffset) => ({
                x: prevOffset.x + dx / zoom,
                y: prevOffset.y + dy / zoom
            }));
        }
        else if (leftClickActive.current)
        {
            draw(e);
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

    function handleClick(e: React.MouseEvent<HTMLImageElement>) {
        draw(e);
    }

    return <>
        <div className="image-editor-container">
            <img ref={imageRef} src={imageUrl} onLoad={initCanvas} className="image-editor p-3" id={id} onClick={handleClick} onWheel={handleWheelZoom} onMouseDown={clickActivate} onContextMenu={(e) => e.preventDefault()} onMouseMove={handleMouseMove} draggable={false} style={{scale: zoom, transform: `translateY(${offset.y}px) translateX(${offset.x}px)`, imageRendering: "pixelated"}}/>
        </div>
        <button className="btn btn-primary" onClick={save} style={{position: "absolute", left: 10, bottom: 10}}>Save</button>
        <button className="btn btn-primary" onClick={() => appData.updateState("SET_EDIT_MODE")(false)} style={{position: "absolute", left: 80, bottom: 10}}>Discard</button>
        <div style={{ position: "absolute", bottom: 5, right: 2, display: "flex", alignItems: "center" }}>
            <input className="form-range"  type="range" value={radius} min={1} max={100} step={1} 
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{ cursor: "pointer", width: 150 }}
            />
            <label style={{ height: 35, width: 130, marginLeft: "5px", color: "#222222", backgroundColor: "#aaaaaa", padding: "5px", borderRadius: "5px" }}>Stroke Size: {radius}</label>
        </div>
        <div className={drawColor == "white" ? "image-editor-color-selected" : "image-editor-color-not-selected"} style={{position: "absolute", right: 15, bottom: 45, width: 30, height: 30, backgroundColor: "white"}} onClick={() => setDrawColor("white")}></div>
        <div className={drawColor == "black" ? "image-editor-color-selected" : "image-editor-color-not-selected"} style={{position: "absolute", right: 50, bottom: 45, width: 30, height: 30, backgroundColor: "black"}} onClick={() => setDrawColor("black")}></div>
        <div className={drawColor == "transparent" ? "image-editor-color-selected" : "image-editor-color-not-selected"} style={{position: "absolute", right: 85, bottom: 45, width: 30, height: 30}} onClick={() => setDrawColor("transparent")}></div>
    </>
}

export default ImageEditor;