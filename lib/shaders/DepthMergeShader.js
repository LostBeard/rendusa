THREE.DepthMergeShader = {
    uniforms: {
        "viewTexArray" : { type: "tv", value: [ null, null ] },
        "brightness": { type: "f", value: 0.0 },
        "contrast": { type: "f", value: 0.0 },			
        "outFormat": { type: "i", value: 1 },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
