import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import * as Skybox from "../scene/Skybox.js";
import * as Ocean from "../scene/Ocean.js";
import * as SeaFloor from "../scene/SeaFloor.js";
import * as Blocks from "../scene/Blocks.js";
import { axes } from "./Debug.js";

export const body = document.createElement("div");

export const renderer = new WebGLRenderer();
export const scene = new Scene();
export const camera = new PerspectiveCamera();
export const staticCamera = new PerspectiveCamera();

export const cameraRight = new Vector3();
export const cameraUp = new Vector3();
export const cameraForward = new Vector3();

export function UpdateCameraRotation()
{
    cameraRight.copy(new Vector3(1, 0, 0).applyQuaternion(camera.quaternion));
    cameraUp.copy(new Vector3(0, 1, 0).applyQuaternion(camera.quaternion));
    cameraForward.copy(new Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
}

export let resMult = 1;
export function SetResolution(value)
{
    resMult = value;
    let width = window.innerWidth * value * window.devicePixelRatio;
    let height = window.innerHeight * value * window.devicePixelRatio;
    if (window.innerWidth < window.innerHeight)
    {
        width = window.innerHeight * value * window.devicePixelRatio;
        height = window.innerWidth * value * window.devicePixelRatio;
        body.style.transform = "rotate(90deg) translate(0%, -100%)";
        body.style.width = window.innerHeight + "px";
        body.style.height = window.innerWidth + "px";
    }
    else
    {
        body.style.transform = "";
        body.style.width = window.innerWidth + "px";
        body.style.height = window.innerHeight + "px";
    }

    renderer.setSize(width, height, false);
}

export let fov = 70;
export function SetFOV(value)
{
    fov = value;
    camera.fov = value;
    camera.updateProjectionMatrix();
}

export let antialias = false;
export function SetAntialias(value)
{
    antialias = value;
    renderer.antialias = antialias;
}

export function Start()
{
    document.body.appendChild(body);

    let width = window.innerWidth * resMult * window.devicePixelRatio;
    let height = window.innerHeight * resMult * window.devicePixelRatio;
    if (window.innerWidth < window.innerHeight)
    {
        width = window.innerHeight * resMult * window.devicePixelRatio;
        height = window.innerWidth * resMult * window.devicePixelRatio;
        body.style.transform = "rotate(90deg) translate(0%, -100%)";
        body.style.width = window.innerHeight + "px";
        body.style.height = window.innerWidth + "px";
    }
    else
    {
        body.style.transform = "";
        body.style.width = window.innerWidth + "px";
        body.style.height = window.innerHeight + "px";
    }
    
    renderer.setSize(width, height, false);
    renderer.antialias = antialias;
    renderer.autoClearColor = false;
    body.appendChild(renderer.domElement);
    
    camera.fov = fov;
    camera.aspect = width / height;
    camera.near = 0.3;
    camera.far = 4000;
    camera.updateProjectionMatrix();
    camera.position.set(0, 1, 0);

    UpdateCameraRotation();

    staticCamera.fov = 60;
    staticCamera.aspect = width / height;
    staticCamera.near = 0.1;
    staticCamera.far = 10;
    staticCamera.updateProjectionMatrix();
    staticCamera.position.set(0, 0, 0);

    window.onresize = function()
    {
        width = window.innerWidth * resMult * window.devicePixelRatio;
        height = window.innerHeight * resMult * window.devicePixelRatio;
        if (window.innerWidth < window.innerHeight)
        {
            width = window.innerHeight * resMult * window.devicePixelRatio;
            height = window.innerWidth * resMult * window.devicePixelRatio;
            body.style.transform = "rotate(90deg) translate(0%, -100%)";
            body.style.width = window.innerHeight + "px";
            body.style.height = window.innerWidth + "px";
        }
        else
        {
            body.style.transform = "";
            body.style.width = window.innerWidth + "px";
            body.style.height = window.innerHeight + "px";
        }

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        staticCamera.aspect = width / height;
        staticCamera.updateProjectionMatrix();
    }

    Skybox.Start();
    scene.add(Skybox.skybox);

    Ocean.Start();
    scene.add(Ocean.surface);

    SeaFloor.Start();
    for (let i = 0; i < SeaFloor.tiles.length; i++)
    {
        scene.add(SeaFloor.tiles[i]);
    }

    Blocks.Start();
    for (let i = 0; i < Blocks.blocks.length; i++)
    {
        scene.add(Blocks.blocks[i]);
    }
}

export function Update()
{
    Skybox.Update();
    Ocean.Update();
    SeaFloor.Update();

    renderer.render(scene, camera);
    renderer.render(axes, staticCamera);
}