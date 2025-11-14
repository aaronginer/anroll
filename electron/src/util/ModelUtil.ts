import * as THREE from "three";
import { dataURLToImageData, findVaseBoundaries } from "./ImageUtil";
import Delaunator from "delaunator";

export function unrollModelCyl(model: THREE.Mesh | null, material: THREE.Material | null, width: number, brightness: number, setUnrollingUrl: (img: string) => void) {
    if (!model || !material) return;
    const mesh = deepCopyMesh(model);

    // Bake transformation into geometry
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);
    mesh.scale.set(1, 1, 1)

    let bb = new THREE.Box3();
    bb.setFromObject(mesh);
    let bbSize = new THREE.Vector3();
    bb.getSize(bbSize);

    const min_z = bb.min.z;
    const max_z = bb.max.z;

    const max_x = bb.max.x;
    const r = max_x / 2;

    const vertices = mesh.geometry.attributes.position;
    
    //******************************************
    // map vertices to cylinder around z axis and flatten them
    //******************************************
    for (let i = 0; i < vertices.count; i++)
    {
        const pos = new THREE.Vector3(vertices.getX(i), vertices.getY(i), vertices.getZ(i))

        const center = new THREE.Vector3(0, 0, pos.z);
        const center_neg = new THREE.Vector3().copy(center).multiplyScalar(-1);
        const vec = new THREE.Vector3().copy(pos).add(center_neg);
        const center_distance = vec.length();
        vec.normalize();
        const new_pos = center.add(vec.multiplyScalar(r));

        // map to plane along xz plane
        const phi = Math.atan2(new_pos.x, new_pos.y);
        const u = phi;
        const v = (new_pos.z - min_z);

        vertices.setX(i, u * r); // extent is now [-r*pi, r*pi], r being the max radius of the model
        vertices.setY(i, center_distance - r); // make sure that points closer to the center are mapped further from the camera
        vertices.setZ(i, v - ((max_z-min_z)/2));
    }

    //******************************************
    // remove invalid triangles (seam)
    // duplicate vertices on each side and add new triangles to remove seam in unrolled image
    //******************************************
    const indices = mesh.geometry.index;
    const colors = mesh.geometry.attributes.color;

    const newIndices = [];
    const newVertices = Array.from(vertices.array);
    const newColors = Array.from(colors.array);

    const newSeamVertices = []; // added vertices at seam
    const newSeamColors = []; // added vertices at seam
    const newSeamIndices = []; // added triangles at seam

    let newVerticesCurrentIndex = vertices.count;

    if (indices == null) 
    {
        console.log("Model has no index buffer!");
        return;
    }

    for (let i = 0; i < indices.count; i+=3)
    {
        const i0 = indices.getX(i);
        const i1 = indices.getX(i+1);
        const i2 = indices.getX(i+2);

        const v0 = new THREE.Vector3(vertices.getX(i0), vertices.getY(i0), vertices.getZ(i0));
        const v1 = new THREE.Vector3(vertices.getX(i1), vertices.getY(i1), vertices.getZ(i1));
        const v2 = new THREE.Vector3(vertices.getX(i2), vertices.getY(i2), vertices.getZ(i2));
    
        const xs = [v0.x, v1.x, v2.x];
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);

        // its not a seam triangle
        if (maxX - minX < r * Math.PI)
        {
            newIndices.push(i0, i1, i2);
        }
        // it is a seam triangle
        else
        {
            const newLeft = [v0.clone(), v1.clone(), v2.clone()];
            const newRight = [v0.clone(), v1.clone(), v2.clone()];

            const newTColors = [new THREE.Color(colors.getX(i0), colors.getY(i0), colors.getZ(i0)),
                            new THREE.Color(colors.getX(i1), colors.getY(i1), colors.getZ(i1)),
                            new THREE.Color(colors.getX(i2), colors.getY(i2), colors.getZ(i2))];

            for (let v of newLeft)
            {
                if (v.x > 0) v.x -= r * 2 * Math.PI; // move to right side
            }
            for (let v of newRight)
            {
                if (v.x < 0) v.x += r * 2 * Math.PI; // move to left side
            }

            for (let v of newLeft) newSeamVertices.push(v.x, v.y, v.z); // left triangle vertices
            for (let v of newRight) newSeamVertices.push(v.x, v.y, v.z); // right triangle vertices
            newSeamIndices.push(newVerticesCurrentIndex, newVerticesCurrentIndex+1, newVerticesCurrentIndex+2); // left triangle
            newSeamIndices.push(newVerticesCurrentIndex+3, newVerticesCurrentIndex+4, newVerticesCurrentIndex+5); // right triangle
            newVerticesCurrentIndex += 6;
            for (let c of newTColors) newSeamColors.push(c.r, c.g, c.b); // left triangle colors
            for (let c of newTColors) newSeamColors.push(c.r, c.g, c.b); // right triangle colors
        }
    }

    newIndices.push(...newSeamIndices);
    newVertices.push(...newSeamVertices);
    newColors.push(...newSeamColors);

    mesh.geometry.setIndex(newIndices);
    
    const positionAttr = new THREE.Float32BufferAttribute(newVertices, 3);
    mesh.geometry.setAttribute("position", positionAttr);

    const colorAttr = new THREE.Float32BufferAttribute(newColors, 3);
    mesh.geometry.setAttribute("color", colorAttr);

    mesh.geometry.computeVertexNormals();
    mesh.geometry.attributes.position.needsUpdate = true;

    mesh.material = material;

    // *****************************
    // MODEL RENDERING
    // *****************************

    const height = width * ((max_z-min_z)/(r*2*Math.PI));

    // Scene
    const scene = new THREE.Scene();
    scene.add(mesh);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, brightness);
    scene.add(ambientLight);

    // Camera
    const aspect = width / height;

    const frustumSize = max_z-min_z;
    const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 5000);
    camera.position.set(0, 1.1*r, 0);
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true});
    renderer.setSize(width, height);

    renderer.render(scene, camera);
    renderer.setClearColor(0xffffff, 0);

    // CLEANUP
    destroyObject(mesh);
    sceneCleanup(scene);
    renderer.dispose();
    

    const dataURL = renderer.domElement.toDataURL("image/png");
    setUnrollingUrl(dataURL);
}

// ChatGPT generated helper
function pad2DPointsTo3D(points2D: number[]): number[] {
  const points3D: number[] = [];

  for (let i = 0; i < points2D.length; i += 2) {
    const x = points2D[i];
    const y = points2D[i + 1];
    points3D.push(x, y, 0); // z = 0 padding
  }

  return points3D;
}

// ChatGPT generated helper
function sRGBToLinear(c: number): number {
  c /= 255;
  return Math.max(0, Math.min(1, (c <= 0.04045) ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4)));
}

// GPT assisted for model creation
export async function unrollPhotoCyl(imageDataUrl: string, center: number): Promise<string> {
    const imageData = await dataURLToImageData(imageDataUrl);

    const bgColor_r = imageData.data[0];
    const bgColor_g = imageData.data[1];
    const bgColor_b = imageData.data[2];

    const boundaries_map = findVaseBoundaries(imageData, bgColor_r, bgColor_g, bgColor_b);

    const centerLine = Math.floor(imageData.width*center) + 0.5;
    const points: number[] = [];
    const colors: number[] = [];
    let height = 0;
    // map pixels from input image to cyl unrolled pixels
    for (let h = 0; h < imageData.height; h++)
    {        
        const boundaries = boundaries_map[h];
        if (boundaries.length == 0) continue;
        height++;
        for (let w = 0; w < imageData.width; w++)
        {
            if (w < boundaries[0] || w > boundaries[1]) continue;

            const i = (h * imageData.width + w) * 4;
            const sin = Math.abs(centerLine-w) / Math.abs(centerLine - ((w < centerLine) ? boundaries[0] : boundaries[1]));

            const arc = Math.asin(sin) * imageData.width * ((w < centerLine) ? -1 : 1);

            colors.push(sRGBToLinear(imageData.data[i]));
            colors.push(sRGBToLinear(imageData.data[i+1]));
            colors.push(sRGBToLinear(imageData.data[i+2]));
            colors.push(sRGBToLinear(imageData.data[i+3]));

            points.push(arc); // x
            points.push(imageData.height-h); // y
        }
    }

    const delaunay = new Delaunator(points);

    const points3d = pad2DPointsTo3D(points);

    // Create geometry from points, colors and triangles
    const geometry = new THREE.BufferGeometry();

    const positionAttr = new THREE.Float32BufferAttribute(points3d, 3);
    geometry.setAttribute("position", positionAttr);

    const colorAttr = new THREE.Float32BufferAttribute(colors, 4);
    geometry.setAttribute("color", colorAttr);

    geometry.setIndex(new THREE.Uint32BufferAttribute(delaunay.triangles, 1));

    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });

    const mesh = new THREE.Mesh(geometry, material);

    // Scene
    const scene = new THREE.Scene();
    scene.add(mesh);

    // Camera
    const camera = new THREE.OrthographicCamera(-imageData.width*Math.PI, imageData.width*Math.PI, height / 2, height / -2, 0.1, 5000);
    camera.position.set(0, imageData.height/2, 200);
    camera.up = new THREE.Vector3(0, 1, 0);
    camera.lookAt(new THREE.Vector3(0, imageData.height/2, 0));
    scene.add(camera);
    
    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true, precision: "highp" });
    renderer.setSize(Math.max(imageData.width, imageData.height), Math.max(imageData.width, imageData.height));
    renderer.setClearColor(0x000000, 1);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.render(scene, camera);

    const dataURL = renderer.domElement.toDataURL("image/png");

    destroyObject(mesh);
    sceneCleanup(scene);
    renderer.dispose();
    
    return dataURL;
}

export function renderMask(model: THREE.Mesh | null): string {
    if (!model) return "";

    const mesh = deepCopyMesh(model);

    const width = 1000;
    const height = 1000;

    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    mesh.material = whiteMaterial;

    // Scene
    const scene = new THREE.Scene();

    // model bounding box
    const bb = new THREE.Box3();
    bb.setFromObject(mesh);
    const bbSize = new THREE.Vector3();
    bb.getSize(bbSize);

    scene.add(mesh);

    // Camera
    const aspect = width / height;

    const frustumSize = Math.max(Math.max(bbSize.x, bbSize.y), bbSize.z) * 1.1; // make view thrustum just large enough for the mask
    const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 5000);
    camera.position.set(0, 200, bb.min.z + ((bb.max.z - bb.min.z)/2));
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, bb.min.z + ((bb.max.z - bb.min.z)/2)));
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true});
    renderer.setSize(width, height);

    renderer.render(scene, camera);
    renderer.setClearColor(0x000000, 1);

    // CLEANUP
    destroyObject(mesh);
    sceneCleanup(scene);
    whiteMaterial.dispose();
    renderer.dispose();

    const dataURL = renderer.domElement.toDataURL("image/png");
    return dataURL
}

function deepCopyMesh(mesh: THREE.Mesh): THREE.Mesh {
    const newMesh = mesh.clone(false);
    newMesh.geometry = mesh.geometry.clone();
    if (Array.isArray(mesh.material)) {
        newMesh.material = mesh.material.map(material => material.clone());
    } else {
        newMesh.material = mesh.material.clone();
    }
    return newMesh;
}

export function sceneCleanup(scene: THREE.Scene) {
    scene.traverse(object => {
        const o = object as any;
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
            if (Array.isArray(o.material)) {
                o.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
                o.material.dispose();
            }
        }
    });
}

export function destroyObject(obj: THREE.Mesh) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: THREE.Material) => mat.dispose());
        } else {
            obj.material.dispose();
        }
    }
}