
import SidebarImageUpload from "./SidebarImageUpload";
import { useContext } from "react";
import SidebarSimpleButton from "./SidebarSimpleButton";
import SidebarPosNegButton from "./SidebarPosNegButton";
import SidebarModelUpload from "./SidebarModelUpload";
import { renderMask, unrollModelCyl, unrollPhotoCyl } from "../util/ModelUtil";
import { useAppData } from "../data/app_data/AppData";
import { WebSocketContext } from "../services/WebSocketService";
import { loadJsonFile, saveJsonFile } from "../util/Util";
import { initDynamicState, type AppState } from "../data/app_data/State";
import { createMaskFromPhoto, rotateImage } from "../util/ImageUtil";
import SidebarDropdownMenu from "./SidebarDropdownMenu";
import SidebarSectionElementDivider from "./SidebarSectionElementDivider";

interface ProjectLoaderProps {
}

function ProjectLoader({ }: ProjectLoaderProps) {
    const ws = useContext(WebSocketContext);
    const appData = useAppData();

    return <div>
        {!appData.state.dynamicState.modelLoaded && <>
            <SidebarDropdownMenu name="Input Type" id_prefix="input-type"
                initIndex={1}
                keys={["projectFile", "maskAndCylindrical", "model", "singlePhoto"]}
                values={["Project File", "Mask + Unrolling", "Model", "Single Photo"]}
                setValue={appData.updateState("SET_LOAD_TYPE")}
                useStringKeys={true}
            />
            <SidebarSectionElementDivider/>
            {appData.state.dynamicState.loadType == "maskAndCylindrical" && <>
                <SidebarImageUpload name="Load Mask" id="load_mask" imageUrl={appData.state.persistentState.maskImageUrl} setImageUrl={appData.updateState("SET_MASK_IMAGE_URL")}/>
                <SidebarImageUpload name="Load Unrolling" id="load_unrolling" imageUrl={appData.state.persistentState.unrollingImageUrl} setImageUrl={appData.updateState("SET_UNROLLING_IMAGE_URL")}/>
            </>}
            {appData.state.dynamicState.loadType == "model" && <>
                <SidebarModelUpload name="Load Model" id="Load-mask" model={appData.state.dynamicState.model} setModel={appData.updateState("SET_MODEL")} setModelMaterial={appData.updateState("SET_MODEL_MATERIAL")}/>
                {appData.state.dynamicState.model != null && <>
                    {appData.state.dynamicState.adjustingModel &&
                        <SidebarSimpleButton name="Set Central Axis" id="set-central-axis" callback={appData.hooksRef.current.updateCentralAxisCallback}/>
                    }
                    {appData.state.dynamicState.centralAxisSet && <>
                        {appData.state.dynamicState.adjustingModel &&
                            <SidebarSimpleButton name="Create Mask+Unroll" id="finalize-model-load" callback={() => {
                                const maskDataUrl = renderMask(appData.state.dynamicState.model);
                                appData.updateState("SET_MASK_IMAGE_URL")(maskDataUrl);
                                unrollModelCyl(appData.state.dynamicState.model, appData.state.dynamicState.modelMaterial, appData.state.dynamicState.unrollingWidth, appData.state.dynamicState.unrollingBrightness, appData.updateState("SET_UNROLLING_IMAGE_URL"));
                                appData.updateState("SET_ADJUSTING_MODEL")(false);
                            }}/>
                        }
                        {!appData.state.dynamicState.adjustingModel &&
                            <SidebarSimpleButton name="Adjust Model" id="adjust-model" callback={() => {appData.updateState("SET_ADJUSTING_MODEL")(true);}}/>
                        }
                    </>}
                </>}
            </>}
            {appData.state.dynamicState.loadType == "singlePhoto" && <>
                <SidebarImageUpload name="Load Photo" id="load-photo" imageUrl={appData.state.dynamicState.singlePhotoImageUrl} setImageUrl={appData.updateState("SET_SINGLE_PHOTO_IMAGE_URL")}/>
                {appData.state.dynamicState.singlePhotoImageUrl != "" && <>
                    <SidebarPosNegButton name="Create Mask" condition={appData.state.persistentState.maskImageUrl != ""} id="photo-create-mask" callback={() => {
                        appData.updateState("SET_MASK_IMAGE_URL")(createMaskFromPhoto("photo-viewer"));
                    }}/>
                    {appData.state.persistentState.maskImageUrl != "" &&
                        <SidebarPosNegButton name="Unroll Photo" condition={appData.state.persistentState.unrollingImageUrl != ""} id="photo-unroll" callback={() => {
                            rotateImage(appData.state.dynamicState.singlePhotoImageUrl, appData.state.persistentState.maskImageRotation).then((rotatedPhoto) => {
                                unrollPhotoCyl(rotatedPhoto, appData.state.persistentState.maskImageCenter).then((dataUrl) => {
                                    appData.updateState("SET_UNROLLING_IMAGE_URL")(dataUrl);
                                });
                            });
                        }}/>
                    }
                </>}
            </>}
            {appData.state.dynamicState.loadType == "projectFile" && <>
                <SidebarSimpleButton name="Load Project File" id="load_mask" callback={() => {
                    loadJsonFile().then((data) => {
                        if (data === null) return;
                        const state: AppState = JSON.parse(data);
                        appData.updateState("LOAD_STATE")(state);
                    }).catch((err) => {
                        console.log(err);
                    });
                }}/>
            </>}
            {appData.state.dynamicState.readyToLoad && 
                <SidebarSimpleButton name="Start Project" id="start-project-button" callback={ws.loadProject}/>
            }
        </>}
        {appData.state.dynamicState.modelLoaded && <>
            <SidebarSimpleButton name="New Project" id="new-project-button" callback={appData.updateState("RESET_STATE")}/>
            <SidebarSimpleButton name="Save Project" id="save-project-button" callback={() => {
                const stateToSave = {
                    ...appData.stateRef.current,
                    dynamicState: initDynamicState
                };
                saveJsonFile(JSON.stringify(stateToSave, null, 4));
            }}/>
        </>}
    </div>
}

export default ProjectLoader;