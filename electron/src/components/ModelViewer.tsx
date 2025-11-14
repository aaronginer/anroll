import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppData } from '../data/app_data/AppData';
import { destroyObject, sceneCleanup } from '../util/ModelUtil';

interface ModelViewerProps {
    model?: THREE.Object3D | null;
}

function ModelViewer({ model = null }: ModelViewerProps) {
    const appData = useAppData();

    // Refs for DOM elements and three.js objects with TypeScript types
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentObjectRef = useRef<THREE.Object3D | null>(null);
    const circlesRef = useRef<THREE.Group | null>(null);
    const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const currentMount = containerRef.current;

        // Scene
        const scene = new THREE.Scene();
        // scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        // Camera
        const aspect = currentMount.clientWidth / currentMount.clientHeight;
        const frustumSize = 500;
        const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 5000);
        camera.position.set(0, 0, 200);
        cameraRef.current = camera;
        scene.add(camera);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, logarithmicDepthBuffer: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minZoom = 0.1;
        controls.maxZoom = 100;
        controls.zoomSpeed = 0.3;
        controls.rotateSpeed = 0.3;
        controls.panSpeed = 0.3;
        controlsRef.current = controls;

        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        // Axes Helper
        const axesHelper = new THREE.AxesHelper(500);
        axesHelper.visible = true;
        scene.add(axesHelper);
        axesHelperRef.current = axesHelper;

        // reference circles
        const circles = new THREE.Group();
        circlesRef.current = circles;
        for (let i = 0; i < 50; i++) {
            const curve = new THREE.EllipseCurve(
                0.0, 0.0,            // Center x, y
                i * 10, i * 10,          // x radius, y radius
                0.0, 2.0 * Math.PI,  // Start angle, stop angle
            );

            const pts = curve.getSpacedPoints(256);
            const geo = new THREE.BufferGeometry().setFromPoints(pts);

            const mat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3 });
            const circle = new THREE.LineLoop(geo, mat);
            circlesRef.current.add(circle);
        }
        circlesRef.current.translateZ(-1);
        camera.add(circles);

        let animationFrameId: number;
        const animate = () => {
            controls.update();            

            circles.scale.copy(new THREE.Vector3(1, 1, 1).multiplyScalar(1/camera.zoom));

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        // Window And WindowContainer Resizing
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            const aspect = width / height;
            const frustumHeight = cameraRef.current.top - cameraRef.current.bottom;

            cameraRef.current.left = frustumHeight * aspect / -2;
            cameraRef.current.right = frustumHeight * aspect / 2;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        };

        const observer = new ResizeObserver(() => {
            handleResize();
        });
        observer.observe(containerRef.current);
        window.addEventListener('resize', handleResize);

        // Setting the new central axis
        const updateCentralAxis = () => {
            if (!cameraRef.current || !sceneRef.current || !currentObjectRef.current) return;
            if (!(currentObjectRef.current instanceof THREE.Mesh)) return;

            const camDir: THREE.Vector3 = new THREE.Vector3();
            cameraRef.current.getWorldDirection(camDir);

            const up = new THREE.Vector3(0, 0, 1);
            const centralAxis = new THREE.Vector3().copy(camDir)
            centralAxis.multiplyScalar(-1);

            // calculate rotation to be applied from up vector and camera direction
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(centralAxis, up);
            
            // calculate bounding box to get the current center of the model to estimate the distance to the camera for object translation
            const bb = new THREE.Box3();
            bb.setFromObject(currentObjectRef.current);
            const bbCenter = new THREE.Vector3();
            bb.getCenter(bbCenter)
            const distObjCenter = bbCenter.distanceTo(cameraRef.current.position);

            const newCenter = new THREE.Vector3().copy(cameraRef.current.position).add(camDir.multiplyScalar(distObjCenter)).multiplyScalar(-1);
            
            // apply rotation around object center (first set world position of object to 0, 0, 0 and then back again)
            const objectPos = new THREE.Vector3().copy(currentObjectRef.current.position);
            currentObjectRef.current.position.add(objectPos.multiplyScalar(-1));
            currentObjectRef.current.applyQuaternion(quaternion);
            currentObjectRef.current.position.add(objectPos.multiplyScalar(-1));

            // center object on origin using centralAxis
            currentObjectRef.current.position.add(newCenter);
            currentObjectRef.current.updateMatrixWorld();

            appData.updateState("SET_CENTRAL_AXIS_SET")(true);

            resetCamera();
        }

        appData.updateHooks("SET_UPDATE_CENTRAL_AXIS_CALLBACK")(updateCentralAxis);

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            sceneCleanup(scene);
            renderer.dispose();
            
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    // update the current model on change
    useEffect(() => {
        if (!model) return;
        if (!sceneRef.current) return;
        const scene = sceneRef.current;
        
        if (currentObjectRef.current) {
            scene.remove(currentObjectRef.current);
            if (currentObjectRef.current instanceof THREE.Mesh) {
                destroyObject(currentObjectRef.current);
            }
        }

        model.traverse(child => {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.center();
        });
        currentObjectRef.current = model;

        scene.add(model);

        resetCamera();
    }, [model]);

    // update the ambient light intensity when the unrolling brightness changes
    useEffect(() => {
        if (!ambientLightRef.current) return;
        ambientLightRef.current.intensity = appData.state.dynamicState.unrollingBrightness;
    }, [appData.state.dynamicState.unrollingBrightness]);

    // rotate the model 90 degrees around the x-axis
    const rotateX90 = () => {
        if (!currentObjectRef.current) return;

        currentObjectRef.current.rotation.x += Math.PI / 2;
    }

    // rotate the model 90 degrees around the y-axis
    const rotateY90 = () => {
        if (!currentObjectRef.current) return;

        currentObjectRef.current.rotation.y += Math.PI / 2;
    }

    // rotate the model 90 degrees around the z-axis
    const rotateZ90 = () => {
        if (!currentObjectRef.current) return;

        currentObjectRef.current.rotation.z += Math.PI / 2;
    }

    // Reset the camera
    const resetCamera = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        
        let distance = 200;

        if (currentObjectRef.current) {
            const bb = new THREE.Box3();
            bb.setFromObject(currentObjectRef.current);
            const bbSize = new THREE.Vector3();
            bb.getSize(bbSize);
            distance = bbSize.length() * 1.5; // set distance based on model size
        }

        cameraRef.current.position.set(0, 0, distance);
        cameraRef.current.up.set(0, 1, 0);
        cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
        cameraRef.current.updateProjectionMatrix();

        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    }

    return <>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', minWidth: 0, minHeight: 0 }}>
            <div style={{position: "absolute", left: 15, bottom: 10, objectFit: "contain", zIndex: 1000}}>
                <button className="btn btn-primary" onClick={resetCamera} style={{margin: 5}}>Reset Camera</button>
                <button className="btn btn-primary" onClick={rotateX90} style={{margin: 5}}>Rotate X 90°</button>
                <button className="btn btn-primary" onClick={rotateY90} style={{margin: 5}}>Rotate Y 90°</button>
                <button className="btn btn-primary" onClick={rotateZ90} style={{margin: 5}}>Rotate Z 90°</button>
            </div>
        </div>
    </>;
}

export default ModelViewer;