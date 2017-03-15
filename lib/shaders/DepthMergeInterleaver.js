(function(){

THREE.DepthMergeInterleaver = {
    uniforms: {
        "viewTexArray" : { type: "tv", value: [
            null, null, null, null, null, null, null, null, null
        ] },	
        "interleaverTex" : { type: "t", value: null },	
        "interleaverTex_size": { type: "v2", value: new THREE.Vector2( 4, 16 ) },
        "pattern_size": { type: "v2", value: new THREE.Vector2( 3, 9 ) },
    },
    vertexShader: null,
    fragmentShader: null
};

// tell shader loader we have resources that ren't loaded yet and to wait for us to finish.
THREE.ShaderLoader.addPreloadBusy();

var script_path = THREE.ShaderLoader.ScriptPath();

THREE.ShaderLoader.GetXML(script_path + 'Interleaver/config_screens.xml', function(e, res){
    var $xml = null;
    var interleavers = { };
    var layouts = [];
    if (res){
        $xml = jQuery(res);
        $xml.find('interleavers > interleaver').each(function(){
            var $this = jQuery(this);
            var interleaver = {
                name: $this.attr('name'),
                description: $this.attr('description'),
                views: $this.attr('views'),
                resolution: $this.attr('resolution'),
                pixel_size: $this.attr('pixel_size'),
                colormodel: $this.attr('colormodel'),
                data: null,
                cols: 0,
                rows: 0,
                type: 0,
                mat: [ ],
                ready: false,
            };
            interleavers[interleaver.name] = interleaver;
            THREE.ShaderLoader.GetArrayBuffer(script_path + 'Interleaver/' + interleaver.name.toLowerCase() + '.dat', function(e, res){
                if (res) {
                    interleaver.data = res;
                    interleaver.type = new Int32Array(interleaver.data, 0, 4)[0];
                    interleaver.rows = new Int32Array(interleaver.data, 4, 4)[0];
                    interleaver.cols = new Int32Array(interleaver.data, 8, 4)[0];
                    interleaver.mat = new Uint8Array(interleaver.data, 12);
                }
                interleaver.ready = true;
                var alldone = true;
                for(var i in interleavers){
                    if (!interleavers[i].ready) alldone = false;
                }
                if (alldone){
                    //console.log('All interleaver data is loaded');
                    THREE.ShaderLoader.subPreloadBusy();
                }
            });
        });
        $xml.find('layouts > layout').each(function(){
            var $this = jQuery(this);
            var layout = {
                name: $this.attr('name'),
                ext: $this.attr('ext'),
                views: [ ],
            };
            $this.find('view').each(function(){
                var $this = jQuery(this);
                var index = $this.attr('index') * 1;
                layout.views[index] = {
                    position: $this.attr('position'),
                };
            });
            layouts.push(layout);
        });
        //console.log('interleavers', interleavers);
    }
    var Interleaver = {
        interleavers: interleavers,
        layouts: layouts,
        $xml: $xml,
    }
    window.Interleaver = Interleaver;
});

THREE.ShaderLoader.LoadShader('DepthBasicShader.vs');
THREE.ShaderLoader.LoadShader('fs');

})();
