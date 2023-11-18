import { BufferAttribute, BufferGeometry, MathUtils, Mesh, Vector2, Vector3 } from "three";
import * as oceanMaterials from "../materials/OceanMaterial.js";
import { Random } from "../scripts/Random.js";
import { camera } from "../scripts/Scene.js";

const tilesPerAxis = 32;
const tileSize = 32;
const tilesRadius = MathUtils.clamp(8, 1, tilesPerAxis / 2);
const tileSize1 = tileSize + 1;
const worldSize = tilesPerAxis * tileSize;
const worldSize1 = worldSize + 1;
const scale = 1;
const halfSize = tilesPerAxis * tileSize * 0.5 * scale;

const base1 = new Vector2(0.003, 500);
const base2 = new Vector2(0.008, 0.2);
const base3 = new Vector2(0.02, 0.1);

const erosion = new Vector3(0.008, 0.02, 0.1);

const hill = new Vector2(0.03, 100);

const reliefPoints = 
[
    0, 0,
    0.12, 0,
    0.25, 0.5,
    0.35, 0.5,
    0.45, 0.75,
    0.5, 0.75,
    0.7, 1,
    1, 1,
];

const random = new Random();

const offsets = new Float64Array(12);
for (let i = 0; i < offsets.length; i++)
{
    offsets[i] = random.Next();
}

function CubicInterpolation(a, b, t)
{
    t = t * t * t * (t * (t * 6 - 15) + 10);
    return (1 - t) * a + t * b;
}

function SampleHeight(x, y)
{
    let h = reliefPoints[0] * base1.y - base1.y;

    x += offsets[0];
    y += offsets[1];
    let t = random.Perlin(x * base1.x, y * base1.x) * 0.5 + 0.5;

    x += offsets[2];
    y += offsets[3];
    t += (random.Perlin(x * base2.x, y * base2.x) * 0.5 + 0.5) * base2.y;

    x += offsets[4];
    y += offsets[5];
    t += (random.Perlin(x * base3.x, y * base3.x) * 0.5 + 0.5) * base3.y;

    t /= 1 + base2.y + base3.y;

    for (let i = 2; i < reliefPoints.length; i += 2)
    {
        if (t <= reliefPoints[i])
        {
            h = CubicInterpolation(reliefPoints[i - 1], reliefPoints[i + 1], MathUtils.mapLinear(t, reliefPoints[i - 2], reliefPoints[i], 0, 1)) * base1.y - base1.y;
            break;
        }
    }

    x += offsets[6];
    y += offsets[7];
    let e = random.Perlin(x * erosion.x, y * erosion.x) * 0.5;

    x += offsets[6];
    y += offsets[7];
    e = Math.max(e - (random.Perlin(x * erosion.y, y * erosion.y) * 0.5 + 0.5) * erosion.z, 0);

    x += offsets[10];
    y += offsets[11];
    h += (random.Perlin(x * hill.x, y * hill.x) * 0.5 + 0.5) * e * hill.y - hill.y * 0.3;
    
    return h;
}

export const borderRadius = halfSize - tilesRadius * tileSize;

export const tiles = new Array(tilesPerAxis * tilesPerAxis);

export function Start()
{   
    let heights = new Float32Array(worldSize1 * worldSize1);

    let worldVertices = new Float32Array(heights.length * 3);
    let worldIndices = new Array(worldSize * worldSize * 6);

    for (let z = 0; z < worldSize1; z++)
    {
        for (let x = 0; x < worldSize1; x++)
        {
            let i = (z * worldSize1 + x) * 3;
            worldVertices[i] = x;
            worldVertices[i + 1] = SampleHeight(x, z);
            worldVertices[i + 2] = z;

            heights[z * worldSize1 + x] = worldVertices[i + 1];
        }
    }

    for (let z = 0; z < worldSize; z++)
    {
        for (let x = 0; x < worldSize; x++)
        {
            let v = z * worldSize1 + x;
            let i = (z * worldSize + x) * 6;

            if ((x % 2 == 0 && z % 2 == 0) || (x % 2 == 1 && z % 2 == 1))
            {
                worldIndices[i] = v + worldSize1 + 1;
                worldIndices[i + 1] = v + 1;
                worldIndices[i + 2] = v;

                worldIndices[i + 3] = v;
                worldIndices[i + 4] = v + worldSize1;
                worldIndices[i + 5] = v + worldSize1 + 1;
            }
            else
            {
                worldIndices[i] = v + worldSize1;
                worldIndices[i + 1] = v + 1;
                worldIndices[i + 2] = v;

                worldIndices[i + 3] = v + worldSize1;
                worldIndices[i + 4] = v + worldSize1 + 1;
                worldIndices[i + 5] = v + 1;
            }
        }
    }

    let worldGeometry = new BufferGeometry();
    worldGeometry.setAttribute("position", new BufferAttribute(worldVertices, 3));
    worldGeometry.setIndex(worldIndices);
    worldGeometry.computeVertexNormals();
    let worldNormals = worldGeometry.getAttribute("normal").array;

    let indices = new Array(tileSize * tileSize * 6);

    for (let z = 0; z < tileSize; z++)
    {
        for (let x = 0; x < tileSize; x++)
        {
            let v = z * tileSize1 + x;
            let i = (z * tileSize + x) * 6;

            if ((x % 2 == 0 && z % 2 == 0) || (x % 2 == 1 && z % 2 == 1))
            {
                indices[i] = v + tileSize1 + 1;
                indices[i + 1] = v + 1;
                indices[i + 2] = v;

                indices[i + 3] = v;
                indices[i + 4] = v + tileSize1;
                indices[i + 5] = v + tileSize1 + 1;
            }
            else
            {
                indices[i] = v + tileSize1;
                indices[i + 1] = v + 1;
                indices[i + 2] = v;

                indices[i + 3] = v + tileSize1;
                indices[i + 4] = v + tileSize1 + 1;
                indices[i + 5] = v + 1;
            }
        }
    }

    for (let tileZ = 0; tileZ < tilesPerAxis; tileZ++)
    {
        for (let tileX = 0; tileX < tilesPerAxis; tileX++)
        {
            let vertices = new Float32Array(tileSize1 * tileSize1 * 3);
            let normals = new Float32Array(vertices.length);

            for (let z = 0; z < tileSize1; z++)
            {
                for (let x = 0; x < tileSize1; x++)
                {
                    let i = (z * tileSize1 + x) * 3;
                    let worldX = x + tileX * tileSize;
                    let worldZ = z + tileZ * tileSize;

                    vertices[i] = (worldX - halfSize) * scale;
                    vertices[i + 1] = heights[worldZ * worldSize1 + worldX] * scale;
                    vertices[i + 2] = (worldZ - halfSize) * scale;

                    let j = ((tileZ * tileSize + z) * worldSize1 + tileX * tileSize + x) * 3;

                    normals[i] = worldNormals[j];
                    normals[i + 1] = worldNormals[j + 1];
                    normals[i + 2] = worldNormals[j + 2];
                }
            }

            let geometry = new BufferGeometry();
            geometry.setAttribute("position", new BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
            geometry.setAttribute("normal", new BufferAttribute(normals, 3));

            let mesh = new Mesh();
            mesh.geometry = geometry;
            mesh.material = oceanMaterials.triplanar;
            mesh.visible = false;

            tiles[tileZ * tilesPerAxis + tileX] = mesh;
        }
    }
}

let lastTilesIndices = new Array();

export function Update()
{
    let playerTile = MathUtils.clamp(Math.round((camera.position.z + halfSize) / tileSize), tilesRadius, tilesPerAxis - tilesRadius) * tilesPerAxis + MathUtils.clamp(Math.round((camera.position.x + halfSize) / tileSize), tilesRadius, tilesPerAxis - tilesRadius);

    for (let i = 0; i < lastTilesIndices.length; i++)
    {
        tiles[lastTilesIndices[i]].visible = false;
    }

    lastTilesIndices = new Array();

    for (let z = -tilesRadius; z < tilesRadius; z++)
    {
        for (let x = -tilesRadius; x < tilesRadius; x++)
        {
            let i = playerTile + z * tilesPerAxis + x;
            lastTilesIndices.push(i);
            tiles[i].visible = true;
        }
    }
}