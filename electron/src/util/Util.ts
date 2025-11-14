// blend imageData2 onto imageData1 according to opacity
export function blendImageData(imageData1: ImageData | null, imageData2: ImageData | null, opacity: number): ImageData | null {
    if (!imageData1 || !imageData2) return null;
    
    const width = Math.min(imageData1.width, imageData2.width);
    const height = Math.min(imageData1.height, imageData2.height);

    const newImageData = new ImageData(width, height)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const i1 = (y * imageData1.width + x) * 4;
            const i2 = (y * imageData2.width + x) * 4;
            
            const r1 = imageData1.data[i1];
            const g1 = imageData1.data[i1+1];
            const b1 = imageData1.data[i1+2];
            const a1 = imageData1.data[i1+3];

            const r2 = imageData2.data[i2];
            const g2 = imageData2.data[i2+1];
            const b2 = imageData2.data[i2+2];
            const a2 = imageData2.data[i2+3];

            const alpha1 = a1 / 255;
            const alpha2 = (a2 / 255) * opacity;

            newImageData.data[i] = r2 * alpha2 + r1 * (1 - alpha2);
            newImageData.data[i+1] = g2 * alpha2 + g1 * (1 - alpha2);
            newImageData.data[i+2] = b2 * alpha2 + b1 * (1 - alpha2);
            newImageData.data[i+3] = (alpha2 + alpha1 * (1 - alpha2)) * 255;
        }
    }
    return newImageData;
}

export function displayImageData(canvasId: string, imageData: ImageData | null): void {
    if (!imageData) return;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
}

export async function exportImages(includeErrorMaps: boolean, mask: string, cylUnrolling: string, prefix: string): Promise<void> {
    const directory = await window.showDirectoryPicker();

    if (!directory) {
        console.log("Error choosing directory");
        return;
    }

    const resultBlob = await canvasToPngBlob("preview")
    if (resultBlob) { saveFile(directory, resultBlob, prefix + ".png"); }

    if (includeErrorMaps)
    {
        const xerrorBlob = await canvasToPngBlob("xerror")
        if (xerrorBlob) { saveFile(directory, xerrorBlob, prefix + "_xerror.png"); }
        const yerrorBlob = await canvasToPngBlob("yerror")
        if (yerrorBlob) { saveFile(directory, yerrorBlob, prefix + "_yerror.png"); }
        const xyerrorBlob = await canvasToPngBlob("xyerror")
        if (xyerrorBlob) { saveFile(directory, xyerrorBlob, prefix + "_xyerror.png"); }
        const rerrorBlob = await canvasToPngBlob("rerror")
        if (rerrorBlob) { saveFile(directory, rerrorBlob, prefix + "_rerror.png"); }
    }

    if (mask != "")
    {
        fetch(mask).then(res => res.blob()).then(blob => {
            saveFile(directory, blob, prefix + "_mask.png");
        });
    }

    if (cylUnrolling != "")
    {
        fetch(cylUnrolling).then(res => res.blob()).then(blob => {
            saveFile(directory, blob, prefix + "_cyl.png");
        });
    }
}

export async function exportVideo(video: Blob | null): Promise<void> {
    if (!video) {
        console.log("No video to export");
        return;
    }

    const file = await window.showSaveFilePicker({
        suggestedName: "video.mp4",
        types: [
            {
                description: 'MP4 Video',
                accept: {
                    'video/mp4': ['.mp4'],
                }
            }
        ],
        excludeAcceptAllOption: true
    });

    if (!file) {
        console.log("Error choosing file");
        return;
    }

    const writable = await file.createWritable();
    await writable.write(video);
    await writable.close();
}

async function canvasToPngBlob(canvasId: string): Promise<Blob | null> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;

  if (!canvas) {
    console.log("Error finding canvas");
    return null;
  }

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function saveFile(dir: FileSystemDirectoryHandle, blob: Blob, fname: string)
{
    const file: FileSystemFileHandle | null = await dir.getFileHandle(fname, { create: true });

    if (!file) {
        console.log("Error creating file");
        return;
    }

    const fileWrite: FileSystemWritableFileStream = await file.createWritable();

    await fileWrite.write(blob);
    await fileWrite.close();
}

export async function saveJsonFile(data: string): Promise<void> {
    const handle = await window.showSaveFilePicker({
        suggestedName: "project.json",
        types: [
            {
            description: 'JSON Project File',
            accept: {
                'application/json': ['.json'],
            }
            }
        ],
        excludeAcceptAllOption: true
    });

    if (!handle) 
    {
        console.log("Error creating file handle.");
        return;
    }

    const blob = new Blob([data], {
      type: 'application/json'
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

export async function loadJsonFile(): Promise<string | null> {
    // 1) Show the “Open” picker limited to .json
    const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
            {
            description: 'JSON Files',
            accept: {
                'application/json': ['.json']
            }
            }
        ],
        excludeAcceptAllOption: true
    });
    if (!handle) {
        console.log('No file selected');
        return null;
    }

    const file = await handle.getFile();
    const text = await file.text();
    return text;
}

export function mapExponential(x: number, minValue = 0.000001, base = 1000): number {
    if (x <= 0) return minValue;
    if (x >= 1) return 1;

    const raw = Math.pow(base, x);
    const normalized = (raw - 1) / (base - 1);
    
    return minValue + (1 - minValue) * normalized;
}