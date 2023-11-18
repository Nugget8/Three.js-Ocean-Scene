import { DataTexture, MathUtils, RepeatWrapping, ShaderMaterial, TextureLoader, Uniform, Vector2, Vector3 } from "three";
import { fragment, vertex } from "../shaders/SkyboxShader.js";
import { dirToLight, rotationMatrix } from "../scene/Skybox.js";
import { Random } from "../scripts/Random.js";

export const material = new ShaderMaterial();
export let SetSkyboxUniforms;

const ditherSize = new Uniform(new Vector2());
const dither = new Uniform();
const sunVisibility = new Uniform(1);
const twilightTime = new Uniform(0);
const twilightVisibility = new Uniform(0);

const starsSeed = 87;
const gridSize = 64;
const starsCount = 10000;
const maxOffset = 0.43;
const starsMap = new Uint8Array(gridSize * gridSize * 24);
const stars = new Uniform();

const specularVisibility = new Uniform(Math.sqrt(sunVisibility.value));
const light = new Uniform(new Vector3(1, 1, 1));

const up = new Vector3(0, 1, 0);

let intensity = 0;
let l = 0;

function Vector3ToStarMap(dir, value)
{
    const absDir = new Vector3(Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z));

    const xPositive = dir.x > 0;
    const yPositive = dir.y > 0;
    const zPositive = dir.z > 0;

    let maxAxis = 0;
    let u = 0;
    let v = 0;
    let i = 0;

    if (xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z)
    {
        maxAxis = absDir.x;
        u = -dir.z;
        v = dir.y;
        i = 0;
    }

    if (!xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z)
    {
        maxAxis = absDir.x;
        u = dir.z;
        v = dir.y;
        i = 1;
    }

    if (yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z)
    {
        maxAxis = absDir.y;
        u = dir.x;
        v = -dir.z;
        i = 2;
    }

    if (!yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z)
    {
        maxAxis = absDir.y;
        u = dir.x;
        v = dir.z;
        i = 3;
    }

    if (zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y)
    {
        maxAxis = absDir.z;
        u = dir.x;
        v = dir.y;
        i = 4;
    }

    if (!zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y)
    {
        maxAxis = absDir.z;
        u = -dir.x;
        v = dir.y;
        i = 5;
    }

    u = Math.floor((u / maxAxis + 1) * 0.5 * gridSize);
    v = Math.floor((v / maxAxis + 1) * 0.5 * gridSize);

    const j = (v * gridSize * 6 + i * gridSize + u) * 4;
    starsMap[j] = value[0];
    starsMap[j + 1] = value[1];
    starsMap[j + 2] = value[2];
    starsMap[j + 3] = value[3];
}

export function Start()
{
    dither.value = new TextureLoader().load("images/bluenoise.png", function(texture)
    {
        ditherSize.value.x = texture.image.width;
        ditherSize.value.y = texture.image.height;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
    });

    const random = new Random(starsSeed);

    for (let i = 0; i < starsCount; i++)
    {
        const a = random.Next() * Math.PI * 2;
        const b = random.Next() * 2 - 1;
        const c = Math.sqrt(1 - b * b);
        const target = new Vector3(Math.cos(a) * c, Math.sin(a) * c, b);
        Vector3ToStarMap(target, [MathUtils.lerp(0.5 - maxOffset, 0.5 + maxOffset, random.Next()) * 255, MathUtils.lerp(0.5 - maxOffset, 0.5 + maxOffset, random.Next()) * 255, Math.pow(random.Next(), 6) * 255, random.Next() * 255]);
    }

    stars.value = new DataTexture(starsMap, gridSize * 6, gridSize);
    stars.value.needsUpdate = true;

    material.vertexShader = vertex;
    material.fragmentShader = fragment;

    intensity = dirToLight.dot(up);
    sunVisibility.value = MathUtils.clamp((intensity + 0.1) * 2, 0, 1);
    twilightTime.value = MathUtils.clamp((intensity + 0.1) * 3, 0, 1);
    twilightVisibility.value = 1 - Math.min(Math.abs(intensity * 3), 1);

    SetSkyboxUniforms = function(material)
    {
        material.uniforms._SkyRotationMatrix = rotationMatrix;
        material.uniforms._DitherTexture = dither;
        material.uniforms._DitherTextureSize = ditherSize;
        material.uniforms._SunVisibility = sunVisibility;
        material.uniforms._TwilightTime = twilightTime;
        material.uniforms._TwilightVisibility = twilightVisibility;
        material.uniforms._GridSize = new Uniform(gridSize);
        material.uniforms._GridSizeScaled = new Uniform(gridSize * 6);
        material.uniforms._Stars = stars;
        material.uniforms._SpecularVisibility = specularVisibility;
        material.uniforms._DirToLight = new Uniform(dirToLight);
        material.uniforms._Light = light;
    }
    SetSkyboxUniforms(material);
}

export function Update()
{
    intensity = dirToLight.dot(up);
    sunVisibility.value = MathUtils.clamp((intensity + 0.1) * 2, 0, 1);
    twilightTime.value = MathUtils.clamp((intensity + 0.1) * 3, 0, 1);
    twilightVisibility.value = 1 - Math.min(Math.abs(intensity * 3), 1);
    specularVisibility.value = Math.sqrt(sunVisibility.value);
    l = Math.min(sunVisibility.value + 0.333, 1);
    light.value.set(l, l, l);
}