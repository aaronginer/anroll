import { useEffect, useRef } from "react";

interface ImageViewerProps {
    id: string,
    imageUrl: string
    asyncCallbackOnUpdate?: ((imageDataUrl: string) => Promise<string>) | null;
    editable?: boolean;
    onEdit?: () => void;
}

function ImageViewer({ id, imageUrl, asyncCallbackOnUpdate = null, editable=false, onEdit=()=>{} }: ImageViewerProps) {
    
    const imageRef = useRef<HTMLImageElement | null>(null);
    
    useEffect(() => {
        if (imageRef.current && imageUrl != "")
        {
            if (!asyncCallbackOnUpdate) imageRef.current.src = imageUrl;
            else {
                asyncCallbackOnUpdate(imageUrl).then((res) => {
                    if (imageRef.current) imageRef.current.src = res;
                })
            }
        }
    }, [imageUrl, asyncCallbackOnUpdate]);

    return <>
        <img ref={imageRef} className="image-viewer p-3" id={id} draggable={false}/>
        {editable && 
            <button className="btn btn-primary" onClick={onEdit} style={{position: "absolute", left: 10, bottom: 10}}>Edit Image</button>
        }
    </>
}

export default ImageViewer;