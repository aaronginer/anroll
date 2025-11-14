export function createMaskFromPhoto(imgId: string): string {
    const img = document.getElementById(imgId) as HTMLImageElement | null;
    if (!img) return "";
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const bgColor_r = imageData.data[0];
    const bgColor_g = imageData.data[1];
    const bgColor_b = imageData.data[2];

    const boundaries_map = findVaseBoundaries(imageData, bgColor_r, bgColor_g, bgColor_b);

    // set appropriate mask colors for vase shape and background
    for (let h = 0; h < imageData.height; h++)
    {      
        const boundaries = boundaries_map[h];
        for (let w = 0; w < imageData.width; w++)
        {
            const i = (h * imageData.width + w) * 4;      
            // background
            if (boundaries.length == 0 || w < boundaries[0] || w > boundaries[1])
            {
                imageData.data[i] = 0;
                imageData.data[i+1] = 0;
                imageData.data[i+2] = 0;
                imageData.data[i+3] = 255;
            }
            else // vase shape
            {
                imageData.data[i] = 255;
                imageData.data[i+1] = 255;
                imageData.data[i+2] = 255;
                imageData.data[i+3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
}

export function findVaseBoundaries(imageData: ImageData, bgColor_r: number, bgColor_g: number, bgColor_b: number): number[][] {
    const boundaries_map = [];
    for (let h = 0; h < imageData.height; h++)
    {
        const boundaries = []
        // find left boundary 
        for (let w = 0; w < imageData.width; w++)
        {
            const i = (h * imageData.width + w) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i+1];
            const b = imageData.data[i+2];
            const a = imageData.data[i+3];
            if ((r != bgColor_r || g != bgColor_g || b != bgColor_b) && a == 255)
            {
                boundaries.push(w);
                break;
            }
        }
        // find right boundary 
        for (let w = imageData.width-1; w >= 0; w--)
        {
            const i = (h * imageData.width + w) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i+1];
            const b = imageData.data[i+2];
            const a = imageData.data[i+3];
            if ((r != bgColor_r || g != bgColor_g || b != bgColor_b) && a == 255)
            {
                boundaries.push(w);
                break;
            }
        }
        boundaries_map.push(boundaries);
    }
    return boundaries_map;
}

// GPT assisted
export async function rotateImage(imageDataUrl: string, angle: number): Promise<string> {
    const image = new Image();
    image.src = imageDataUrl;

    await image.decode();

    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const radians = angle * Math.PI / 180;

    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    canvas.width = image.width * cos + image.height * sin;
    canvas.height = image.width * sin + image.height * cos;

    const imageData = await dataURLToImageData(imageDataUrl);
    const fillColor = `rgba(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]}, ${imageData.data[3] / 255})`;
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);

    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    return canvas.toDataURL();
}

export async function fillMaskHoles(center: number, imageDataUrl: string): Promise<string> {
    // FILL THE MASK
    // from both sides white pixels are searched toward the center. 
    // If one is found, all pixels up to the center are filled up with white
    const maskImageData = await dataURLToImageData(imageDataUrl);
    const width = maskImageData.width;
    const height = maskImageData.height;
    center = width * center;
    if (!maskImageData) return imageDataUrl;
    for (let y = 0; y < height; y++)
    {
        // left to center
        for (let x = 0; x < center; x++) {
            const i = (y * width + x) * 4;
            if (maskImageData.data[i] == 255 && maskImageData.data[i+1] == 255 && maskImageData.data[i+2]) { // found a white pixel
                for (let fill_x = x; fill_x < center; fill_x++) {
                    const fill_i = (y * width + fill_x) * 4;
                    maskImageData.data[fill_i] = 255;
                    maskImageData.data[fill_i+1] = 255;
                    maskImageData.data[fill_i+2] = 255;
                    maskImageData.data[fill_i+3] = 255;
                }
                break;
            }
        }
        // right to center
        for (let x = width-1; x >= center; x--) {
            const i = (y * width + x) * 4;
            if (maskImageData.data[i] == 255 && maskImageData.data[i+1] == 255 && maskImageData.data[i+2] == 255) { // found a white pixel
                for (let fill_x = x; fill_x >= center; fill_x--) {
                    const fill_i = (y * width + fill_x) * 4;
                    maskImageData.data[fill_i] = 255;
                    maskImageData.data[fill_i+1] = 255;
                    maskImageData.data[fill_i+2] = 255;
                    maskImageData.data[fill_i+3] = 255;
                }
                break;
            }
        }
    }

    return imageDataToDataURL(maskImageData);
}

export async function highlightMaskImageHalf(imageDataUrl: string, useLeft: boolean, center: number): Promise<string> {
    let imageData = await dataURLToImageData(imageDataUrl);

    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const centerLine = Math.floor(imageData.width*center);
    if (useLeft)
    {
        for (let h = 0; h < imageData.height; h++)
        {
            for (let w = 0; w < centerLine; w++) {
                const i = (h * imageData.width + w) * 4;

                imageData.data[i] = imageData.data[i] * 0.7; 
                imageData.data[i+1] = imageData.data[i+1] * 0.7 + 255*0.3;
                imageData.data[i+2] = imageData.data[i+2] * 0.7;
            }
        }

    }
    else
    {
        for (let h = 0; h < imageData.height; h++)
        {
            for (let w = centerLine; w < imageData.width; w++) {
                const i = (h * imageData.width + w) * 4;

                imageData.data[i] = imageData.data[i] * 0.7; 
                imageData.data[i+1] = imageData.data[i+1] * 0.7 + 255*0.3;
                imageData.data[i+2] = imageData.data[i+2] * 0.7;
            }
        }
    }

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
}

export async function maskMirrorHalf(imageDataUrl: string, useLeft: boolean, center: number): Promise<string> {
    let imageData = await dataURLToImageData(imageDataUrl);

    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    let newImageData: ImageData;

    if (useLeft)
    {
        const widthHalf = Math.floor(imageData.width*center);
        newImageData = new ImageData(widthHalf*2, imageData.height);
        for (let h = 0; h < newImageData.height; h++)
        {
            for (let w = 0; w < widthHalf; w++) {
                const w_mirrored = newImageData.width-1-w;
                const i = (h * imageData.width + w) * 4;
                const i_new = (h * newImageData.width + w) * 4;
                const i_new_mirrored = (h * newImageData.width + w_mirrored) * 4;

                newImageData.data[i_new_mirrored] = imageData.data[i]; 
                newImageData.data[i_new_mirrored+1] = imageData.data[i+1];
                newImageData.data[i_new_mirrored+2] = imageData.data[i+2];
                newImageData.data[i_new_mirrored+3] = imageData.data[i+3];
                newImageData.data[i_new] = imageData.data[i]; 
                newImageData.data[i_new+1] = imageData.data[i+1];
                newImageData.data[i_new+2] = imageData.data[i+2];
                newImageData.data[i_new+3] = imageData.data[i+3];
            }
        }

    }
    else
    {
        const widthHalf = imageData.width - Math.floor(imageData.width*center);
        newImageData = new ImageData(widthHalf*2, imageData.height);
        for (let h = 0; h < newImageData.height; h++)
        {
            for (let w = 0; w < widthHalf; w++) {
                const i = (h * imageData.width + (imageData.width-1-w)) * 4;
                const i_new = (h * newImageData.width + (newImageData.width-1-w)) * 4;
                const i_new_mirrored = (h * newImageData.width + w) * 4;

                newImageData.data[i_new_mirrored] = imageData.data[i]; 
                newImageData.data[i_new_mirrored+1] = imageData.data[i+1];
                newImageData.data[i_new_mirrored+2] = imageData.data[i+2];
                newImageData.data[i_new_mirrored+3] = imageData.data[i+3];
                newImageData.data[i_new] = imageData.data[i]; 
                newImageData.data[i_new+1] = imageData.data[i+1];
                newImageData.data[i_new+2] = imageData.data[i+2];
                newImageData.data[i_new+3] = imageData.data[i+3];
            }
        }
    }

    canvas.width = newImageData.width;
    canvas.height = newImageData.height;
    
    ctx.putImageData(newImageData, 0, 0);

    return canvas.toDataURL();
}

// ChatGPT generated
export function dataURLToImageData(dataURL: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };

    img.onerror = (_) => reject(new Error('Image failed to load'));
    img.src = dataURL;
  });
}

export function imageDataToDataURL(imageData: ImageData, pad: boolean = false): string {
    // pad to next fixed resolution (render_size * render_size)
    let imgData = imageData;
    if (pad) {
        const new_width = 1000;
        const new_height = 1000;

        imgData = new ImageData(new_width, new_height);
        imgData.data.fill(0); // fill with transparent black
        const xOffset = Math.floor((new_width - imageData.width) / 2);
        const yOffset = Math.floor((new_height - imageData.height) / 2);
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const i = (y * imageData.width + x) * 4;
                const newI = ((y + yOffset) * new_width + (x + xOffset)) * 4;
                imgData.data[newI] = imageData.data[i];
                imgData.data[newI + 1] = imageData.data[i + 1];
                imgData.data[newI + 2] = imageData.data[i + 2];
                imgData.data[newI + 3] = imageData.data[i + 3];
            }
        }
    }

    const canvas = document.createElement("canvas");
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
}