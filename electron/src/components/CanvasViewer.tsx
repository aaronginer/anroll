import { useEffect, useRef } from "react";
import { displayImageData } from "../util/Util";
import { dataURLToImageData } from "../util/ImageUtil";

interface CanvasViewerProps {
    id: string,
    data: string | ImageData | null,
    clickCallback?: () => void;
}

function CanvasViewer({ id, data, clickCallback=()=>{} }: CanvasViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        if (data == null) return;
        else if (data instanceof ImageData)
        {
            displayImageData(id, data);
        }
        else if (typeof data === "string")
        {
            if (data == "") return;
            dataURLToImageData(data).then(imageData => {
                if (!canvasRef.current) return;
                displayImageData(id, imageData);
            });
        }
    }, [data]);

    return <canvas ref={canvasRef} id={id} className="canvas-viewer p-3" onClick={clickCallback}/>
}

export default CanvasViewer;