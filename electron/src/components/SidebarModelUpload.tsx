
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { useAlertService } from '../services/AlertService';

interface SidebarModelUploadProps {
    name: string;
    id: string;
    model: THREE.Object3D | null;
    setModel: (model: THREE.Object3D | null) => void;
    setModelMaterial: (model: THREE.Material | null) => void;
}

function SidebarModelUpload({ name, id, model, setModel, setModelMaterial }: SidebarModelUploadProps) {
    const alerts = useAlertService();

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const file = e.target.files[0];

        if (file) {
            readFileData(file).then(result => {
                const loader = new PLYLoader();
                const geometry = loader.parse(result as ArrayBuffer);
                // const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
                const material = new THREE.MeshStandardMaterial({ vertexColors: geometry.hasAttribute('color'), color: 0xffffff, side: THREE.DoubleSide });
                const mesh = new THREE.Mesh(geometry, material);
                setModel(mesh);
                setModelMaterial(material);
            }).catch((e) => {
                alerts.addAlert("Failed to load model. File is likely too large.");
                setModel(null);
                setModelMaterial(null);
                console.log(e);
            });
        }
    }

    // https://stackoverflow.com/questions/58409695/when-does-browser-read-the-file-selected-in-input-type-file
    function readFileData(file: Blob): Promise<ArrayBuffer>
    {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = e => {
                const result = e.target?.result;
                if (result instanceof ArrayBuffer)
                {
                    resolve(result);
                }
                else {
                    reject(new Error("Result must be an ArrayBuffer."));
                }
            };

            reader.onerror = () => {
                reject(new DOMException("Problem reading ply file."));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    return <div>
        <input type="file" className="visually-hidden" id={id} accept=".ply" onChange={handleUpload}/>
        <label htmlFor={id} className={"label-button " + (model != null ? "label-button-pos" : "label-button-neg")}>
            <strong>
                {name}
            </strong>
        </label>
    </div>
}

export default SidebarModelUpload;