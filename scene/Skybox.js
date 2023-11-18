import { BufferAttribute, BufferGeometry, MathUtils, Matrix3, Mesh, Uniform, Vector3 } from "three";
import * as skyboxMaterial from "../materials/SkyboxMaterial.js";
import { deltaTime } from "../scripts/Time.js";
import { camera } from "../scripts/Scene.js";

export const skybox = new Mesh();
export const dirToLight = new Vector3();
export const rotationMatrix = new Uniform(new Matrix3());

const halfSize = 2000;
const speed = 0.05;
const initial = new Vector3(0, 1, 0);
const axis = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(-30));
let angle = -1;

function setSkyRotationMatrix(angle)
{
    const cos = Math.cos(angle);
    const cos1 = 1 - cos;
    const sin = Math.sin(angle);
    const u = axis;
    const u2 = axis.clone().multiply(axis);
    rotationMatrix.value.set
    (
        cos + u2.x * cos1,              u.x * u.y * cos1 - u.z * sin,   u.x * u.z * cos1 + u.y * sin,
        u.y * u.x * cos1 + u.z * sin,   cos + u2.y * cos1,              u.y * u.z * cos1 - u.x * sin,
        u.z * u.x * cos1 - u.y * sin,   u.z * u.y * cos1 + u.x * sin,   cos + u2.z * cos1
    );
}

export function Start()
{
    dirToLight.copy(initial);
    skyboxMaterial.Start();

    const vertices = new Float32Array
    ([
        -halfSize, -halfSize, -halfSize,
        halfSize, -halfSize, -halfSize,
        -halfSize, -halfSize, halfSize,
        halfSize, -halfSize, halfSize,

        -halfSize, halfSize, -halfSize,
        halfSize, halfSize, -halfSize,
        -halfSize, halfSize, halfSize,
        halfSize, halfSize, halfSize
    ]);

    const indices = 
    [
        2, 3, 0, 3, 1, 0,
        0, 1, 4, 1, 5, 4,
        1, 3, 5, 3, 7, 5,
        3, 2, 7, 2, 6, 7,
        2, 0, 6, 0, 4, 6,
        4, 5, 6, 5, 7, 6
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    geometry.setAttribute("coord", new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    skybox.geometry = geometry;
    skybox.material = skyboxMaterial.material;

    setSkyRotationMatrix(angle);
    initial.applyMatrix3(rotationMatrix.value);
    dirToLight.set(-initial.x, initial.y, -initial.z);
    initial.set(0, 1, 0);
}

export function Update()
{   
    angle += deltaTime * speed;
    setSkyRotationMatrix(angle);
    initial.applyMatrix3(rotationMatrix.value);
    dirToLight.set(-initial.x, initial.y, -initial.z);
    initial.set(0, 1, 0);
    skyboxMaterial.Update();
    skybox.position.copy(camera.position);
}