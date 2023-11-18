import { MathUtils } from "three";
import { allVisible, axesVisible, changeShowAll, cpuVisible, debugging, fpsVisible, memVisible, posVisible, showAll, showAxes, showCpu, showFps, showMem, showPos } from "./Debug.js";
import { KeyCodes, keysJustPressed } from "./Input.js";
import { SetAntialias, SetFOV, SetResolution, antialias, body, fov, resMult } from "./Scene.js";
import { SetLookSensitivityMultiplier, changeDownState, changeUpState, setTouchControls, touchControls } from "./Control.js";
import { time } from "./Time.js";
import { spotLightDistance, spotLightDistanceUniform } from "../materials/OceanMaterial.js";

export const controlsDiv1 = document.createElement("info");

const buttonTimeout = 50;
const menuCooldown = 0.5;

export let FullscreenUpdate;

export let openMenu;
let lastMenuClose = -buttonTimeout;
let history = new Array();

export function Start()
{   
    const overlay = document.createElement("overlay");
    overlay.className = "hidden";
    body.appendChild(overlay);

    const menuButton = document.createElement("button");
    menuButton.textContent = "Menu";
    body.appendChild(menuButton);

    function newOverlayDiv(show)
    {
        const div0 = document.createElement("div");
        overlay.appendChild(div0);
        const div1 = document.createElement("div");
        div1.style.display = show ? "block" : "none";
        div0.appendChild(div1);

        return div1;
    }

    function newButton(text, parent, destination, backButton, resumeButton, quitButton)
    {
        const button = document.createElement("button");
        button.textContent = text;
        if (quitButton)
        {
            button.onclick = function()
            {
                setTimeout(function()
                {
                    location.reload();
                }, buttonTimeout);
            }
        }
        else if (resumeButton)
        {
            button.onclick = function()
            {
                setTimeout(function()
                {
                    overlay.className = "hidden";
                    destination.style.display = "block";
                    history = new Array();
                    lastMenuClose = time;
                }, buttonTimeout);
            }
        }
        else if (backButton)
        {
            button.className = "back";

            button.onclick = function()
            {
                setTimeout(function()
                {
                    parent.style.display = "none";
                    destination.style.display = "block";
                    history.pop();
                }, buttonTimeout);
            }
        }
        else
        {
            button.onclick = function()
            {
                setTimeout(function()
                {
                    parent.style.display = "none";
                    destination.style.display = "block";
                    history.push(destination);
                }, buttonTimeout);
            }
        }
        parent.appendChild(button);
    }

    function newControlButton(text, image, className, light, onActive, onInactive)
    {
        const button = document.createElement("button");

        if (text)
        {
            button.textContent = text;
        }

        if (image)
        {
            const img = document.createElement("img");
            img.src = image;
            button.appendChild(img);
        }

        button.className = className;

        if (light)
        {
            if (spotLightDistanceUniform.value > 0)
            {
                button.style.backgroundColor = "#fffc";
            }

            let downId = -1;

            button.onpointerdown = function(e)
            {
                downId = e.pointerId;
            };

            button.onpointerleave = function()
            {
                downId = -1;
            }

            button.onpointerup = function(e)
            {
                if (e.pointerId == downId)
                {
                    if (spotLightDistanceUniform.value > 0)
                    {
                        spotLightDistanceUniform.value = 0;
                        button.style.backgroundColor = "#fff8";
                    }
                    else
                    {
                        spotLightDistanceUniform.value = spotLightDistance;
                        button.style.backgroundColor = "#fffc";
                    }
                }
            }
        }

        body.appendChild(button);

        if (onActive)
        {
            button.onpointerdown = function()
            {
                onActive();
                button.style.backgroundColor = "#fffc";
            }

            const inactive = function()
            {
                onInactive();
                button.style.backgroundColor = "#fff8";
            }

            button.onpointerout = inactive;
            button.onpointerup = inactive;
            button.onpointercancel = inactive;
        }

        return button;
    }

    class Range
    {
        text;
        unit;
        display;
        element;

        constructor(text, parent, min, max, step, value, unit, anisotropy)
        {
            this.text = text;
            this.unit = unit;

            const div = document.createElement("inputDiv");
            parent.appendChild(div);
    
            this.display = document.createElement("div");
            this.display.textContent = anisotropy ? text + (value == 0 ? "disabled" : value + unit) : text + value + unit;
            div.appendChild(this.display);
    
            this.element = document.createElement("input");
            this.element.type = "range";
            this.element.min = min;
            this.element.max = max;
            this.element.step = step;
            this.element.value = anisotropy ? value > 0 ? Math.log2(value) : 0 : value;
            let p = MathUtils.inverseLerp(min, max, this.element.value) * 100 + "%";
            this.element.style.background = "linear-gradient(to right, #fff 0%, #fff " + p + ", #0008 " + p + ", #0008 100%)";
    
            div.appendChild(this.element);
        }

        Update()
        {
            this.display.textContent = this.text + this.element.value + this.unit;
            let p = MathUtils.inverseLerp(this.element.min, this.element.max, this.element.value) * 100 + "%";
            this.element.style.background = "linear-gradient(to right, #fff 0%, #fff " + p + ", #0008 " + p + ", #0008 100%)";
        }

        UpdateAnisotropy()
        {
            this.display.textContent = this.text + (this.element.value == 0 ? "disabled" : Math.pow(2, this.element.value) + this.unit);
            let p = MathUtils.inverseLerp(this.element.min, this.element.max, this.element.value) * 100 + "%";
            this.element.style.background = "linear-gradient(to right, #fff 0%, #fff " + p + ", #0008 " + p + ", #0008 100%)";
        }
    }

    class Switch
    {
        clickArea;
        display;
        bar;
        thumb;
        text;

        constructor(text, parent, value)
        {
            const div = document.createElement("inputDiv");
            parent.appendChild(div);
    
            this.display = document.createElement("div");
            div.appendChild(this.display);
    
            this.clickArea = document.createElement("toggleDiv");
            div.appendChild(this.clickArea);
    
            this.bar = document.createElement("toggle");
            this.clickArea.appendChild(this.bar);
    
            this.thumb = document.createElement("togglethumb");
            this.clickArea.appendChild(this.thumb);

            this.text = text;

            this.Change(value);
        }

        Change(value)
        {
            if (value)
            {
                this.display.textContent = this.text + "enabled";
                this.bar.className = "enabled";
                this.thumb.className = "enabled";
            }
            else
            {
                this.display.textContent = this.text + "disabled";
                this.bar.className = "";
                this.thumb.className = "";
            }
        }
    }

    function newInfoDiv(parent)
    {
        const div = document.createElement("info")
        parent.appendChild(div);
        return div;
    }

    function newInputInfo(key, description, parent)
    {
        const div = document.createElement("div");

        div.style.margin = "0px 0px 8px";

        if (key)
        {
            const keySpan = document.createElement("code");
            keySpan.textContent = key;
            div.appendChild(keySpan);
        }

        const descriptionSpan = document.createElement("span");
        descriptionSpan.textContent = key ? (" - " + description) : description;
        div.appendChild(descriptionSpan);

        parent.appendChild(div);
    }

    //#region Main buttons
    const menuDiv = newOverlayDiv(true);
    openMenu = function()
    {
        if (time - lastMenuClose > menuCooldown)
        {
            setTimeout(function()
            {
                menuButton.style.display = "none";
                overlay.className = "";
                history.push(menuButton);
                history.push(overlay);
                history.push(menuDiv);
            }, buttonTimeout);
        }
    }
    menuButton.onclick = openMenu;

    const settingsDiv = newOverlayDiv();

    const controlsDiv = newOverlayDiv();
    const videoDiv = newOverlayDiv();
    const debugDiv = newOverlayDiv();

    const aboutDiv = newOverlayDiv();

    const helpDiv = newOverlayDiv();

    const keyboardMouseDiv = newOverlayDiv();
    const touchscreenDiv = newOverlayDiv();

    const touchControlButtons = new Array();

    touchControlButtons.push(newControlButton(false, "../images/triangle.png", "up", false, function()
    {
        changeUpState(true);
    }, function()
    {
        changeUpState(false);
    }));
    touchControlButtons.push(newControlButton(false, "../images/triangle.png", "down", false, function()
    {
        changeDownState(true);
    }, function()
    {
        changeDownState(false);
    }));
    touchControlButtons.push(newControlButton("Light", false, "light", true));

    if (!touchControls)
    {
        for (let i = 0; i < touchControlButtons.length; i++)
        {
            touchControlButtons[i].style.display = "none";
        }
    }
    //#endregion

    //#region Menu buttons
    newButton("Resume game", menuDiv, menuButton, false, true);
    newButton("Settings", menuDiv, settingsDiv);
    newButton("Help", menuDiv, helpDiv);
    newButton("About", menuDiv, aboutDiv);
    newButton("Restart", menuDiv, helpDiv, false, false, true);
    //#endregion

    //#region Settings buttons
    newButton("Controls", settingsDiv, controlsDiv);
    newButton("Video", settingsDiv, videoDiv);
    newButton("Debug", settingsDiv, debugDiv);
    newButton("Back", settingsDiv, menuDiv, true);
    //#endregion

    //#region Controls
    const lookSensitivityIn = new Range("Look sensitivity: ", controlsDiv, 0.1, 3, 0.1, 1, "x");
    lookSensitivityIn.element.oninput = function()
    {
        SetLookSensitivityMultiplier(lookSensitivityIn.element.value);
        lookSensitivityIn.Update();
    }

    const touchControlsIn = new Switch("Touch controls: ", controlsDiv, touchControls);
    touchControlsIn.clickArea.onclick = function()
    {
        setTouchControls(!touchControls);
        touchControlsIn.Change(touchControls);

        if (touchControls)
        {
            for (let i = 0; i < touchControlButtons.length; i++)
            {
                touchControlButtons[i].style.display = "block";
            }

            if (spotLightDistanceUniform.value > 0)
            {
                touchControlButtons[2].style.backgroundColor = "#fffc";
            }
            else
            {
                touchControlButtons[2].style.backgroundColor = "#fff8";
            }
        }
        else
        {
            for (let i = 0; i < touchControlButtons.length; i++)
            {
                touchControlButtons[i].style.display = "none";
            }
        }
    }
    
    newButton("Back", controlsDiv, settingsDiv, true);
    //#endregion

    //#region Video
    const resolutionIn = new Range("Screen Resolution: ", videoDiv, 10, 100, 10, resMult * 100, "%");
    resolutionIn.element.oninput = function()
    {
        SetResolution(resolutionIn.element.value / 100);
        resolutionIn.Update();
    }

    const fullscreenIn = new Switch("Fullscreen: ", videoDiv, document.fullscreenElement);
    fullscreenIn.clickArea.onclick = function()
    {
        if (!document.fullscreenElement)
        {
            document.body.requestFullscreen().catch(function(){return;});
            screen.orientation.lock("landscape").catch(function(){});
            fullscreenIn.Change(true);
        }
        else
        {
            screen.orientation.unlock();
            document.exitFullscreen();
            fullscreenIn.Change(false);
        }
    }

    FullscreenUpdate = function()
    {
        if (!document.fullscreenElement)
        {
            fullscreenIn.Change(false);
        }
        else
        {
            fullscreenIn.Change(true);
        }
    }

    const fovIn = new Range("Field of view: ", videoDiv, 30, 120, 1, fov, "°");
    fovIn.element.oninput = function()
    {
        SetFOV(fovIn.element.value);
        fovIn.Update();
    }

    const antialiasIn = new Switch("Antialiasing: ", videoDiv, antialias);
    antialiasIn.clickArea.onclick = function()
    {
        SetAntialias(!antialias);
        antialiasIn.Change(antialias);
    }

    newButton("Back", videoDiv, settingsDiv, true);
    //#endregion

    //#region Debug
    const showAllIn = new Switch("Show all: ", debugDiv, debugging);

    const showFpsIn = new Switch("Show FPS: ", debugDiv, showFps);
    showFpsIn.clickArea.onclick = function()
    {
        fpsVisible(!showFps)
        const all = showFps && showCpu && showMem && showPos && showAxes;
        changeShowAll(all);
        showAllIn.Change(all)
        showFpsIn.Change(showFps);
    }

    const showCpuIn = new Switch("Show CPU usage: ", debugDiv, showCpu);
    showCpuIn.clickArea.onclick = function()
    {
        cpuVisible(!showCpu)
        const all = showFps && showCpu && showMem && showPos && showAxes;
        changeShowAll(all);
        showAllIn.Change(all)
        showCpuIn.Change(showCpu);
    }

    const showMemIn = new Switch("Show memory usage: ", debugDiv, showMem);
    showMemIn.clickArea.onclick = function()
    {
        memVisible(!showMem)
        const all = showFps && showCpu && showMem && showPos && showAxes;
        changeShowAll(all);
        showAllIn.Change(all)
        showMemIn.Change(showMem);
    }

    const showPosIn = new Switch("Show position: ", debugDiv, showPos);
    showPosIn.clickArea.onclick = function()
    {
        posVisible(!showPos)
        const all = showFps && showCpu && showMem && showPos && showAxes;
        changeShowAll(all);
        showAllIn.Change(all)
        showPosIn.Change(showPos);
    }

    const showAxesIn = new Switch("Show axes: ", debugDiv, showAxes);
    showAxesIn.clickArea.onclick = function()
    {
        axesVisible(!showAxes)
        const all = showFps && showCpu && showMem && showPos && showAxes;
        changeShowAll(all);
        showAllIn.Change(all)
        showAxesIn.Change(showAxes);
    }

    showAllIn.clickArea.onclick = function()
    {
        allVisible(!showAll)
        showAllIn.Change(showAll);
        showFpsIn.Change(showAll);
        showCpuIn.Change(showAll);
        showMemIn.Change(showAll);
        showPosIn.Change(showAll);
        showAxesIn.Change(showAll);
    }

    newButton("Back", debugDiv, settingsDiv, true);
    //#endregion
    
    //#region Help buttons
    newButton("Keyboard & mouse", helpDiv, keyboardMouseDiv);
    newButton("Touchscreen", helpDiv, touchscreenDiv);
    newButton("Back", helpDiv, menuDiv, true);
    //#endregion

    //#region Mouse & keyboard
    const keyboardMouseInfoDiv = newInfoDiv(keyboardMouseDiv);
    newInputInfo("click", "enter mouse lock", keyboardMouseInfoDiv);
    newInputInfo("mousemove", "look around (if mouse lock)", keyboardMouseInfoDiv);
    newInputInfo("esc", "exit mouse lock, open menu, back", keyboardMouseInfoDiv);
    newInputInfo("f11", "enter/exit fullscreen", keyboardMouseInfoDiv);
    newInputInfo("w", "move forward", keyboardMouseInfoDiv);
    newInputInfo("a", "move leftward", keyboardMouseInfoDiv);
    newInputInfo("s", "move backward", keyboardMouseInfoDiv);
    newInputInfo("d", "move rightward", keyboardMouseInfoDiv);
    newInputInfo("q", "move downward", keyboardMouseInfoDiv);
    newInputInfo("e", "move upward", keyboardMouseInfoDiv);
    newInputInfo("shift", "speed boost", keyboardMouseInfoDiv);
    newInputInfo("l", "turn on/off the spot light", keyboardMouseInfoDiv);

    newButton("Back", keyboardMouseDiv, helpDiv, true);
    //#endregion

    //#region Touchscreen
    const touchscreenInfoDiv = newInfoDiv(touchscreenDiv);
    newInputInfo(false, "To enable or disable touch controls, go to Settings - Controls - Touch controls.", touchscreenInfoDiv);
    newInputInfo(false, "Use the left side of the screen and the two buttons on the right of the screen to move.", touchscreenInfoDiv);
    newInputInfo(false, "Use the right side of the screen to look around.", touchscreenInfoDiv);

    newButton("Back", touchscreenDiv, helpDiv, true);
    //#endregion

    //#region About
    const aboutInfoDiv = newInfoDiv(aboutDiv);
    newInputInfo(false, "A project made entierly by one person in about 2 months. Learn more about this project:", aboutInfoDiv);
    const a = document.createElement("a");
    a.href = "https://github.com/Nugget8/Three.js-Ocean-Scene";
    a.textContent = "https://github.com/Nugget8/Three.js-Ocean-Scene";
    aboutInfoDiv.appendChild(a);

    newButton("Back", aboutDiv, menuDiv, true);
    //#endregion
}

export function Update()
{
    if (keysJustPressed.includes(KeyCodes.escape))
    {
        if (history.length > 0)
        {
            if (history.length == 3)
            {
                history[history.length - 3].style.display = "block";
                history[history.length - 2].className = "hidden";
                history = new Array();
                lastMenuClose = time;
            }
            else
            {
                history[history.length - 2].style.display = "block";
                history[history.length - 1].style.display = "none";
                history.pop();
            }
        }
        else
        {
            openMenu();
        }
    }
}