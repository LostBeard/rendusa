THREE.UIShader = {
    uniforms: {
        "mapIn": { type: "t", value: null },
        "mapRight": { type: "t", value: null },
        "mapHeader": { type: "t", value: null },
        "sepMax": { type: "f", value: 1.0 },
        "spaceX": { type: "f", value: 1.0 },
        "spaceXHalf": { type: "f", value: 1.0 },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
