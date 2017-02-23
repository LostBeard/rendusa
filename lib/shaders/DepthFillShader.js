THREE.DepthFillShader = {
    uniforms: {
        "mapIn": { type: "t", value: null },
        "mapHeader": { type: "t", value: null },
        "spaceX": { type: "f", value: 1.0 },
        "sepMax": { type: "f", value: 1.0 },
        
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
