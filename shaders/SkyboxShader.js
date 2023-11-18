export const vertex =
/*glsl*/`
    uniform mat3 _SkyRotationMatrix;

    attribute vec3 coord;

    varying vec3 _worldPos;
    varying vec3 _coord;

    void main()
    {
        _worldPos = coord;
        _coord = _SkyRotationMatrix * _worldPos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragment =
/*glsl*/`
    #include <skybox>

    varying vec3 _worldPos;
    varying vec3 _coord;

    void main() 
    {
        vec3 worldDir = normalize(_worldPos);
        vec3 viewDir = normalize(_coord);

        float dither = (texture2D(_DitherTexture, (gl_FragCoord.xy - vec2(0.5)) / _DitherTextureSize).x - 0.5) * DITHER_STRENGTH;
        float density = clamp(pow2(1.0 - max(0.0, dot(worldDir, UP) + dither)), 0.0, 1.0);

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

        gl_FragColor = vec4(sky, 1.0);
    }
`;