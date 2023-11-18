import * as TIME from "./scripts/Time.js";
import * as SCENE from "./scripts/Scene.js";
import * as INPUT from "./scripts/Input.js";
import * as CONTROL from "./scripts/Control.js";
import * as UI from "./scripts/UI.js";
import * as DEBUG from "./scripts/Debug.js";
import * as SETTINGS from "./shaders/Settings.js"

TIME.Start();
SETTINGS.Start();
SCENE.Start();
INPUT.Start();
CONTROL.Start();
UI.Start();
DEBUG.Start();

requestAnimationFrame(UpdateFrame);

function UpdateFrame()
{
    DEBUG.Begin();

    TIME.Update();
    SCENE.Update();
    INPUT.Update();
    CONTROL.Update();
    UI.Update();
    DEBUG.Update();

    DEBUG.End();

    requestAnimationFrame(UpdateFrame);
}