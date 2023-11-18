export const vertexShader = 
/*glsl*/`
    varying vec2 _uv;

    void main()
    {
        _uv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader = 
/*glsl*/`
    varying vec2 _uv;

    void main() 
    {
        gl_FragColor = vec4(_uv.x, _uv.y, 0.5, 1.0);
    }
`;