"use strict";

(function($){

THREE.RendusaRenderers = THREE.RendusaRenderers ? THREE.RendusaRenderers : {};

// TODO - debug mode that shows shift with darkened non-shifted, or red instead of fill
// invalid/corrupt header data indicator hadling.
// allow adjust of 3D level in 2DZ mode. requires header recalculation

THREE.RendusaRenderers['2DZ'] = function ( renderer, source, target, _rendusa ) {
	var oThis = this;
	this.rendererName = '2DZ Renderer';
	this.inFormat = '2DZ';
	this.outFormats = [ ];
	var outFormatReqs = {
		'2D': {
			viewCount: 1,
			mergeShaderIndex: 0,
		},
		'2D+Z': {
			viewCount: 1,
			mergeShaderIndex: 3,
			posHandler: function(e, pos){
				pos.x *= 2;
			}
		},
		'Anaglyph Red Cyan': {
			viewCount: 2,
			mergeShaderIndex: 5,
			mix: 'red_cyan',
		},
		// 'Anaglyph Red Cyan Dubois': {
		// 	viewCount: 2,
		// 	mergeShaderIndex: 5,
		// 	mix: 'red_cyan_dubois',
		// },
		'Anaglyph Green Magenta': {
			viewCount: 2,
			mergeShaderIndex: 5,
			mix: 'green_magenta',
		},
		'Stereo Side By Side': {
			viewCount: 2,
			mergeShaderIndex: 0,
			posHandler: function(e, pos){
				if (pos.x > target.width / 2) pos.x -= target.width / 2;
				pos.x *= 2;
			}
		},
		'Stereo Over Under': {
			viewCount: 2,
			mergeShaderIndex: 0,
			posHandler: function(e, pos){
				if (pos.y > target.height / 2) pos.y -= target.height / 2;
				pos.y *= 2;
			}
		},
		'Exceptional 9 View HD': {
			viewCount: 9,
			mergeShaderIndex: 4,
			interleaver: "Exceptional3d9x2K",
		},
		// 'Tiled 9 View': {
		// 	viewCount: 9,
		// 	mergeShaderIndex: 1,
		// },
		// 'Tiled 16 View': {
		// 	viewCount: 16,
		// 	mergeShaderIndex: 2,
		// 	disabled: true,
		// },
	};
	for(var k in outFormatReqs) this.outFormats.push(k);
	var scene = new THREE.Scene();
	var mesh = new THREE.Mesh( 
		new THREE.PlaneBufferGeometry( 2, 2 ), 
		new THREE.MeshBasicMaterial( { color: 0xffffff } )
	);
	scene.add(mesh);

	this.scene = scene;

	var ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);	

	// Left Half
	var _cameraL = new THREE.OrthographicCamera( -1, 0, 1, -1, 0, 1 );
	_cameraL.matrixAutoUpdate = false;

	// Right Half
	var _cameraR = new THREE.OrthographicCamera( 0, 1, 1, -1, 0, 1 );
	_cameraR.matrixAutoUpdate = false;

	var _camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	_camera.matrixAutoUpdate = false;

	var width = renderer.domElement.width ? renderer.domElement.width : 512;
	var height = renderer.domElement.height ? renderer.domElement.height : 512;
	
	var interleaverTex = null;

	var anaglyph = {
		red_cyan: {
			name: 	'Red Cyan',
			red: 	[  0.299,  0.587,  0.114,  0.000,  0.000,  0.000 ],
			green: 	[ -0.262, -0.062, -0.024,  0.377,  0.761,  0.009 ],
			blue: 	[ -0.048, -0.050, -0.017, -0.026, -0.093,  1.234 ],
		},
		red_cyan_dubois: {
			name: 	'Red Cyan Dubois',
			red: 	[  0.456,  0.500,  0.176, -0.043, -0.088, -0.002 ],
			green: 	[ -0.040, -0.038, -0.016,  0.378,  0.734, -0.018 ],
			blue: 	[ -0.015, -0.021, -0.005, -0.072, -0.113,  1.226 ],
		},
		green_magenta: {
			name: 	'Green Magenta',
			red: 	[ -0.062, -0.158, -0.039,  0.529,  0.705,  0.024 ],
			green: 	[  0.284,  0.668,  0.143, -0.016, -0.015, -0.065 ],
			blue: 	[ -0.015, -0.027,  0.021,  0.009,  0.075,  0.937 ],
		},
	}
	this.anaglyph = anaglyph;
	
	// rendertargets
	var renderTargetHeader = null;
	var renderTargetRGBA = null;
	var renderTargetDepth = null;
	var renderTargetBlend = null;
	var renderTargetShift = null;
	var renderTargerViews = [];
	var viewCount = 0;
	
	// shaders
	var shaderHeaderExtract = new THREE.ShaderMaterial( THREE.DepthHeaderExtractShader, { depthWrite: false, depthTest: false } );
	var shaderShift = new THREE.ShaderMaterial( THREE.ShaderLoader.buildShader(THREE.DepthShiftShader, { 'LOOPCNT': '26' }), { depthWrite: false, depthTest: false } );
	var shaderFill = new THREE.ShaderMaterial( THREE.ShaderLoader.buildShader(THREE.DepthFillShader, { 'LOOPCNT': '26' }), { depthWrite: false, depthTest: false } );
	var shaderBlend = new THREE.ShaderMaterial( THREE.DepthBlendShader );
	var shadersMerge = [
		new THREE.ShaderMaterial( THREE.DepthMergeShader, { depthWrite: false, depthTest: false } ),
		new THREE.ShaderMaterial( THREE.DepthMerge9ViewsShader, { depthWrite: false, depthTest: false } ),
		new THREE.ShaderMaterial( THREE.DepthMerge16ViewsShader, { depthWrite: false, depthTest: false } ),
		new THREE.ShaderMaterial( THREE.DepthMerge2DZShader, { depthWrite: false, depthTest: false } ),
		new THREE.ShaderMaterial( THREE.DepthMergeInterleaver, { depthWrite: false, depthTest: false } ),
		new THREE.ShaderMaterial( THREE.DepthMergeAnaglyphShader, { depthWrite: false, depthTest: false } ),
	];

	var _params = { 
		// minFilter: THREE.LinearFilter, 
		// magFilter: THREE.LinearFilter, 
		minFilter: THREE.NearestFilter, 
		magFilter: THREE.NearestFilter, 
		format: THREE.RGBAFormat,
		stencilBuffer: false,
		depthBuffer: false,
		transparent: true,
		opacity: 0.5,
	};

	//
	var sep_max = 0.05;
	var spaceX = 1 / width;
	var max_loop = sep_max / spaceX;

	//
	renderer.autoClear = false;

	var getHeaderPixels = function(){
		var buffer = new Uint8Array( 4 * 512 ); 
		renderer.readRenderTargetPixels(renderTargetHeader, 0, 0, 512, 1, buffer);
		return buffer;
	};
	this.getHeaderPixels = getHeaderPixels;

	var getHeaderSettingByte = function(i){
		var buffer = new Uint8Array( 4 );
		i = i * 2 + 1;
		renderer.readRenderTargetPixels(renderTargetHeader, i, 0, 1, 1, buffer);
		return buffer[1];
	};
	this.getHeaderSettingByte = getHeaderSettingByte;

	this.formatNext = function(){
		var fi = oThis.outFormat;
		fi++;
		if (fi >= oThis.outFormats.length) fi = 0;
		oThis.outFormat = fi;
	};
	this.formatPrev = function(){
		var fi = oThis.outFormat;
		fi--;
		if (fi < 0) fi = oThis.outFormats.length - 1;
		oThis.outFormat = fi;
	};

	function pow2floor(v){
		v++;
		var p = 1;
		while (v >>= 1) {p <<= 1;}
		return p;
	}
	function pow2ceil(v){
		v--;
		var p = 2;
		while (v >>= 1) {p <<= 1;}
		return p;
	}

	//var current_interleaver = "Exceptional3d9x2K";
	var _current_interleaver = '';
	var interleaver = null;

	function initInterleaver(_outFormatReq){
		if (typeof _outFormatReq.interleaver === 'undefined') return;
		var current_interleaver = _outFormatReq.interleaver;
		if (_current_interleaver === current_interleaver && interleaverTex !== null) return;
		if (typeof Interleaver.interleavers[current_interleaver] === 'undefined') return;
		_current_interleaver = current_interleaver;
		interleaver = Interleaver.interleavers[current_interleaver];
		createPixelMapTexture(); // interleaver
		var shader = shadersMerge[_outFormatReq.mergeShaderIndex];
		shader.uniforms[ "interleaverTex" ].value = interleaverTex;
		shader.uniforms[ "interleaverTex_size" ].value = new THREE.Vector2( interleaverTex.image.width, interleaverTex.image.height );
		shader.uniforms[ "pattern_size" ].value = new THREE.Vector2( interleaver.cols / 3, interleaver.rows );
	}

	function createPixelMapTexture(){
		if (interleaverTex) interleaverTex.dispose();
		interleaverTex = null;
		if (!interleaver) return false;
		var width = interleaver.cols / 3;
		var height = interleaver.rows;
		var mat = interleaver.mat;
		var rows = interleaver.rows;
		var cols = interleaver.cols;
		width = pow2ceil(width);
		height = pow2ceil(height);
		var data = new Uint8Array(width * height * 3);
		for(var y = 0; y < rows; y ++){
			for(var x = 0; x < cols; x ++){
				var i = y * width * 3 + x;
				var c = mat[y * cols + x];
				data[i] = c;
				i++;
			}
		}
		interleaverTex = new THREE.DataTexture( data, width, height, THREE.RGBFormat );
		interleaverTex.needsUpdate = true;
	}

	this.getHeaderBytes = function(){
		// returns a Uint8Array with the first 4 bytes of the rebuilt header. 
		// NOTE: the first byte (index 0) is normally 241 to signify the header start. the HeaderExtractor checks for that and covnerts it to 1.0 (255) for quicker check in shaders. We change it back here to match original
		// 0 - 255 if valid header. 0 if not
		// 1 - content type
		// 2 - factor
		// 3 - offset
		var buffer = new Uint8Array( 4 *  8);
		renderer.readRenderTargetPixels(renderTargetHeader, 0, 0, 8, 1, buffer);
		var ret = new Uint8Array( 4 );
		for(var i = 0; i < 4; i++){
			ret[i] = buffer[(i * 8) + 5]
		}
		ret[0] = ret[0] == 255 ? 241 : 0;
		return ret;
	};
	$(target.target_el).on('rendusa_ui_pos_pre', function(e, pos){
		// if active we adjsut the click position here before the ui uses it
		// if 2D+Z mode (side by side) or stereo side by side x * 2
		// if stereo over under y * 2
		// only if fullscreen. this is because the ui thinks it is taking up the entire rendering area but it is not
		if (oThis.active) {
			var outFormatReq = outFormatReqs[oThis.outFormatName];
			if (typeof outFormatReq.posHandler === 'function'){
				outFormatReq.posHandler(e, pos);
			}
		}
	});
	var _active = false;
	var _ready = false;
	this.perspectiveX = 0.0;
	var _outFormat = _rendusa._load_setting('Renderer2DZ.outFormat', 0);
	var _level3D = 1.0; //_rendusa._load_setting('Renderer2DZ.level3D', 1.0);
	Object.defineProperties(this, {
		"level3D": {
			get: function(){
				return _level3D;
			},
			set: function(value){
				if (value < 0) value = 0;
				if (value > 4) value = 4;
				_level3D = value;
				//_rendusa._save_setting('Renderer2DZ.level3D', value);
				//console.log('Renderer2DZ.level3D', value);
			}
		},
		"outFormat": {
			get: function(){
				return _outFormat;
			},
			set: function(value){
				value = parseInt(value);
				if (isNaN(value) || value < 0 || value >= oThis.outFormats.length || _outFormat == value) return;
				if (typeof outFormatReqs[oThis.outFormats[value]] === 'undefined' || !outFormatReqs[oThis.outFormats[value]] || outFormatReqs[oThis.outFormats[value]].disabled) return;
				// out format changed. if active fire event on rendusa target_el
				_outFormat = value;
				_rendusa._save_setting('Renderer2DZ.outFormat', value);
				$(target.target_el).trigger('rendusa_format_3d_changed', [ oThis ]);
			}
		},
		"outFormatName": {
			get: function(){
				return oThis.outFormats[_outFormat];
			},
		},
		"ready": {
			get: function(){
				return _ready;
			}
		},
		"active": {
			get: function(){
				return _active;
			},
			set: function(value){
				if (_active == value) return;
				_active = value;
				
			}
		},
	});

	var rgbWidth = 2;
	var rgbHeight = 2;

	var checkSize = function () {
		var width = source.width;
		var height = source.height;
		// check if the source is side by side full or not
		if (width / 2 > height) width *= 0.5;
		if (width <= 0 || height <= 0){
			if (rgbWidth > 2 && rgbHeight > 2) {
				// just keep last source resolution to avoid uneeded resolution changes
				return false;
			} else if (target.width > 0 && target.height > 0) {
				width = target.width;
				height = target.height;
			} else {
				// default to
				width = 960;
				height = 540;
			}
		}
		// if same, nothing to do
		if (rgbWidth == width && rgbHeight == height) return false;
		oThis.dispose();
		console.log('2DZ source resized', width, height);
		rgbWidth = width;
		rgbHeight = height;

		spaceX = 1 / width;
		max_loop = sep_max / spaceX;

		renderTargetHeader = new THREE.WebGLRenderTarget( 512, 1, { 
			minFilter: THREE.NearestFilter, 
			magFilter: THREE.NearestFilter, 
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			depthBuffer: false,
			transparent: false,
			//opacity: 0.5,
		} );

		renderTargetRGBA = new THREE.WebGLRenderTarget( width, height, _params );
		renderTargetDepth = new THREE.WebGLRenderTarget( width, height, _params );	
		renderTargetShift = new THREE.WebGLRenderTarget( width, height, _params );
		renderTargetBlend = new THREE.WebGLRenderTarget( width, height, _params );

		shaderShift.uniforms[ "mapLeft" ].value = renderTargetRGBA.texture;
		shaderShift.uniforms[ "mapRight" ].value = renderTargetDepth.texture;	
		shaderShift.uniforms[ "mapHeader" ].value = renderTargetHeader.texture;
		shaderShift.uniforms[ "sepMax" ].value = 0;	
		shaderShift.uniforms[ "spaceX" ].value = spaceX;
		shaderShift.uniforms[ "spaceXHalf" ].value = spaceX * 0.5;

		shaderFill.uniforms[ "mapIn" ].value = renderTargetBlend.texture;	
		shaderFill.uniforms[ "mapHeader" ].value = renderTargetHeader.texture;	
		shaderFill.uniforms[ "spaceX" ].value = spaceX;
		shaderFill.uniforms[ "sepMax" ].value = 0;	

		_camera.aspect = width / height;
		_camera.updateProjectionMatrix();	
		_cameraR.aspect = _cameraL.aspect = width / (height * 2);
		_cameraL.updateProjectionMatrix();	
		_cameraR.updateProjectionMatrix();

		return true;
	};
	this.checkImageHeader = function(image)
    {
		return this.checkVideoHeader(image);
	};
	this.checkVideoHeader = function(video)
    {
		var ret = false;
		var canvas = document.createElement('canvas');
		canvas.width = video.videoWidth ? video.videoWidth : video.width;
		canvas.height = video.videoHeight ? video.videoHeight : video.height;
        var g = canvas.getContext('2d');
		g.drawImage(video, 0, 0, canvas.width, canvas.height);
		ret = this.checkCanvasContextHeader(g);
		g = null;
		canvas = null;
        return ret;
	};
	this.checkCanvasHeader = function(canvas)
    {
		// checks the first 10 byte (6 bytes data and 4 byte crc) header for validity
        var ret = false;
        var g = canvas.getContext('2d');
		ret = this.checkCanvasContextHeader(g);
		g = null;
        return ret;
    }
	this.checkCanvasContextHeader = function(g)
    {
		// checks the first 10 byte (6 bytes data and 4 byte crc) header for validity
		// returns the 6 byte data array from header if header is valid
		// else false
        var ret = false;
		var header_1 = [0, 0, 0, 0, 0, 0];
        var header_1_crc = [0, 0, 0, 0];
        if (!g) return ret;
		var imgd = g.getImageData(0, 0, 160, 1);
		var pix = imgd.data;
        var bit = 7;
        var ih = 0;
        for (var i = 2; i < pix.length; i += 8)
        {
            if (pix[i] >= 128)
            {
                if (ih < 6)
                {
                    // header part 1
                    header_1[ih] += (1 << bit);
                }
                else
                {
                    // header part 1 crc
                    header_1_crc[3 - (ih - 6)] += (1 << bit);
                }
            }
            bit--;
            if (bit == -1)
            {
                if (ih == 0 && header_1[0] != 241) return ret;    // first byte should have been 241
                bit = 7;
                ih++;
            }
        }
        // check crc
        var calc_crc = calcCRC32(header_1);
        var header_crc = toUInt32(header_1_crc, 0);
        ret = header_crc == calc_crc ? header_1 : false;
        return ret;
    }
	var toUInt32 = function(byte_array, start_pos){
		start_pos = !start_pos ? 0 : start_pos;
		var ret = (byte_array[start_pos + 3] << 24) + (byte_array[start_pos + 2] << 16) + (byte_array[start_pos + 1] << 8) + (byte_array[start_pos + 0] << 0);
		if (ret < 0) {ret += 4294967296;}
		return ret;
	};

	var calcCRC32 = function(data) {
	    var table = [0x00000000, 0x04C11DB7, 0x09823B6E, 0x0D4326D9, 0x130476DC, 0x17C56B6B, 0x1A864DB2, 0x1E475005, 0x2608EDB8, 0x22C9F00F, 0x2F8AD6D6, 0x2B4BCB61, 0x350C9B64, 0x31CD86D3, 0x3C8EA00A, 0x384FBDBD, 0x4C11DB70, 0x48D0C6C7, 0x4593E01E, 0x4152FDA9, 0x5F15ADAC, 0x5BD4B01B, 0x569796C2, 0x52568B75, 0x6A1936C8, 0x6ED82B7F, 0x639B0DA6, 0x675A1011, 0x791D4014, 0x7DDC5DA3, 0x709F7B7A, 0x745E66CD, 0x9823B6E0, 0x9CE2AB57, 0x91A18D8E, 0x95609039, 0x8B27C03C, 0x8FE6DD8B, 0x82A5FB52, 0x8664E6E5, 0xBE2B5B58, 0xBAEA46EF, 0xB7A96036, 0xB3687D81, 0xAD2F2D84, 0xA9EE3033, 0xA4AD16EA, 0xA06C0B5D, 0xD4326D90, 0xD0F37027, 0xDDB056FE, 0xD9714B49, 0xC7361B4C, 0xC3F706FB, 0xCEB42022, 0xCA753D95, 0xF23A8028, 0xF6FB9D9F, 0xFBB8BB46, 0xFF79A6F1, 0xE13EF6F4, 0xE5FFEB43, 0xE8BCCD9A, 0xEC7DD02D, 0x34867077, 0x30476DC0, 0x3D044B19, 0x39C556AE, 0x278206AB, 0x23431B1C, 0x2E003DC5, 0x2AC12072, 0x128E9DCF, 0x164F8078, 0x1B0CA6A1, 0x1FCDBB16, 0x018AEB13, 0x054BF6A4, 0x0808D07D, 0x0CC9CDCA, 0x7897AB07, 0x7C56B6B0, 0x71159069, 0x75D48DDE, 0x6B93DDDB, 0x6F52C06C, 0x6211E6B5, 0x66D0FB02, 0x5E9F46BF, 0x5A5E5B08, 0x571D7DD1, 0x53DC6066, 0x4D9B3063, 0x495A2DD4, 0x44190B0D, 0x40D816BA, 0xACA5C697, 0xA864DB20, 0xA527FDF9, 0xA1E6E04E, 0xBFA1B04B, 0xBB60ADFC, 0xB6238B25, 0xB2E29692, 0x8AAD2B2F, 0x8E6C3698, 0x832F1041, 0x87EE0DF6, 0x99A95DF3, 0x9D684044, 0x902B669D, 0x94EA7B2A, 0xE0B41DE7, 0xE4750050, 0xE9362689, 0xEDF73B3E, 0xF3B06B3B, 0xF771768C, 0xFA325055, 0xFEF34DE2, 0xC6BCF05F, 0xC27DEDE8, 0xCF3ECB31, 0xCBFFD686, 0xD5B88683, 0xD1799B34, 0xDC3ABDED, 0xD8FBA05A, 0x690CE0EE, 0x6DCDFD59, 0x608EDB80, 0x644FC637, 0x7A089632, 0x7EC98B85, 0x738AAD5C, 0x774BB0EB, 0x4F040D56, 0x4BC510E1, 0x46863638, 0x42472B8F, 0x5C007B8A, 0x58C1663D, 0x558240E4, 0x51435D53, 0x251D3B9E, 0x21DC2629, 0x2C9F00F0, 0x285E1D47, 0x36194D42, 0x32D850F5, 0x3F9B762C, 0x3B5A6B9B, 0x0315D626, 0x07D4CB91, 0x0A97ED48, 0x0E56F0FF, 0x1011A0FA, 0x14D0BD4D, 0x19939B94, 0x1D528623, 0xF12F560E, 0xF5EE4BB9, 0xF8AD6D60, 0xFC6C70D7, 0xE22B20D2, 0xE6EA3D65, 0xEBA91BBC, 0xEF68060B, 0xD727BBB6, 0xD3E6A601, 0xDEA580D8, 0xDA649D6F, 0xC423CD6A, 0xC0E2D0DD, 0xCDA1F604, 0xC960EBB3, 0xBD3E8D7E, 0xB9FF90C9, 0xB4BCB610, 0xB07DABA7, 0xAE3AFBA2, 0xAAFBE615, 0xA7B8C0CC, 0xA379DD7B, 0x9B3660C6, 0x9FF77D71, 0x92B45BA8, 0x9675461F, 0x8832161A, 0x8CF30BAD, 0x81B02D74, 0x857130C3, 0x5D8A9099, 0x594B8D2E, 0x5408ABF7, 0x50C9B640, 0x4E8EE645, 0x4A4FFBF2, 0x470CDD2B, 0x43CDC09C, 0x7B827D21, 0x7F436096, 0x7200464F, 0x76C15BF8, 0x68860BFD, 0x6C47164A, 0x61043093, 0x65C52D24, 0x119B4BE9, 0x155A565E, 0x18197087, 0x1CD86D30, 0x029F3D35, 0x065E2082, 0x0B1D065B, 0x0FDC1BEC, 0x3793A651, 0x3352BBE6, 0x3E119D3F, 0x3AD08088, 0x2497D08D, 0x2056CD3A, 0x2D15EBE3, 0x29D4F654, 0xC5A92679, 0xC1683BCE, 0xCC2B1D17, 0xC8EA00A0, 0xD6AD50A5, 0xD26C4D12, 0xDF2F6BCB, 0xDBEE767C, 0xE3A1CBC1, 0xE760D676, 0xEA23F0AF, 0xEEE2ED18, 0xF0A5BD1D, 0xF464A0AA, 0xF9278673, 0xFDE69BC4, 0x89B8FD09, 0x8D79E0BE, 0x803AC667, 0x84FBDBD0, 0x9ABC8BD5, 0x9E7D9662, 0x933EB0BB, 0x97FFAD0C, 0xAFB010B1, 0xAB710D06, 0xA6322BDF, 0xA2F33668, 0xBCB4666D, 0xB8757BDA, 0xB5365D03, 0xB1F740B4];
	    var crc = 0;
	    for (var i=0;i<data.length;i++) {
	        crc = table[(crc >>> 24) ^ data[i]] ^ (crc << 8);
	    }
	    if (crc < 0) {crc += 4294967296;}
	    return crc;
	};
	var initRenderTargetViews = function(_outFormatReq){
		disposeRenderTargetViews();
		viewCount = _outFormatReq.viewCount;
		if (viewCount < 1) viewCount = 1;
		var angleSize = 0;
		var angle = 0;
		if (viewCount > 1){
			angleSize = 2 / (viewCount - 1);
			angle = -1;
		}
		for(var i = 0; i < viewCount; i++){
			var rtView = {
				renderTarget: new THREE.WebGLRenderTarget( rgbWidth, rgbHeight, _params ),
				i: i,
				angle: angle
			};
			angle += angleSize;
			renderTargerViews.push(rtView);
		}	
		//console.log(renderTargerViews.length);
	}

	var srcIDChanged = function(){
		_srcID = source.srcID;
		
		//console.log('srcIDChanged', _srcID);
	};

	

	var _srcID = -1;
	this.render = function ( ) {
		var _outFormatName = oThis.outFormatName;
		var _outFormatReq = outFormatReqs[_outFormatName];
		//renderer.clear();
		scene.updateMatrixWorld();
		if ( _camera.parent === undefined ) _camera.updateMatrixWorld();
		if (true || source.ready){
			// below line may cause dispose to be called
			if (_srcID != source.srcID) srcIDChanged();
			checkSize();
			// draw rgb to left _camera > renderTargetRGBA
			if (source.ready){
				shaderBlend.uniforms[ "mapIn" ].value = source.texture;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _cameraL, renderTargetRGBA, true );
				// draw depth to right _camera > renderTargetDepth
				renderer.render( scene, _cameraR, renderTargetDepth, true );
				shaderBlend.uniforms[ "mapIn" ].value = null;					// release source.texture
			} else {
				// cover image?
				renderer.setRenderTarget(renderTargetRGBA);
				renderer.setClearColor( 0xeeeeee, 1);
				renderer.clear();
				renderer.setRenderTarget(renderTargetDepth);
				renderer.setClearColor( 0x000000, 1);
				renderer.clear();
			}

			// renderTargetRGBA is ready
			// renderTargetDepth is ready

			if (target.overlayRenderTargetReady){
				// draw overlay onto RGBA image
				// issue here: differing sizes between overlay and rgba texture
				// - could crop. current method stretches overlay to fit rgba, but later rgba is stretched to fit the final output which is the size of the overlay
				shaderBlend.uniforms[ "mapIn" ].value = renderTargetRGBA.texture;
				shaderBlend.uniforms[ "mapOverlay" ].value = target.overlayRenderTarget.texture;
				shaderBlend.uniforms[ "blend" ].value = 1;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, renderTargetBlend, true );
				// copy back
				shaderBlend.uniforms[ "mapIn" ].value = renderTargetBlend.texture;
				shaderBlend.uniforms[ "mapOverlay" ].value = null;
				shaderBlend.uniforms[ "blend" ].value = 0;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, renderTargetRGBA, true );

				// draw overlay onto Depth image (at focus)
				// TODO map header and use offset in that instead of maskColor
				shaderBlend.uniforms[ "mapIn" ].value = renderTargetDepth.texture;
				shaderBlend.uniforms[ "mapOverlay" ].value = target.overlayRenderTarget.texture;
				shaderBlend.uniforms[ "mapHeader" ].value = renderTargetHeader.texture;
				shaderBlend.uniforms[ "blend" ].value = 2;
				shaderBlend.uniforms[ "maskColor" ].value = 1.0;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, renderTargetBlend, true );
				// copy back
				shaderBlend.uniforms[ "mapIn" ].value = renderTargetBlend.texture;
				shaderBlend.uniforms[ "mapOverlay" ].value = null;
				
				shaderBlend.uniforms[ "mapHeader" ].value = null;
				shaderBlend.uniforms[ "blend" ].value = 0;
				scene.overrideMaterial = shaderBlend;
				renderer.render( scene, _camera, renderTargetDepth, true );
			}

			// extract header (if using auto header detect and header tested positive)
			shaderHeaderExtract.uniforms[ "width" ].value = source.width;
			shaderHeaderExtract.uniforms[ "height" ].value = source.height;
			shaderHeaderExtract.uniforms[ "tDiffuse" ].value = source.texture;
			scene.overrideMaterial = shaderHeaderExtract;
			renderer.render( scene, _camera, renderTargetHeader, true );
			shaderHeaderExtract.uniforms[ "tDiffuse" ].value = null;		// release source.texture

			// if not using auto header create header here

			// TODO if source is not ready create/use default header

			// renderTargetHeader is ready

			// create all views
			var doFill = true;
			if (renderTargerViews.length != _outFormatReq.viewCount) initRenderTargetViews(_outFormatReq);
			var perspX = target.perspectiveX;
			for(var i = 0; i < renderTargerViews.length; i++){
				var rtView = renderTargerViews[i];
				var sm = sep_max * oThis.level3D * (rtView.angle + perspX);
				shaderShift.uniforms[ "sepMax" ].value = sm;
				scene.overrideMaterial = shaderShift;
				if (doFill){
					renderer.render( scene, _camera, renderTargetShift, true );
					shaderBlend.uniforms[ "mapIn" ].value = renderTargetShift.texture;
					scene.overrideMaterial = shaderBlend;
					renderer.render( scene, _camera, renderTargetBlend, true );	
					shaderFill.uniforms[ "sepMax" ].value = Math.abs(sm);
					scene.overrideMaterial = shaderFill;
				}
				renderer.render( scene, _camera, rtView.renderTarget, true );
			}
			renderer.setRenderTarget(null);
			// all renderTargerViews are ready
		} else {
			// clear all renderTargerViews. prevents frame bleed when switching sources
			for(var i = 0; i < renderTargerViews.length; i++){
				renderer.setRenderTarget(renderTargerViews[i].renderTarget);
				renderer.clear();
			}
		}
		//
		if (typeof _outFormatReq.interleaver !== 'undefined') initInterleaver(_outFormatReq);
		// use merge shader to combine views into final out
		var merge = shadersMerge[_outFormatReq.mergeShaderIndex];
		if (_outFormatName == '2D')
		{
			merge.uniforms[ "outFormat" ].value = 0;
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		}
		else if (_outFormatName == 'Stereo Side By Side')
		{
			merge.uniforms[ "outFormat" ].value = 1;
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		}
		else if (_outFormatName == 'Stereo Over Under')
		{
			merge.uniforms[ "outFormat" ].value = 2;
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		}
		else if (_outFormatName == '2D+Z')
		{
			merge.uniforms[ "width" ].value = target.width;
			merge.uniforms[ "height" ].value = target.height;
			merge.uniforms[ "viewTexArray" ].value = [ renderTargetRGBA.texture, renderTargetDepth.texture, renderTargetHeader.texture ];
		}
		else if (_outFormatName.indexOf('Anaglyph') === 0)
		{
			var mixer = anaglyph[_outFormatReq.mix];
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
			merge.uniforms[ "redMixer" ].value = mixer.red;
			merge.uniforms[ "greenMixer" ].value = mixer.green;
			merge.uniforms[ "blueMixer" ].value = mixer.blue;
		}
		// else if (_outFormatName.indexOf('Anaglyph Green Magenta') === 0)
		// {
		// 	merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		// 	merge.uniforms[ "redMixer" ].value = anaglyph.green_magenta.red;
		// 	merge.uniforms[ "greenMixer" ].value = anaglyph.green_magenta.green;
		// 	merge.uniforms[ "blueMixer" ].value = anaglyph.green_magenta.blue;
		// }
		else if (_outFormatName == 'Exceptional 9 View HD')
		{
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		} 
		else 
		{
			console.log(_outFormatName);
			merge.uniforms[ "outFormat" ].value = oThis.outFormat;
			merge.uniforms[ "viewTexArray" ].value = renderTargetViewsTextures();
		}
		scene.overrideMaterial = merge;
		renderer.render( scene, _camera );	
		merge.uniforms[ "viewTexArray" ].value = [];
		scene.overrideMaterial = null;	
	};
	

	var renderTargetViewsTextures = function(appendTextures){
		var ret = [];
		for(var i = 0; i < renderTargerViews.length; i++){
			ret.push(renderTargerViews[i].renderTarget.texture);
		}
		if (appendTextures) ret = ret.concat(appendTextures);
		return ret;
	};
	
	var disposeRenderTargetViews = function(){
		//console.log('disposeRenderTargetViews');
		for(var i = 0; i < renderTargerViews.length; i++){
			if ( renderTargerViews[i].renderTarget ) renderTargerViews[i].renderTarget.dispose();
		}			
		renderTargerViews = [];
	};
	this.dispose = function() {
		//console.log('dispose');
		if ( renderTargetHeader ) renderTargetHeader.dispose();
		if ( renderTargetRGBA ) renderTargetRGBA.dispose();
		if ( renderTargetDepth ) renderTargetDepth.dispose();	
		if ( renderTargetShift ) renderTargetShift.dispose();
		if ( renderTargetBlend ) renderTargetBlend.dispose();	
		if ( interleaverTex ) interleaverTex.dispose();
		disposeRenderTargetViews();
	}
	checkSize();

};


})(jQuery);