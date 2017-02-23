THREE.DepthMerge2DZShader = {
    uniforms: {
        "viewTexArray" : { type: "tv", value: [ null, null, null ] },
        "width": { type: "f", value: 1.0 },
        "height": { type: "f", value: 1.0 },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
