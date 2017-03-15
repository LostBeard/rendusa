THREE.DepthMergeAnaglyphShader = {
    uniforms: {
        "viewTexArray" : { type: "tv", value: [ null, null ] },
        "brightness": { type: "f", value: 0.0 },	
        "contrast": { type: "f", value: 0.0 },		
        "redMixer" : { type: "fv", value: [ 0, 0, 0, 0, 0, 0 ] },
        "greenMixer" : { type: "fv", value: [ 0, 0, 0, 0, 0, 0 ] },
        "blueMixer" : { type: "fv", value: [ 0, 0, 0, 0, 0, 0 ] },
    },
    vertexShader: null,
    fragmentShader: null
};

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');
