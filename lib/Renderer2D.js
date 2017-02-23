THREE.RendusaRenderers = THREE.RendusaRenderers ? THREE.RendusaRenderers : {};

THREE.RendusaRenderers['2D'] = function ( renderer, source, target ) {
	var oThis = this;
	this.outFormat = 0;
	this.rendererName = '2D Renderer';
	this.inFormat = '2D';
	this.outFormats = [
		'2D',
	];
	var scene = new THREE.Scene();
	var mesh = new THREE.Mesh( 
		new THREE.PlaneBufferGeometry( 2, 2 ), 
		new THREE.MeshBasicMaterial( { color: 0xffffff } )
	);
	scene.add(mesh);

	this.scene = scene;

	var ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);	

	var _camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	_camera.matrixAutoUpdate = false;

	// rendertargets
	var renderTargetRGBA = null;

	// shaders
	var shaderBlend = new THREE.ShaderMaterial( THREE.DepthBlendShader, { depthWrite: false, depthTest: false } );

	var rgbWidth = 2;
	var rgbHeight = 2;

	var setSize = function ( width, height ) {	
		oThis.dispose();
		if (width <= 0 || height <= 0){
			return false;
		}
		rgbWidth = width;
		rgbHeight = height;
		_camera.aspect = width / height;
		_camera.updateProjectionMatrix();	
        scene.updateMatrixWorld();
        // 
		// reinit any resources
        //
		var _params = { 
			minFilter: THREE.LinearFilter, 
			magFilter: THREE.LinearFilter, 
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			transparent: true,
			opacity: 0.5,
		};
		renderTargetRGBA = new THREE.WebGLRenderTarget( width, height, _params );
		return true;
	};

	var srcIDChanged = function(){
		_srcID = source.srcID;
        if (rgbWidth != source.width || rgbHeight != source.height){
			setSize(source.width, source.height)
		}
		console.log('srcIDChanged', _srcID);
	};
	var _srcID = -1;
	this.render = function ( ) {
		// if (source.ready){
		// 	if (_srcID != source.srcID) srcIDChanged();
		// 	// draw rgb
		// 	shaderBlend.uniforms[ "mapIn" ].value = source.texture;
		// 	scene.overrideMaterial = shaderBlend;
        //     renderer.render( scene, _camera); //, renderTargetRGBA, true );
		// 	shaderBlend.uniforms[ "mapIn" ].value = null;					// release source.texture
		// 	// renderTargetRGBA is ready
		// } else {
        //     renderer.clear();
        // }	
        // TODO - draw overlay onto RGBA image
		if (source.ready){
			if (target.overlayRenderTargetReady){
				shaderBlend.uniforms[ "mapIn" ].value = source.texture;
				shaderBlend.uniforms[ "mapOverlay" ].value = target.overlayRenderTarget.texture;
				shaderBlend.uniforms[ "blend" ].value = 1;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, null, true );
				// // copy back
				// shaderBlend.uniforms[ "mapIn" ].value = renderTargetBlend.texture;
				// shaderBlend.uniforms[ "mapOverlay" ].value = null;
				// shaderBlend.uniforms[ "blend" ].value = 0;
				// scene.overrideMaterial = shaderBlend;
				// renderer.render( scene, _camera, renderTargetRGBA, true );
			}
			else 
			{
				shaderBlend.uniforms[ "mapIn" ].value = source.texture;
				shaderBlend.uniforms[ "blend" ].value = 0;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, null, true); //, renderTargetRGBA, true );
				shaderBlend.uniforms[ "mapIn" ].value = null;					// release source.texture
			}
		} else {
			shaderBlend.uniforms[ "mapIn" ].value = target.overlayRenderTarget.texture;
			shaderBlend.uniforms[ "blend" ].value = 0;
			scene.overrideMaterial = shaderBlend;
			renderer.render( scene, _camera, null, true); //, renderTargetRGBA, true );
			shaderBlend.uniforms[ "mapIn" ].value = null;					// release source.texture
		}
	};

	this.dispose = function() {
		if (renderTargetRGBA) renderTargetRGBA.dispose();
		renderTargetRGBA = null;
	}

};
