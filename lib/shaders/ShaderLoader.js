(function($){

function getThisPath(){
    var scripts = document.getElementsByTagName("script");
    var jsSrc = scripts[scripts.length - 1].src;
    var jsPath = jsSrc.substr(0, jsSrc.lastIndexOf('/') + 1); // file path ending in /
    return jsPath;
}

var shadersDir = getThisPath();

var _preload_busy = 0;
var loadingCount = 0;
var loadedCount = 0;
var loaded = false;
var documentReady = false;

var onLoadComplete = function(){
    if (loadedCount == loadingCount && documentReady && !loaded && _preload_busy === 0){
        loaded = true;
        //console.log('All ShaderLoader resources are loaded');
        $(document).trigger('ShaderLoaderComplete');
    }
};
var cache = { };

var fsLoaded = function(src, dat, shaderName){
    cache[src] = {
        data: dat,
        src: src,
        success: typeof dat == 'string' && dat.length > 0,
        shaderType: 'fragment'  
    };
    if (typeof THREE[shaderName].fragmentShader != 'string'){
        THREE[shaderName].fragmentShader = dat;
        //console.log('Loaded THREE.' + shaderName + '.fragmentShader = ' + src.substr(src.lastIndexOf('/') + 1));
    }
    loadedCount++;
    onLoadComplete();
};
var vsLoaded = function(src, dat, shaderName){
    cache[shaderName] = {
        data: dat,
        src: src,
        success: typeof dat == 'string' && dat.length > 0,
        shaderType: 'vertex'  
    };
    if (typeof THREE[shaderName].vertexShader != 'string'){
        THREE[shaderName].vertexShader = dat;
        //console.log('Loaded THREE.' + shaderName + '.vertexShader = ' + src.substr(src.lastIndexOf('/') + 1));
    }
    loadedCount++;
    onLoadComplete();
};

var ShaderLoader = function(){
    Object.defineProperties(this, {
        loaded: {
            get: function() { return loaded; }
        }
    });

    
	this.addPreloadBusy = function(){
		if (loaded) return false;
		_preload_busy++;
		return true;
	};
	this.subPreloadBusy = function(){
		if (loaded || _preload_busy <= 0) return false;
		_preload_busy--;
		if (_preload_busy === 0) onLoadComplete();
		return true;
	};

    this.GetArrayBuffer = function(url, callback){
        var err = null;
        var data = null;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onerror = function(e){
            //console.log('xhr.onerror', e);
            err = e;
            if (callback) callback(err, data);
            callback = null;
        };
        xhr.onload = function(e) {
            //console.log('typeof this.response', typeof this.response);
            if (this.status == 200) {
                data = this.response;
            } else {
                err = 'ERROR ' + this.status;
            }
            if (callback) callback(err, data);
            callback = null;
        };
        xhr.send();
    };
    this.GetXML = function(url, callback){
        var data = null;
        var err = null;
        jQuery.ajax({ 
            url: url,
            dataType: 'text',
            error: function(e){ 
                err = e;
            }, 
            success: function(dat){ 
                if (typeof dat == 'string' && dat.length > 0) data = dat;
            }, 
            complete: function(){ 
                callback(err, data);
            },
        });
    };
    this.buildShader = function(shader, fragmentDefines, vertexDefines){
        if (typeof shader != 'object' || shader == null) return null;
        // simple define helper.
        // only allows changing of exisitng #define statements
        var newShader = {
            uniforms: { },
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        };
        // copy uniforms
        for (var key in shader.uniforms) {
            if (shader.uniforms.hasOwnProperty(key)) {
                newShader.uniforms[key] = shader.uniforms[key];
            }
        }
        var doit = function(defineName, defineVal, shaderStr){
            var ret = shaderStr;
            var pat = new RegExp('^(\s*#define\s+)(' + defineName + '(?!\w))(?:$|(\s*)(.*?)\s+(//.*)?($))', 'gm');
            if (defineVal.indexOf('(') !== 0) defineVal = ' ' + defineVal;
            ret = ret.replace(pat, "$1$2$3" + defineVal + " $5");
            return ret;
        };
        if (vertexDefines){
            for (var key in vertexDefines) {
                newShader.vertexShader = doit(key, vertexDefines[key], newShader.vertexShader);
            }
        }
        if (fragmentDefines){
            for (var key in fragmentDefines) {
                newShader.fragmentShader = doit(key, fragmentDefines[key], newShader.fragmentShader);
            }
        }
        return newShader;
    };
    this.getDefines = function(shader){
        var ret = [];
        //var pat = new RegExp('^\\s*#define\\s+(\\w+)\\s*(.*?)\\s*(//.*)?$', "gm");
        var pat = new RegExp('^(\\s*#define\\s+)(\\w+)(\\s*)(.*?)(\\s*//.*)?$', "gm");
        var m = pat.exec(shader);
        while(m != null){
            ret.push({
                name: m[2],
                value: m[4],
                comment: m[5],
            });
        }
        return ret;
    };
    this.ConfigShader = function(shader, replacements){
        if (typeof shader != 'object' || shader == null) return null;
        var newShader = {
            uniforms: { },
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        };
        for (var key in shader.uniforms) {
            if (shader.uniforms.hasOwnProperty(key)) {
                newShader.uniforms[key] = shader.uniforms[key];
            }
        }
        for (var key in replacements) {
            if (replacements.hasOwnProperty(key)) {
                //console.log('Replacement ' + key + ' ' + replacements[key]);
                newShader.vertexShader = newShader.vertexShader.replace(new RegExp(key, "gm"), replacements[key]);
                newShader.fragmentShader = newShader.fragmentShader.replace(new RegExp(key, "gm"), replacements[key]);
            }
        }
        return newShader;
    };
    this.ScriptPath = function(){
        var scripts = document.getElementsByTagName("script");
        var jsSrc = scripts[scripts.length - 1].src;
        var jsPath = jsSrc.substr(0, jsSrc.lastIndexOf('/') + 1); // file path ending in /
        return jsPath;
    };
    this.LoadShader = function(resourceExt){
        // must be called as soon as shader js file is loaded to automatically get resource file paths
        var scripts = document.getElementsByTagName("script");
        var jsSrc = scripts[scripts.length - 1].src;
        var jsPath = jsSrc.substr(0, jsSrc.lastIndexOf('/') + 1); // file path ending in /
        var partSrc = jsSrc.substr(0, jsSrc.lastIndexOf('.'));
        var shaderName = partSrc.substr(partSrc.lastIndexOf('/') + 1);
        if (resourceExt.indexOf('.') > -1){
            partSrc = jsPath + resourceExt;
            resourceExt = resourceExt.substr(resourceExt.lastIndexOf('.') + 1);
            partSrc = partSrc.substr(0, partSrc.lastIndexOf('.')); 
        }
        var data = null;
        var doReplace = function(dat){
            return dat;
        };
        if (resourceExt == 'fs'){
            loadingCount++;
            loaded = false;
            partSrc += '.fs';
            jQuery.ajax({ url: partSrc, 
                success: function(dat){ 
                    if (typeof dat == 'string' && dat.length > 0) data = doReplace(dat);
                }, 
                complete: function(){ 
                    fsLoaded(partSrc, data, shaderName);
                }, 
                dataType: 'text' 
            });
        } else if (resourceExt == 'vs'){
            loadingCount++;
            loaded = false;
            partSrc += '.vs';
            jQuery.ajax({ url: partSrc, 
                success: function(dat){ 
                    if (typeof dat == 'string' && dat.length > 0) data = doReplace(dat);
                }, 
                complete: function(){ 
                    vsLoaded(partSrc, data, shaderName);
                }, 
                dataType: 'text' 
            });
        }
    }
};
THREE.ShaderLoader = new ShaderLoader();

$(document).ready(function(){
    documentReady = true;
    onLoadComplete();
});

// $(document).on('ShaderLoaderComplete', function(){
//     console.log('ShaderLoaderComplete event fired');
// });

})(jQuery)