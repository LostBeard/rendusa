THREE.DepthMerge9ViewsShader = {
    uniforms: {
        "viewTexArray" : { type: "tv", value: [ null, null, null, null, null, null, null, null, null ] },		
        "outFormat": { type: "i", value: 1 },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
