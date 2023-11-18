import { ShaderChunk } from "three";

const global = 
/*glsl*/`
    const float FOG_DISTANCE = 1000.0;
`;

const skybox =
/*glsl*/`
    #include <common>

    const float DITHER_STRENGTH = 0.1;

    const vec3 DAY_SKY_COLOR = vec3(0.25, 0.4, 0.6);
    const vec3 DAY_HORIZON_COLOR = vec3(0.75, 0.9, 1);
    const vec3 EARLY_TWILIGHT_COLOR = vec3(1, 0.83, 0.5);
    const vec3 LATE_TWILIGHT_COLOR = vec3(1, 0.333, 0.167);
    const vec3 NIGHT_SKY_COLOR = vec3(0.06, 0.1, 0.15);
    const vec3 NIGHT_HORIZON_COLOR = vec3(0.07, 0.13, 0.18);

    const float SUN_SHARPNESS = 2000.0;
    const float SUN_SIZE = 5.0;
    const float MOON_SHARPNESS = 12000.0;
    const float MOON_SIZE = 5000.0;

    const float STARS_SHARPNESS = 50.0;
    const float STARS_SIZE = 10.0;
    const float WIDTH_SCALE = 1.0 / 6.0;
    const float WIDTH_SCALE_HALF = WIDTH_SCALE / 2.0;
    const vec3 STARS_COLORS[6] = vec3[6]
    (
        vec3(1.0, 0.95, 0.9),
        vec3(1.0, 0.9, 0.9),
        vec3(0.9, 1.0, 1.0),
        vec3(0.9, 0.95, 1.0),
        vec3(1.0, 0.9, 1.0),
        vec3(1.0, 1.0, 1.0)
    );
    const float STARS_FALLOFF = 15.0;
    const float STARS_VISIBILITY = 450.0;

    const vec3 UP = vec3(0.0, 1.0, 0.0);

    uniform mat3 _SkyRotationMatrix;

    uniform sampler2D _DitherTexture;
    uniform vec2 _DitherTextureSize;
    uniform float _SunVisibility;
    uniform float _TwilightTime;
    uniform float _TwilightVisibility;
    uniform float _MoonVisibility;
    uniform float _GridSize;
    uniform float _GridSizeScaled;
    uniform sampler2D _Stars;
    uniform float _SpecularVisibility;
    uniform vec3 _DirToLight;
    uniform vec3 _Light;

    float dither = 0.0;

    vec2 sampleCubeCoords(vec3 dir)
    {
        vec3 absDir = abs(dir);

        bool xPositive = dir.x > 0.0 ? true : false;
        bool yPositive = dir.y > 0.0 ? true : false;
        bool zPositive = dir.z > 0.0 ? true : false;

        float maxAxis = 1.0;
        float u = 0.0;
        float v = 0.0;
        float i = 0.0;

        if (xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z)
        {
            maxAxis = absDir.x;
            u = -dir.z;
            v = dir.y;
            i = 0.0;
        }

        if (!xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z)
        {
            maxAxis = absDir.x;
            u = dir.z;
            v = dir.y;
            i = 1.0;
        }

        if (yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z)
        {
            maxAxis = absDir.y;
            u = dir.x;
            v = -dir.z;
            i = 2.0;
        }

        if (!yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z)
        {
            maxAxis = absDir.y;
            u = dir.x;
            v = dir.z;
            i = 3.0;
        }

        if (zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y)
        {
            maxAxis = absDir.z;
            u = dir.x;
            v = dir.y;
            i = 4.0;
        }

        if (!zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y)
        {
            maxAxis = absDir.z;
            u = -dir.x;
            v = dir.y;
            i = 5.0;
        }

        u = i * WIDTH_SCALE + (u / maxAxis + 1.0) * WIDTH_SCALE_HALF;
        v = (v / maxAxis + 1.0) * 0.5;
        return vec2(u, v);
    }

    void sampleDither(vec2 fragCoord)
    {
        dither = (texture2D(_DitherTexture, (fragCoord - vec2(0.5)) / _DitherTextureSize).x - 0.5) * DITHER_STRENGTH;
    }

    vec3 sampleSkybox(vec3 dir)
    {
        vec3 viewDir = _SkyRotationMatrix * dir;

        float density = clamp(pow2(1.0 - max(0.0, dot(dir, UP) + dither)), 0.0, 1.0);

        float sunLight = dot(viewDir, UP);
        float sun = min(pow(max(0.0, sunLight), SUN_SHARPNESS) * SUN_SIZE, 1.0);

        float moonLight = -sunLight;
        float moon = min(pow(max(0.0, moonLight), MOON_SHARPNESS) * MOON_SIZE, 1.0);

        vec3 day = mix(DAY_SKY_COLOR, DAY_HORIZON_COLOR, density);
        vec3 twilight = mix(LATE_TWILIGHT_COLOR, EARLY_TWILIGHT_COLOR, _TwilightTime);
        vec3 night = mix(NIGHT_SKY_COLOR, NIGHT_HORIZON_COLOR, density);

        vec3 sky = mix(night, day, _SunVisibility);
        sky = mix(sky, twilight, density * clamp(sunLight * 0.5 + 0.5 + dither, 0.0, 1.0) * _TwilightVisibility);

        vec2 cubeCoords = sampleCubeCoords(viewDir);
        vec4 gridValue = texture2D(_Stars, cubeCoords);

        vec2 gridCoords = vec2(cubeCoords.x * _GridSizeScaled, cubeCoords.y * _GridSize);
        vec2 gridCenterCoords = floor(gridCoords) + gridValue.xy;
        float stars = max(min(pow(1.0 - min(distance(gridCoords, gridCenterCoords), 1.0), STARS_SHARPNESS) * gridValue.z * STARS_SIZE, 1.0), moon);
        stars *= min(exp(-dot(sky, vec3(1.0)) * STARS_FALLOFF) * STARS_VISIBILITY, 1.0);

        sky = mix(sky, max(STARS_COLORS[int(gridValue.w * 6.0)], vec3(moon)), stars);
        sky = mix(sky, vec3(1.0), sun);
        
        return sky;
    }

    vec3 sampleFog(vec3 dir)
    {
        vec3 viewDir = _SkyRotationMatrix * dir;

        float sunLight = dot(viewDir, UP);
        vec3 twilight = mix(LATE_TWILIGHT_COLOR, EARLY_TWILIGHT_COLOR, _TwilightTime);
        vec3 horizon = mix(NIGHT_HORIZON_COLOR, DAY_HORIZON_COLOR, _SunVisibility);
        horizon = mix(horizon, twilight, clamp(sunLight * 0.5 + 0.5 + dither, 0.0, 1.0) * _TwilightVisibility);

        return horizon;
    }
`;

const ocean =
/*glsl*/`
    #include <global>
    #include <skybox>

    const float NORMAL_MAP_SCALE = 0.1;
    const float NORMAL_MAP_STRENGTH = 0.2;
    const vec2 VELOCITY_1 = vec2(0.1, 0.0);
    const vec2 VELOCITY_2 = vec2(0.0, 0.1);
    const float SPECULAR_SHARPNESS = 100.0;
    const float SPECULAR_SIZE = 1.1;
    const float MAX_VIEW_DEPTH = 100.0;
    const float DENSITY = 0.35;
    const float MAX_VIEW_DEPTH_DENSITY = MAX_VIEW_DEPTH * DENSITY;
    const vec3 ABSORPTION = vec3(1.0) / vec3(10.0, 40.0, 100.0);
    const float CRITICAL_ANGLE = asin(1.0 / 1.33) / PI_HALF;

    uniform float _Time;
    uniform sampler2D _NormalMap1;
    uniform sampler2D _NormalMap2;
`;

const parallax = 
/*glsl*/`
    const float PARALLAX_STRENGTH = 0.2;
    const int PARALLAX_LAYERS_INT = 1;
    const float PARALLAX_LAYERS = float(PARALLAX_LAYERS_INT);
    const float PARALLAX_LAYER_DEPTH = 1.0 / PARALLAX_LAYERS;

    vec2 ParallaxMapping(sampler2D map, vec2 coords, vec3 viewDir)
    {
        float previousLayerDepth = 0.0;
        float currentLayerDepth = previousLayerDepth;

        vec2 p = viewDir.xz * PARALLAX_STRENGTH;
        vec2 deltaCoords = p / PARALLAX_LAYERS;

        vec2 previousCoords = coords;
        vec2 currentCoords = previousCoords;

        float previousHeight = texture2D(map, currentCoords).a;
        float currentHeight = previousHeight;

        #pragma unroll_loop_start 
        for (int i = 0; i < PARALLAX_LAYERS_INT; i++)
        {
            if (currentLayerDepth < currentHeight)
            {
                previousCoords = currentCoords;
                currentCoords -= deltaCoords;

                previousHeight = currentHeight;
                currentHeight = texture2D(map, currentCoords).a;

                previousLayerDepth = currentLayerDepth;
                currentLayerDepth += PARALLAX_LAYER_DEPTH;
            }
        }
        #pragma unroll_loop_end

        float afterHeight = currentHeight - currentLayerDepth;
        float beforeHeight = previousHeight - previousLayerDepth;
        float weight = afterHeight / (afterHeight - beforeHeight);

        return previousCoords * weight + currentCoords * (1.0 - weight);
    }
`;

export function Start()
{
    ShaderChunk.global = global;
    ShaderChunk.skybox = skybox;
    ShaderChunk.ocean = ocean;
    ShaderChunk.parallax = parallax;
}