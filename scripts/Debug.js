import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from "three";
import { body, camera, cameraForward } from "./Scene.js";
import { deltaTime } from "./Time.js";

export const debugging = false;
const axesSize = 0.06;

let showPanel = debugging;
export let showAll = debugging;
export let showFps = debugging;
export let showCpu = debugging;
export let showMem = debugging;
export let showPos = debugging;
export let showAxes = debugging;
export const axes = new Group();
axes.visible = debugging;

export function changeShowAll(value)
{
    showAll = value;
}
export function allVisible(value)
{
    showAll = value;
    fpsVisible(showAll);
    cpuVisible(showAll);
    memVisible(showAll);
    posVisible(showAll);
    axesVisible(showAll);
}
export function fpsVisible(value)
{
    showFps = value;
    showPanel = showFps || showCpu || showMem || showPos;
    debugPanel.style.display = showPanel ? "block" : "none";
    fpsDiv.style.display = showFps ? "block" : "none";
}
export function cpuVisible(value)
{
    showCpu = value;
    showPanel = showFps || showCpu || showMem || showPos;
    debugPanel.style.display = showPanel ? "block" : "none";
    cpuDiv.style.display = showCpu ? "block" : "none";
}
export function memVisible(value)
{
    showMem = value;
    showPanel = showFps || showCpu || showMem || showPos;
    debugPanel.style.display = showPanel ? "block" : "none";
    memDiv.style.display = showMem ? "block" : "none";
}
export function posVisible(value)
{
    showPos = value;
    showPanel = showFps || showCpu || showMem || showPos;
    debugPanel.style.display = showPanel ? "block" : "none";
    posDiv.style.display = showPos ? "block" : "none";
}
export function axesVisible(value)
{
    showAxes = value;
    axes.visible = showAxes;
}

const debugPanel = document.createElement("debug");
const fpsDiv = document.createElement("div");
const cpuDiv = document.createElement("div");
const memDiv = document.createElement("div");
const posDiv = document.createElement("div");

let fps = 0;
let frameTime = 0;
let deltaTimeSum = 0;
let cpuTime = 0;
let cpuUsage = 0;
let mem = 0;
let lastRefresh = 0;
let frameCount = 0;
let cpuSum = 0;
let cpuDeltaSum = 0;
let lastFrame = 0;

let now, a;

export function Start()
{   
    debugPanel.style.display = showPanel ? "block" : "none";
    fpsDiv.style.display = showFps ? "block" : "none";
    cpuDiv.style.display = showCpu ? "block" : "none";
    memDiv.style.display = showMem ? "block" : "none";
    posDiv.style.display = showPos ? "block" : "none";

    debugPanel.appendChild(fpsDiv);
    debugPanel.appendChild(cpuDiv);
    debugPanel.appendChild(memDiv);
    debugPanel.appendChild(posDiv);

    body.appendChild(debugPanel);

    function AxisLine(a, b, color)
    {
        let material = new LineBasicMaterial( { color: color } );
        let geometry = new BufferGeometry().setFromPoints([a, b]);

        return new Line(geometry, material);
    }

    axes.add(AxisLine(new Vector3(0, 0, 0), new Vector3(axesSize, 0, 0), 0xff0000));
    axes.add(AxisLine(new Vector3(0, 0, 0), new Vector3(0, axesSize, 0), 0x00ff00));
    axes.add(AxisLine(new Vector3(0, 0, 0), new Vector3(0, 0, axesSize), 0x0000ff));

    allVisible(showAll);

    lastRefresh = performance.now();
}

export function Update()
{   
    frameCount++;
    deltaTimeSum += deltaTime;
    now = performance.now();
    cpuDeltaSum += now - lastFrame;
    lastFrame = now;

    if (lastRefresh + 500 <= now)
    {
        frameTime = deltaTimeSum / frameCount;
        fps = Math.round(1 / frameTime * 10) / 10;
        frameTime = Math.round(frameTime * 10000) / 10;
        cpuTime = Math.round(cpuSum / frameCount * 10) / 10;
        cpuUsage = Math.round(cpuTime / (cpuDeltaSum / frameCount) * 1000) / 10;

        frameCount = 0;
        deltaTimeSum = 0;
        cpuSum = 0;
        cpuDeltaSum = 0;

        mem = performance.memory;

        lastRefresh = now;
    }

    fpsDiv.textContent = "FPS: " + fps + " (" + frameTime + " MS)";
    cpuDiv.textContent = "CPU: " + cpuTime + " MS (" + cpuUsage + "%)";

    if (mem)
    {
        memDiv.textContent = "Memory: " + Math.round(mem.usedJSHeapSize / 1048576 * 10) / 10 + " MB / " + Math.round(mem.jsHeapSizeLimit / 104857.6) / 10 + " MB";
    }
    else
    {
        memDiv.textContent = "Memory: cannot measure";
    }

    posDiv.textContent = "Position: " + Math.round(camera.position.x * 10) / 10 + ", " + Math.round(camera.position.y * 10) / 10 + ", " + Math.round(camera.position.z * 10) / 10;

    a = new Vector3().copy(cameraForward);
    axes.position.set(a.x, a.y, a.z);
}

let beginTime = 0;

export function Begin()
{
    beginTime = performance.now();
}

export function End()
{
    cpuSum += performance.now() - beginTime;
}