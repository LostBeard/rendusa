THREE.DepthBlendShader = {
    uniforms: {
        "mapIn": { type: "t", value: null },
        "mapOverlay": { type: "t", value: null },
        "mapHeader": { type: "t", value: null },
        "blend": { type: "i", value: 0 },
        "maskColor": { type: "f", value: 1.0 },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
