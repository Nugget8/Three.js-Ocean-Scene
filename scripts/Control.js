import { MathUtils, Quaternion, Vector2, Vector3 } from "three";
import { deltaTime, time } from "./Time.js";
import { camera, cameraRight, cameraForward, UpdateCameraRotation, renderer, body, staticCamera } from "./Scene.js";
import { KeyCodes, PointerPhase, PointerType, keysJustPressed, keysPressed, lastPointerLockChange, mouseMovement, pointers } from "./Input.js";
import { borderRadius } from "../scene/SeaFloor.js";
import { spotLightDistance, spotLightDistanceUniform } from "../materials/OceanMaterial.js";

const baseMoveSpeed = 10;
const shiftMoveSpeed = baseMoveSpeed * 5;
const smoothSpeed = 15;
const mindelta = 0.0001;
const moveSpeedExpMultiplier = 0;

window.mobileAndTabletCheck = function()
{
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substring(0,4))) check = true;})(navigator.userAgent);
    return check;
};

export let touchControls = mobileAndTabletCheck();
export function setTouchControls(value)
{
    touchControls = value;
    lookSensitivity = touchControls ? 0.01 : 0.003;
}

let lookSensitivity = touchControls ? 0.01 : 0.003;

export let sensitivityMult = 1;
export function SetLookSensitivityMultiplier(value)
{
    sensitivityMult = value;
}

let moving = false;
let moveVector = new Vector3(0, 0, 0);
let phi = 0;
let tetha = 0;
let moveSpeedMultiplier = 1;

class Joystick
{
    background;
    handle;
    pointerId;
    position;
    radius;
    vector;

    constructor()
    {
        const background = document.createElement("img");
        background.draggable = false;
        background.src = "../images/joystickBackground.png";
        background.className = "joystickHidden";
        body.appendChild(background);
        this.background = background;

        const handle = document.createElement("img");
        handle.draggable = false;
        handle.src = "../images/joystickHandle.png";
        handle.className = "joystickHidden";
        body.appendChild(handle);
        this.handle = handle;

        this.pointerId = -1;

        this.radius = parseInt(window.getComputedStyle(background).getPropertyValue("width")) / 3;
        this.vector = new Vector2();
    }

    setActive(value)
    {
        this.background.className = value ? "joystick" : "joystickHidden";
        this.handle.className = value ? "joystick" : "joystickHidden";
        this.vector = new Vector2();
    }

    setPosition(value)
    {
        this.background.style.left = value.x + "px";
        this.background.style.top = value.y + "px";
        this.handle.style.left = value.x + "px";
        this.handle.style.top = value.y + "px";
        this.position = value.clone();
    }

    moveHandle(value)
    {
        let differenceVector = value.clone().sub(this.position);
        let distance = Math.min(differenceVector.length(), this.radius);
        let newHandlePosition = differenceVector.clone().normalize().multiplyScalar(distance);
        this.vector = newHandlePosition.clone().divideScalar(this.radius);
        newHandlePosition.add(this.position);
        this.handle.style.left = newHandlePosition.x + "px";
        this.handle.style.top = newHandlePosition.y + "px";
    }
}

let joystick;
let lookPointerId = -1;

let buttonUp = false;
export function changeUpState(up)
{
    buttonUp = up;
}

let buttonDown = false;
export function changeDownState(down)
{
    buttonDown = down;
}

export function Start()
{
    joystick = new Joystick();
}

export function Update()
{
    
    for (let i = 0; i < pointers.length; i++)
    {
        let pointer = pointers[i];

        if (touchControls)
        {
            let pointerPosNormalized = pointer.position.clone().divide(new Vector2(window.innerWidth, window.innerHeight));

            if (pointer.phase == PointerPhase.began)
            {
                if (pointerPosNormalized.x < 0.35)
                {
                    if (joystick.pointerId == -1)
                    {
                        joystick.pointerId = pointer.id;
                        joystick.setPosition(pointer.position.clone());
                        joystick.setActive(true);
                    }
                }
                else if(lookPointerId == -1)
                {
                    lookPointerId = pointer.id;
                }
            }

            if (pointer.phase == PointerPhase.moved)
            {
                if (pointer.id == joystick.pointerId)
                {
                    joystick.moveHandle(pointer.position);
                }

                if (pointer.id == lookPointerId)
                {
                    phi += pointer.deltaPosition.x * lookSensitivity * sensitivityMult;
                    tetha = MathUtils.clamp(tetha - pointer.deltaPosition.y * lookSensitivity * sensitivityMult, -Math.PI / 2, Math.PI / 2);
                }
            }

            if (pointer.phase == PointerPhase.ended || pointer.phase == PointerPhase.cancelled)
            {
                if (pointer.id == joystick.pointerId)
                {
                    joystick.pointerId = -1;
                    joystick.setActive(false);
                }

                if (pointer.id == lookPointerId)
                {
                    lookPointerId = -1;
                }
            }

            if (pointer.type != PointerType.mouse && !document.fullscreenElement && pointer.phase == PointerPhase.ended)
            {
                document.body.requestFullscreen();
                screen.orientation.lock("landscape");
            }
        }
        else if (pointer.type == PointerType.mouse && !document.pointerLockElement && pointer.phase == PointerPhase.ended && time - lastPointerLockChange > 1.5)
        {
            renderer.domElement.requestPointerLock();
        }
    }

    let targetVector = new Vector3();

    if (!touchControls)
    {
        if (keysPressed.includes(KeyCodes.keyA))
        {
            targetVector.x -= 1;
        }

        if (keysPressed.includes(KeyCodes.keyD))
        {
            targetVector.x += 1;
        }

        if (keysPressed.includes(KeyCodes.keyQ))
        {
            targetVector.y -= 1;
        }

        if (keysPressed.includes(KeyCodes.keyE))
        {
            targetVector.y += 1;
        }

        if (keysPressed.includes(KeyCodes.keyS))
        {
            targetVector.z -= 1;
        }
        
        if (keysPressed.includes(KeyCodes.keyW))
        {
            targetVector.z += 1;
        }

        if (keysJustPressed.includes(KeyCodes.keyL))
        {
            if (spotLightDistanceUniform.value > 0)
            {
                spotLightDistanceUniform.value = 0;
            }
            else
            {
                spotLightDistanceUniform.value = spotLightDistance;
            }
        }
    }
    else
    {
        targetVector.set(joystick.vector.x, 0, -joystick.vector.y);

        if (buttonUp)
        {
            targetVector.y += 1;
        }

        if (buttonDown)
        {
            targetVector.y -= 1;
        }
    }

    if (Math.abs(targetVector.x - moveVector.x) > mindelta)
    {
        moveVector.x = MathUtils.damp(moveVector.x, targetVector.x, smoothSpeed, deltaTime);
    }
    else
    {
        moveVector.x = targetVector.x;
    }

    if (Math.abs(targetVector.y - moveVector.y) > mindelta)
    {
        moveVector.y = MathUtils.damp(moveVector.y, targetVector.y, smoothSpeed, deltaTime);
    }
    else
    {
        moveVector.y = targetVector.y;
    }

    if (Math.abs(targetVector.z - moveVector.z) > mindelta)
    {
        moveVector.z = MathUtils.damp(moveVector.z, targetVector.z, smoothSpeed, deltaTime);
    }
    else
    {
        moveVector.z = targetVector.z;
    }

    let moveLength = moveVector.length();
    if (moveLength > 1)
    {
        moveVector.divideScalar(moveLength);
    }

    moving = moveVector.lengthSq() > 0;
    let moveSpeed = touchControls ? shiftMoveSpeed : keysPressed.includes(KeyCodes.shiftLeft) ? shiftMoveSpeed : baseMoveSpeed;
    if (moving)
    {
        moveSpeedMultiplier += moveSpeedMultiplier * moveSpeedExpMultiplier * deltaTime;
    }
    else
    {
        moveSpeedMultiplier = 1;
    }
    moveSpeed *= moveSpeedMultiplier;

    camera.position.add(new Vector3().copy(cameraRight).multiplyScalar(moveVector.x * moveSpeed * deltaTime));
    camera.position.add(new Vector3().copy(new Vector3(0, 1, 0)).multiplyScalar(moveVector.y * moveSpeed * deltaTime));
    camera.position.add(new Vector3().copy(cameraForward).multiplyScalar(moveVector.z * moveSpeed * deltaTime));
    //camera.position.clamp(new Vector3(-borderRadius, -5000, -borderRadius), new Vector3(borderRadius, 5000, borderRadius));

    if (!touchControls)
    {
        phi += mouseMovement.x * lookSensitivity * sensitivityMult;
        tetha = MathUtils.clamp(tetha + mouseMovement.y * lookSensitivity * sensitivityMult, -Math.PI / 2, Math.PI / 2);
    }

    let qx = new Quaternion();
    qx.setFromAxisAngle(new Vector3(0, -1, 0), phi);
    let qy = new Quaternion();
    qy.setFromAxisAngle(new Vector3(1, 0, 0), tetha);

    let q = new Quaternion();
    q.multiply(qx);
    q.multiply(qy);

    camera.quaternion.copy(q);
    UpdateCameraRotation();
    staticCamera.quaternion.copy(q);
}