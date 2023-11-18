import { BoxGeometry, Euler, Mesh, Vector3 } from "three";
import * as oceanMaterials from "../materials/OceanMaterial.js";

export let blocks = [];

function CreateBox(postion, rotation, scale)
{
    const geometry = new BoxGeometry(scale.x, scale.y, scale.z);
    geometry.rotateX(rotation.x);
    geometry.rotateY(rotation.y);
    geometry.rotateZ(rotation.z);
    const box = new Mesh(geometry, oceanMaterials.object);
    box.position.set(postion.x, postion.y, postion.z);
    box.geometry.computeVertexNormals();
    blocks.push(box);
}

export function Start()
{
    CreateBox(new Vector3(-7.2, 10, 1.3), new Euler(0, 0, 0), new Vector3(10, 50, 10));
    CreateBox(new Vector3(15, 1, 1.3), new Euler(0, 30, 0), new Vector3(2, 3, 2));
    CreateBox(new Vector3(-7.7, -2.6, -30.7), new Euler(0, 70.2, 16.8), new Vector3(10, 10, 10));
    CreateBox(new Vector3(-156, -100.6, 0.2), new Euler(0, 45, 0), new Vector3(100, 100, 100));
    CreateBox(new Vector3(-7.8, -33.9, -78.1), new Euler(-31.8, 135.5, 0), new Vector3(50, 50, 50));
    CreateBox(new Vector3(29.7, -169.5, -73.8), new Euler(0, 0, -27.21), new Vector3(50, 50, 50));
    CreateBox(new Vector3(81.3, -29.38, 19.1), new Euler(0, 0, 0), new Vector3(50, 1, 50));
    CreateBox(new Vector3(0, -99.6, 76.5), new Euler(12, -93.13, 30.1), new Vector3(50, 200, 50));
}