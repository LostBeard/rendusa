// Rendusa
// created by 
// Todd Tanner
// lostit1278 at gmail.com
// 
// Open source 3D/2D video and image renderer and on the fly converter with playlists
// uses WebGL for on the fly converting
// libraries used
// three.js
// jQuery
// spark-md5.js
// ffmpeg (server side as part of Drupal module)

"use strict";

(function($){

THREE.RendusaRenderers = THREE.RendusaRenderers ? THREE.RendusaRenderers : {};

CanvasRenderingContext2D.prototype.clearIt = 
  CanvasRenderingContext2D.prototype.clearIt || function (preserveTransform) {
    if (preserveTransform !== false) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (preserveTransform) {
      this.restore();
    }           
};
CanvasRenderingContext2D.prototype.clearColor = 
	CanvasRenderingContext2D.prototype.clearColor || function (color) {
	var tmp = this.fillStyle;
	this.fillStyle = color;
	this.fillRect(0, 0, this.canvas.width, this.canvas.height);    
	this.fillStyle = tmp;  
};

THREE.Rendusa = function(options){
	var oThis = this;
	if (!options || !$(options.target).length){
		console.error('Rendusa - Invalid target');
		return;
	}
	this.rendusa_id = new Date().getTime();
	$(options.target).addClass('rendusa_target').addClass('rendusa_paused');//.attr('rendusa_id', this.rendusa_id);
	var rendusa_el = $('<div class="rendusa" tabindex="0" style="position: relative; margin: 0 !important; border: 0 !important; padding:0 !important; height: 100% !important; width: 100% !important;">').attr('rendusa_id', this.rendusa_id).appendTo(options.target).get(0);
	var canvas_out = jQuery('<canvas style="margin: 0 !important; border: 0 !important; padding:0 !important; height: 100% !important; width: 100% !important;" class="rendusa_canvas_out">').appendTo(rendusa_el).get(0);
	var video_in = jQuery('<video style="display: none;" class="rendusa_video_in">').appendTo(rendusa_el).get(0);
	this.options = options;
	this.renderers = {};
	this.loaded = false;
	this._renderer = null;
	this.htracker = null;
	this.sources = [];
	this.source_index = 0;
	this._waiting = 0;
	this.activeRenderer = null;
	this.skipUnsupported = true;
	this.imageDuration = 10;	// how long to show each image in seconds
	this._lastRenderTick = new Date().getTime();
	this._stats = false;
	this._textureLoader = new THREE.TextureLoader();
	this.version = '0.9';
	var _currentTime = 0;
	var _paused = true;
	this.source = {
		canPlay: false,
		width: 0,
		height: 0,
		texture: null,
		inType: '',
		ready: false,
		info: null,
		index: -1,
		srcID: 0,
		video_in: video_in,
		durationDownloaded: 0,
		duration: 0,
		//paused: true,
		ended: false,
		playbackRate: 1,
		autoplay: options.autoplay ? true : false,
		loop: 1,	// 0 none, 1 all, 2 single
		play: function(){
			oThis.source.paused = false;
			oThis.source.autoplay = true;
			if (oThis.source.ended){
				oThis.sourceSelect();
			} else if (oThis.source.inType == 'video') {
				oThis.source.video_in.play();
			} else if (oThis.source.inType == 'image') {
				
			}
		},
		pause: function(){
			if (oThis.source.inType == 'video') {
				oThis.source.video_in.pause();
			} else if (oThis.source.inType == 'image') {
				
			}
			oThis.source.paused = true;
		},
		stopIt: function(){
			oThis.source.pause();
			oThis.source.currentTime = 0;
			//oThis._renderer.clear();
		},
		next: function(){
			oThis.sourceNext();
		},
		prev: function(){
			oThis.sourcePrev();
		},
		canPlayType: function(mtype){
			var ret = '';
			if (mtype.indexOf(mtype, 'video/') === 0){
				ret = oThis.source.video_in.canPlayType(mtype);
			} else if (mtype.indexOf(mtype, 'video/') === 0){
				ret = [
					'image/png',
					'image/bmp',
					'image/jpeg',
				].indexOf(mtype) > -1 ? 'probably' : '';
			}
			return ret;
		},
	};
	this.target = {
		width: 0,
		height: 0,
		overlayRenderTargetReady: false,
		overlayRenderTarget: null,
		ready: false,
		canvas_out: canvas_out,
		target_el: $(options.target).get(0),
		rendusa_el: rendusa_el,
		isFullscreen: false,
		heightFullscreen: 0,
		widthFullscreen: 0,
		widthWindowed: 0,
		heightWindowed: 0,
	};
	var _targetPerspectiveXEnabled = false;
	var _targetPerspectiveX = 0;
	Object.defineProperties(this.target, {
		"perspectiveX": {
			get: function(){
				if (!_targetPerspectiveXEnabled) return 0;
				return _targetPerspectiveX;
			},
			set: function(value){
				value *= 1;
				if (value > 1) value = 1;
				if (value < -1) value = -1;
				if (_targetPerspectiveX == value) return;
				_targetPerspectiveX = value;
				$(oThis.target.target_el).trigger('rendusa_perspective_changed');
			}
		},
		"perspectiveXEnabled": {
			get: function(){
				return _targetPerspectiveXEnabled;
			},
			set: function(value){
				if (_targetPerspectiveX == value) return;
				_targetPerspectiveXEnabled = value;
				$(oThis.target.target_el).trigger('rendusa_perspective_changed');
			}
		},
	});
	//
	var source = this.source;
	Object.defineProperties(this.source, {
		"currentTime": {
			get: function(){
				if (oThis.source.inType == 'video') return source.video_in.currentTime;
				return _currentTime;
			},
			set: function(value){
				_currentTime = value;
				if (oThis.source.inType == 'video') source.video_in.currentTime = value;
			}
		},
		"paused": {
			get: function(){
				return _paused;
			},
			set: function(value){
				if (_paused == value) return;
				_paused = value;
				if (_paused){
					$(oThis.target.target_el).addClass('rendusa_paused');
				} else {
					$(oThis.target.target_el).removeClass('rendusa_paused');
				}
				$(oThis.target.target_el).trigger('rendusa_paused_changed');
			}
		},
		"muted": {
			get: function(){
				return source.video_in.muted;
			},
			set: function(value){
				source.video_in.muted = value;
			}
		},
		"volume": {
			get: function(){
				return source.video_in.volume;
			},
			set: function(value){
				source.video_in.volume = value;;
			}
		},
		"readyState": {
			get: function(){
				if (source.inType == 'video'){
					return source.ready ? source.video_in.readyState : 0;
				} else if (source.inType == 'image'){
					return source.ready ? 4 : 0;
				}
				return 0;
			},
			set: function(value){
				source.video_in.muted = value;;
			}
		},
	});
	var finish_load = function(){
		if (oThis.loaded) return;
		oThis.loaded = true;
		if (!THREE.ShaderLoader.loaded) return;
		oThis._init(options);
		if (options.onload) options.onload();
	}
	if (THREE.ShaderLoader.loaded){
		setTimeout(finish_load, 0);
	} else {
		// make sure all shaders are loaded before continuing
		$(document).on("ShaderLoaderComplete", function(){
			finish_load();
		});
	}
}

THREE.Rendusa.prototype = {
	_init: function(options){
		var oThis = this;
		if (!this.supported()){
			console.log('!! WebGL is not supported. WebGL is required by Rendusa for all video rendering. !!');
			return;
		}
		// create primary renderer
		var renderer = new THREE.WebGLRenderer({ canvas: this.target.canvas_out, antialias: true });
		this._renderer = renderer;
		// load any renderers that have made themselves available
		for(var rcname in THREE.RendusaRenderers){
			this.renderers[rcname] = new THREE.RendusaRenderers[rcname]( renderer, this.source, this.target, this );
			// make sure the renderer inFormat is set
			this.renderers[rcname].inFormat = rcname;
		}
		this.activeRenderer = this.renderers['2DZ'];
		if (typeof this.options._stats != 'undefined' && this.options._stats) this.showStats();
		// video_in events
		$(this.source.video_in).bind('loadedmetadata',function(e){
			// loaded
			if (oThis.source.inType != 'video') return;
			//console.log(e.type);
			oThis._init_text_tracks();
			if ($(this).attr('loadstate') != ''){
				$(this).attr('loadstate', 'loaded');
				oThis.loadstate = 'loaded';
				oThis._load_complete(true);
			}
		}).bind('error', function(e){
			if (oThis.source.inType != 'video') return;
			// error loading
			//console.log(e.type);
			if ($(this).attr('loadstate') != ''){
				$(this).attr('loadstate', 'error');
				oThis.loadstate = 'error';
				oThis._load_complete(false);
			}
		}).bind('play',function(e){
			// unpaused
			//console.log(e.type);
		}).bind('pause',function(e){
			//console.log(e.type);
		}).bind('playing',function(e){
			//console.log(e.type);
			if (oThis.source.inType == 'video') oThis._waiting = 0;
		}).bind('timeupdate',function(e){

		}).bind('ended',function(e){
			// nothing to do. checked in render function
			if (oThis.source.inType == 'video') oThis._waiting = 0;
		}).bind('loadstart', function(e){
			//console.log(e.type);
		}).bind('emptied', function(e){
			//console.log(e.type);
		}).bind('ratechange', function(e){
			//console.log(e.type);
		}).bind('stalled', function(e){
			//console.log(e.type);
		}).bind('durationchange', function(e){
			//console.log(e.type);
		}).bind('volumechange', function(e){
			//console.log(e.type);
		}).bind('waiting', function(e){
			//console.log(e.type);
			if (oThis.source.inType == 'video') {
				oThis._waiting = new Date().getTime();

			}
		}).bind('abort', function(e){
			//console.log(e.type);
		}).bind('seeking seeked', function(e){
			//console.log(e.type);
		}).bind('canplay', function(e){
			//console.log(e.type);
		}).bind('canplaythrough', function(e){
			//console.log(e.type, 0);
			if (oThis.source.inType == 'video' && !oThis.source.canPlay) {
				//console.log(e.type, 1);
				var interval_id = 0;
				var srcid = oThis.source.srcID;
				var unchanged_cnt = 0;
				var perc_last = 0;
				interval_id = setInterval(function(){
					if (interval_id == 0 || srcid != oThis.source.srcID){
						if (interval_id > 0) clearInterval(interval_id);
						return;
					}
					var perc = 1;
					perc = oThis.source.duration > 0 ? oThis.source.durationDownloaded / oThis.source.duration : perc;
					if (perc == perc_last) unchanged_cnt++;
					if (perc > 0.5 || unchanged_cnt >= 3 || oThis.source.durationDownloaded >= 30){
						oThis._canPlay();
						clearInterval(interval_id);
						interval_id = 0;
					}
					perc_last = perc;
				}, 1000);
			}
		}).bind('loadeddata', function(e){
			//console.log(e.type);
		}).bind('fullscreenchange', function(e){
			//console.log(e.type);
		}).bind('suspend', function(e){
			//console.log(e.type);
		}).bind('progress', function(e){
			if (oThis.source.inType == 'video') oThis.source.durationDownloaded = oThis._buffered_duration();
		});
		// doubleclick to toggle fullscreen events
		// $(this.target.canvas_out).on('dblclick', function(){
		// 	oThis.toggleFullscreen();
		// });
		// fullscreen events
		$(document).bind('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function(e){
			setTimeout(function(){ 
				oThis._fullscreenCheck(); 
			}, 500);
		});
		$(window).on('resize', function(){
			setTimeout(function(){ 
				oThis._fullscreenCheck(); 
			}, 500);
		});
		// keyboard events
		$(this.target.rendusa_el).keydown(function(e) {
			//console.log(e.which);
		    switch(e.which) {
		        case 37: // left
					oThis.sourcePrev();
		        break;
		        case 39: // right
		        	oThis.sourceNext();
		        break;
		        case 38: // up
		        	if (typeof oThis.activeRenderer.level3D != 'undefined') oThis.activeRenderer.level3D += 0.01;
		        break;
		        case 40: // down
		        	if (typeof oThis.activeRenderer.level3D != 'undefined') oThis.activeRenderer.level3D -= 0.01;
		        break;
		        case 219: // [ 
		        	oThis.formatPrev();
		        break;
		        case 221: // ]
		        	oThis.formatNext();
		        break;
		        case 70: // f fullscreen
		        	oThis.toggleFullscreen();
		        break;
		        case 83: // s stats
		        	oThis.toggleStats();
		        break;
		        case 84: // t
		        	oThis.initFaceTracking();
		        break;
		        case 77: // m
					oThis.source.muted = !oThis.source.muted;
		        break;
		        case 80: // p
					oThis.target.perspectiveXEnabled = !oThis.target.perspectiveXEnabled;
		        break;
		        case 32: // space pause
					{
						if (oThis.source.paused){
							oThis.source.play();
						} else {
							oThis.source.pause();
						}
					}
		        break;
		        default: return; // exit this handler for other keys
		    }
		    e.preventDefault(); // prevent the default action (scroll / move caret)
		});
		this._initCSS();
		this._load_settings();
		this._render();
		this.setSources(options.sources);
	},
	_fullscreenCheck: function(){
		var oThis = this;
		var isFS = this.fullScreenElement();
		if (isFS){
			if (this.isThisFullscreen()){
				if (!$(this.target.rendusa_el).hasClass('rendusa_fullscreen')){
					oThis._fsStateChanged(true) ;
				} else {
					
				}
			}
		} else {
			if ($(this.target.rendusa_el).hasClass('rendusa_fullscreen')){
				//setTimeout(function(){ 
					oThis._fsStateChanged(false) ;
				//}, 0);
			}
		}
		$(this.target.canvas_out).css({ width: '100%', height: '100%' });
	},
	initFaceTracking: function(){
		var oThis = this;
		this.head_x = 0;
		this.head_z = 0;
		this.face_x = 0;
		this.face_z = 0;
		if (!$('#facetrackr_canvas').length){
			var c_el = $('<canvas id="facetrackr_canvas" width="320" height="240" style="display:none">').appendTo('body').get(0);
			var v_el = $('<video id="facetrackr_video" style="display:none" autoplay loop>').appendTo('body').get(0);
			var htracker = new headtrackr.Tracker({ ui : false });
			htracker.init(v_el, c_el);
			window.rendusa_htracker = htracker;
			window.rendusa_htracker.start();
		}
		// document.addEventListener('facetrackingEvent', 
		// 	function (event) {
		// 		var canvas = document.getElementById('facetrackr_canvas');
		// 		var cw = canvas.width;
		// 		var ch = canvas.height;
		// 		var fx = event.x;
		// 		var fy = event.y;
		// 		var fz = event.z;
		// 		// var fx = event.x / cw;
		// 		// var fy = event.y / ch;
		// 		// fx = (fx - 0.25) * 2;// 0.5 * fx + 0.25; // normailize to range 0.25 - 0.75
		// 		// if (fx < 0) fx = 0;
		// 		// if (fx > 1) fx = 1;
		// 		oThis.face_x = fx;
		// 		oThis.face_z = fz;
		// 		console.log('fx', oThis.face_x, oThis.head_x, oThis.head_z, oThis.face_z);
		// 		//rendusa.renderers.Perspective.sepScale = -((8 * fx) - 4);
		// 		//rendusa.renderer.sepScale = -((8 * fx) - 4);
		// 		//headtrackr_fnd = true;
		// 	}
		// );
		document.addEventListener('headtrackingEvent', 
			function (event) {
				var canvas = document.getElementById('facetrackr_canvas');
				var cw = canvas.width;
				var ch = canvas.height;
				var fx = event.x;
				var fy = event.y;
				var fz = event.z;
				// var fx = event.x / cw;
				// var fy = event.y / ch;
				oThis.head_x = fx;
				oThis.face_z = fz;
				var px = fx / 4;
				oThis.target.perspectiveX = px;
				//console.log('px', oThis.target.perspectiveX);
				//renderers.Perspective.sepScale = -((8 * fx) - 4);
			}
		);	
		document.addEventListener('headtrackrStatus', 
			function (event) {
				//console.log('headtrackrStatus', event);
				if (event.status == "getUserMedia") {
					//console.log("getUserMedia is supported!");
				}
			}
		);
	},
	_fsStateChanged: function(isfs){
		if (isfs){
			//console.log('Rendusa entered fullscreen. '+ this.rendusa_id);
			$(this.target.rendusa_el).addClass('rendusa_fullscreen');

			this.target.isFullscreen = true;
			$(this.target.canvas_out).css({ width: '100%', height: '100%' });
		}
		else
		{
			//console.log('Rendusa exited fullscreen. '+ this.rendusa_id);
			$(this.target.rendusa_el).removeClass('rendusa_fullscreen');
			// this.target.widthWindowed = dw;
			// this.target.heightWindowed = dh;
			this.target.isFullscreen = false;
			$(this.target.canvas_out).css({ width: this.target.widthWindowed + 'px', height: this.target.heightWindowed + 'px' });
		}
	},
	_initCSS: function(){
		//this._css_set('#rendusa_fullscreen { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important;  }');
	},
	_css_set: function(css, id){
		var el = '';
		if (typeof id != 'undefined') {
			el = $('head #'+id);
		} else {
			if (typeof css == 'undefined') return false;
		}
		if (el.length == 0) {
			el = $('<style type="text/css" />').appendTo('head');
			if (typeof id != 'undefined') el.attr('id', id);
		}
		if (typeof css != 'undefined') el.html(css);
		return el;
	},
	_css_get: function(css, id){
		var el = $('head #'+id);
		if (el.length == 0) return false;
		return el.html();
	},
	_css_add: function(css, id){
		var el = $('head #'+id);
		if (el.length == 0) {
			return this.css_set(css, id);
		}
		if (typeof css != 'undefined') el.append(css);
		return el;
	},
	_css_del: function(id){
		var el = $('head #'+id);
		if (el.length == 0) return false;
		el.remove();
		return true;
	},
	_canPlay: function(){
		var oThis = this;
		if (this.source.canPlay) return;
		//console.log('Source can play');
		this.source.canPlay = true;
		this.source.video_in.currentTime = 0;
		//this.source.paused = !this.source.autoplay;
		if (this.source.autoplay){
			setTimeout(function(){

				oThis.source.play();
			}, 500);
		}
	},
	_load_complete: function(success, texture){
		//console.log('Source load_complete', success);
		if (success){
			this.source.info.isValid = 1;
			if (this.source.inType == 'video') {
				this.source.duration = this.source.video_in.duration;
				this.source.texture = new THREE.VideoTexture( this.source.video_in );
				this.source.width = this.source.video_in.videoWidth;
				this.source.height = this.source.video_in.videoHeight;
				this.source.currentSrc = this.source.video_in.currentSrc;
			} else if (this.source.inType == 'image') {
				if (texture){
					this.source.texture = texture; // set the material's map when when the texture is loaded
					this.source.width = this.source.texture.image.width;
					this.source.height = this.source.texture.image.height;
					var baseURI = texture.image.baseURI;
					var src = this.source.info.url;
					if (src.indexOf('://') == -1){
						src = baseURI + src;
					}
					this.source.currentSrc = src;
				}
			}
			if (this.source.texture){
				// calc useful metadata that may not be available from the source
				if (typeof this.source.info.aspectRatio === 'undefined'){
					var ratio = this.source.width / this.source.height;
					if (this.source.width > this.source.height * 2){
						// likely side by side full
						ratio = this.source.width / this.source.height / 2;
					} else if (this.source.width < this.source.height){
						// likely over under full
						ratio = this.source.width * 2 / this.source.height;
					} else {
						// probably at the correct aspect ratio
					}
					this.source.info.aspectRatio = ratio;
				}
				//
				this.source.durationDownloaded = this.source.duration;
				this.source.texture.minFilter = THREE.LinearFilter;
				this.source.texture.magFilter = THREE.LinearFilter;
				this.source.texture.format = THREE.RGBFormat;
				this.source.srcID = new Date().getTime();
				this.source.ready = true;
				//console.log('size ' + this.source.width + 'x' + this.source.height, this.source.currentSrc);
				if (this.source.inType == 'image') this._canPlay();
			}
			$(this.target.target_el).addClass('rendusa_source_loaded');
		} else {
			//console.log('Error loading source. skipping and going to next');
			this.source.info.isValid = 0;
			this.sourceNext();
		}
		$(this.target.target_el).trigger('rendusa_source_changed', [ { success: success } ]);
		if (this.source.inType == 'video') this._loadNextSrcImage();
	},
	_init_text_tracks: function(){
		//console.log('TODO - _init_text_tracks');
	},
	_buffered_duration: function(){
		// returns the total buffered duration of the video file
		var ret = 0;
		var timeRanges = this.source.video_in.buffered;
		if (typeof timeRanges != 'object' || typeof timeRanges['length'] == 'undefined') return ret;
		for(var i=0;i<timeRanges.length;i++){
			var sect = timeRanges.end(i) - timeRanges.start(i);
			ret += sect;
		}
		return ret;
	},
	_unloadSrc: function(){
		this.source.pause();
		this.source.ready = false;
		// clear sources
		$(this.source.video_in).empty();
		this.source.canPlay = false;
		this.source.width = 0;
		this.source.height = 0;
		this.source.index = -1;
		this.source.inType = '';
		this.source.duration = 0;
		this.source.currentTime = 0;
		this.source.currentSrc = '';
		this.source.ended = false;
		this.source.durationDownloaded = 0;
		this.source.srcID = 0;
		if (this.source.texture) this.source.texture.dispose();
		this.source.texture = null;
		this.source.info = null;
	},
	_setSrcVideo: function(srcInfo){
		var oThis = this;
		this._unloadSrc();
		this.source.srcID = new Date().getTime();
		this.source.index = this.source_index;
		this.source.inType = 'video';
		this.source.info = srcInfo;
		$(this.source.video_in).attr('loadstate', 'loading');
		$(this.source.video_in).attr('preload', 'auto');
		$('<source src="' + srcInfo.url + '" type="' + srcInfo.mime + '"></source> ').appendTo(this.source.video_in).bind('error.rendusa_load_Error_event', function(e){
			$(this).unbind('error.rendusa_load_Error_event');
			oThis._load_complete(false, null);
		});
		$(this.source.video_in).attr('preload', 'auto');
		$(this.target.target_el).trigger('rendusa_source_change_start');
		this.source.video_in.load();
	},
	_loadNextSrcImage: function(){
		var srcInfoLoading = false;
		var srcInfoNext = false;
		for(var i = 0; i < this.sources.length; i++){
			var srcInfo = this.sources[i];
			if (srcInfo.mime.indexOf('image/') !== 0) continue;
			if (typeof srcInfo.texture === 'undefined'){
				if (!srcInfoNext) srcInfoNext = srcInfo;
			} else if (srcInfo.texture === false){
				srcInfoLoading = srcInfo;
			}
			if (srcInfoLoading && srcInfoNext) break;
		}
		if (!srcInfoLoading){
			if (srcInfoNext){
				this._loadSrcImage(srcInfoNext);
			} else {
				console.log('All images loaded');
			}
		}
	},
	_loadSrcImage: function(srcInfo){
		var oThis = this;
		if (typeof srcInfo.texture != 'undefined'){
			if (srcInfo.texture === false) return;
			if (srcInfo.url == this.source.info.url) {
				this._load_complete(true, srcInfo.texture);
			}
			return;
		}
		console.log('Started loading', srcInfo.url);
		srcInfo.texture = false;
		this._textureLoader.load(
			srcInfo.url,
			function ( texture ) {
				// succcess
				srcInfo.texture = texture;
				if (srcInfo.url == oThis.source.info.url) oThis._load_complete(true, srcInfo.texture);
				console.log('Finished loading', srcInfo.url);
				oThis._loadNextSrcImage();
			},
			function ( xhr ) {
				// progress
				var b = parseInt(xhr.loaded);
				var bt = parseInt(xhr.total);
				if (isNaN(b)) b = 0;
				if (isNaN(bt)) bt = 0;
				var perc = bt > 0 && b > 0 ? b / bt : 0;
				//console.log( 0 + '% loaded', b, ' of ', bt, 'bytes' );
				if (srcInfo.url == oThis.source.info.url) oThis.source.durationDownloaded = oThis.source.duration * perc;
			},
			function ( xhr ) {
				// error
				srcInfo.texture = null;
				if (srcInfo.url == oThis.source.url) oThis._load_complete(false, null);
				oThis._loadNextSrcImage();
			}
		);
	},
	_setSrcImage: function(srcInfo){
		this._unloadSrc();
		this.source.srcID = new Date().getTime();
		this.source.index = this.source_index;
		this.source.inType = 'image';
		this.source.info = srcInfo;
		this.source.duration = this.imageDuration;
		$(this.target.target_el).trigger('rendusa_source_change_start');
		this._loadSrcImage(srcInfo);
	},
	_getMime: function(src){
		var ret = '';
		var ext = src.substr(src.lastIndexOf('.')).toLowerCase();
		if (ext == '.png'){
			ret = 'image/png';
		} else if (ext == '.bmp'){
			ret = 'image/bmp';
		} else if (ext == '.jpg' || ext == '.jpeg'){
			ret = 'image/jpeg';
		} else if (ext == '.mp4'){
			ret = 'video/mp4';
		} else if (ext == '.ogg'){
			ret = 'video/ogg';
		} else if (ext == '.webm'){
			ret = 'video/webm';
		}
		return ret;
	},
	sourceDownload: function(){
		// only works if using rendusa drupal module. 
		// download current source (in original format3D)
		if (!this.source || !this.source.info) return;
		var link = '/?q=rendusa/media/download/' + this.source.info.media_id;
		window.open(link, '_blank');
		//window.location.href = link;
	},
	sourceSelect: function(i){
		i = typeof i == 'undefined' ? this.source_index : i;
		if (i < 0) i = this.sources.length - 1;
		if (i >= this.sources.length) i = 0;
		this.source.stopIt();
		this.source_index = i;
		if (!this.sources.length || this.sourcesSupportedCount() === 0){
			this.source_index = -1;
			return false;
		}
		var srcInfo = this.sources[i];
		if (!srcInfo || srcInfo.isValid === 0) return false;
		// if (!srcInfo.format3D) srcInfo.format3D = '2D';
		// if (!srcInfo.mime) srcInfo.mime = this._getMime(srcInfo.url);
		if (!this.renderers[srcInfo.format3D] || !this.renderers[srcInfo.format3D].render) {
			this._unloadSrc();
			//console.log('!! ' + srcInfo.format3D + ' format is unsupported !!');
			srcInfo.isValid = 0;
			// if (this.skipUnsupported) {
			// 	//console.log('!! skipping unsupported format !!');
			// 	this.sourceNext();
			// }
			return false;
		}
		if (this.activeRenderer && this.activeRenderer.inFormat != srcInfo.format3D){
			this.activeRenderer.active = false;
		}
		$(this.target.target_el).removeClass('rendusa_source_loaded');
		this.activeRenderer = this.renderers[srcInfo.format3D];
		var changed = !this.activeRenderer.active;
		this.activeRenderer.active = true;
		if (srcInfo.mime.indexOf('image/') === 0){
			this._setSrcImage(srcInfo);
		} else if (srcInfo.mime.indexOf('video/') === 0){
			this._setSrcVideo(srcInfo);
		}
		if (changed) $(this.target.target_el).trigger('rendusa_renderer_changed', [ { renderer: this.activeRenderer } ]);
		$(this.target.target_el).trigger('rendusa_source_changing', [ { source: srcInfo, index: i } ]);
		return true;
	},
	sourceNext: function(){
		var si = this.source_index + 1;
		if (si >= this.sources.length && this.source.loop !== 1) return;
		if (!this.sourceSelect(si) && this._getValidSource() > 0){
			this.sourceNext();
		}
	},
	_getValidSource: function(){
		var ret = 0;
		for(var i = 0; i < this.sources.length; i++) if (this.sources[i].isValid !== 0) ret++;
		if (ret === 0){
			console.log('No posibly valid sources loaded out of', this.sources.length, 'sources');
		}
		return ret;
	},
	byteSizeToReadable: function(bytes, si) {
		var thresh = si ? 1000 : 1024;
		if(Math.abs(bytes) < thresh) {
			return bytes + ' B';
		}
		var units = si
			? ['kB','MB','GB','TB','PB','EB','ZB','YB']
			: ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
		var u = -1;
		do {
			bytes /= thresh;
			++u;
		} while(Math.abs(bytes) >= thresh && u < units.length - 1);
		return bytes.toFixed(1)+' '+units[u];
	},
	secondsToTime: function(ins, include_ms){
		var ms = ins;
		ins = parseInt(ins) || 0;
		ms = (parseInt((ms - ins) * 1000) || 0)+'';
		var s = (ins % 60) + '';
		var m = Math.floor(ins / 60) + '';
		var h = Math.floor(ins / 3600) + '';
		while (s.length < 2) { s = '0'+s; }
		while (m.length < 2) { m = '0'+m; }
		if (include_ms){
			while (ms.length < 3) { ms = '0'+ms; }
			return h+':'+m+':'+s+'.'+ms;
		} else {
			return h+':'+m+':'+s;
		}
	},
	sourcePrev: function(){
		var si = this.source_index - 1;
		if (!this.sourceSelect(si) && this._getValidSource() > 0){
			this.sourcePrev();
		}
	},
	appendSources: function(sources){
		// TODO
	},
	prependSources: function(sources){
		// TODO
	},
	clearSources: function(){
		this.setSources();
	},
	sourcesSupportedCount: function(){
		var supported_cnt = 0;
		for(var i = 0; i < this.sources.length;i++){
			if (this.renderers[this.sources[i].format3D]){
				supported_cnt++;
			}
		}
		return supported_cnt;
	},
	setSources: function(sources, playIndex){
		playIndex = !playIndex ? 0 : playIndex;
		if (!sources || typeof sources != 'object') sources = [];
		for(var i = 0; i < sources.length;i++){
			var srcInfo = sources[i];
			if (!srcInfo.format3D) srcInfo.format3D = '2D';
			if (!srcInfo.mime) srcInfo.mime = this._getMime(srcInfo.url);
		}
		this.sources = sources;
		//console.log('Rendusa sources loading', sources);
		this.source_index = -1;
		this.sourceSelect(playIndex);
		return true;
	},
	formatNext: function(){
		if (this.activeRenderer && this.activeRenderer.formatNext) this.activeRenderer.formatNext();
	},
	formatPrev: function(){
		if (this.activeRenderer && this.activeRenderer.formatPrev) this.activeRenderer.formatPrev();
	},
	format3DName: function(){
		var ret = '';
		if (this.activeRenderer
		 && this.activeRenderer.outFormats
		  && typeof this.activeRenderer.outFormat != 'undefined'
		   && this.activeRenderer.outFormats[this.activeRenderer.outFormat]) {
			   ret = this.activeRenderer.outFormats[this.activeRenderer.outFormat];
		}
		return ret;
	},
	supported: function(){
		var ret = false;
		var canvas;
		var ctx;
		try {
		  canvas = document.createElement('canvas');
		  ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		  if (ctx) ret = true;
		} catch(e) {
		}
		ctx = null;
		canvas = null;		
		return ret;
	},
	showStats: function(){
		if (!this._stats){
			this._stats = new Stats();
			this._stats.setMode(0); // 0: fps, 1: ms
			// align top-left
			this._stats.domElement.style.position = 'absolute';
			this._stats.domElement.style.left = '2px';
			this._stats.domElement.style.top = '2px';
			$(this._stats.domElement).appendTo(this.target.rendusa_el);
		} else {
			$(this._stats.domElement).show();
		}
	},
	hideStats: function(){
		if (this._stats) $(this._stats.domElement).hide();
	},
	toggleStats: function(){
		if (this._stats) {
			$(this._stats.domElement).toggle();
		} else {
			this.showStats();
		}
	},
	_drawOverlay: function(){
		// draw overlay on this.target.overlayRenderTarget
		// the format renderer will use it for final output
		// TODO
		// this.target.overlayRenderTarget
		for(var rname in this.renderers){
			var rend = this.renderers[rname];
			if (rend.renderUI) rend.renderUI();
		}
	},
	_sourceEnded: function(){
		this.source.currentTime = this.source.duration;
		this.source.ended = true;
		this.source.paused = true;
		//console.log('ended');
		if (this.source.loop == 1){
			// loop all
			this.source.next();
		} else if (this.source.loop == 2){
			// loop current
			this.source.play();
		} 
	},
	_render: function(){
		//requestAnimationFrame(render);
		var oThis = this;
		var ticks = new Date().getTime();
		var elapsed = ticks - this._lastRenderTick;
		this._lastRenderTick = new Date().getTime();
		requestAnimationFrame(function(){ oThis._render(); });
		// render
		if (this.source.video_in.playbackRate != this.source.playbackRate) this.source.video_in.playbackRate = this.source.playbackRate;
		if (this._stats) this._stats.begin();
		var dw = $(this.target.canvas_out).width();
		var dh = $(this.target.canvas_out).height();
		if (!this.target.ready || this.target.canvas_out.width != dw || this.target.canvas_out.height != dh){
			this._renderer.setSize( dw, dh );
			if (this.isThisFullscreen()){
				this.target.isFullscreen = true;
				this.target.widthFullscreen = dw;
				this.target.heightFullscreen = dh;
			} 
			else 
			{
				this.target.isFullscreen = false;
				this.target.widthWindowed = dw;
				this.target.heightWindowed = dh;
			}
			this.target.width = dw;
			this.target.height = dh;
			//console.log('destination size ' + dw + 'x' + dh);
			this.target.ready = true;
			// initialize target.overlayRenderTarget
			if (this.target.overlayRenderTarget) this.target.overlayRenderTarget.dispose();
			this.target.overlayRenderTarget = new THREE.WebGLRenderTarget( dw, dh, { 
				minFilter: THREE.LinearFilter, 
				magFilter: THREE.LinearFilter, 
				format: THREE.RGBAFormat,
				stencilBuffer: false
			});
			return;
		}
		if (this.source.ready){
			if (this.source.inType == 'video'){
				if (this.source.info.url.indexOf('blob:') == 0 && this._waiting > 0){
					if (ticks - this._waiting > 1000){
						this._waiting = ticks;
						var t = this.source.video_in.currentTime - 0.5;
						t = t > 0 ? t : 0;
						this.source.video_in.currentTime = t;
					}
				}
				//this.source.currentTime = this.source.video_in.currentTime;
			} else if (this.source.inType == 'image'){
				if (!this.source.paused && !this.source.ended){
					if (this.source.currentTime < this.source.duration){
						this.source.currentTime += elapsed * this.source.playbackRate / 1000;
					}
				}
			}
		}
		this.target.overlayRenderTargetReady = false;
		this._drawOverlay();
		if (this.activeRenderer) {
			this.activeRenderer.render();
		} else {
			if (this.renderers[this._defaultFormat3D]){
				this.renderers[this._defaultFormat3D].render();
				this._render.setRenderTarget(null);
			}
		}
		//
		if (this.source.ready){
			if (this.source.currentTime >= this.source.duration){
				// image has ended
				if (!this.source.ended) this._sourceEnded();
			} else {
				if (this.source.ended) this.source.ended = false;
			}
		}
		if (this._stats) this._stats.end();	
	},
	requestFullscreen: function(){
		var ret = true;
		var elem = $('[rendusa_id="' + this.rendusa_id + '"]').get(0);
		if (typeof elem.requestFullscreen != 'undefined') {
			elem.requestFullscreen();
		} else if (typeof elem.msRequestFullscreen != 'undefined') {
			elem.msRequestFullscreen();
		} else if (typeof elem.mozRequestFullScreen != 'undefined') {
			elem.mozRequestFullScreen();
		} else if (typeof elem.webkitRequestFullscreen != 'undefined') {
			elem.webkitRequestFullscreen();
		} else {
			ret = false;
		}
		return ret;
	},
	exitFullscreen: function(){
		// exit fullscreen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
	},
	toggleFullscreen: function(){
		if (this.isThisFullscreen()){
			//this.log('Exiting FS');
			this.exitFullscreen();
		} else {
			//this.log('Entering FS');
			this.requestFullscreen();
		}
	},
	fullscreenEnabled: function(){
		// is fullscreen available right now
		return (document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
	},
	fullScreenElement: function(){
		// returns the current fullscreen element if any
		var ret = null;
		if (document.fullscreenElement){
			ret = document.fullscreenElement;
		} else if (document.webkitFullscreenElement){
			ret = document.webkitFullscreenElement;
		} else if (document.mozFullScreenElement){
			ret = document.mozFullScreenElement;
		} else if (document.msFullscreenElement){
			ret = document.msFullscreenElement;
		}
		return ret;	
	},
	isThisFullscreen: function(){
		var fse = this.fullScreenElement();
		if (fse && $(fse).attr('rendusa_id') == this.rendusa_id) return true;
		return false;
	},
	_load_settings: function(){
		//this.view_modes_enabled = this._load_setting('view_modes_enabled', ['2D']);
		//this.view_modes_enabled = this._load_setting('view_modes_enabled', ['2D']);

	},
	_save_settings: function(){
		//this._save_setting('view_modes_enabled', this.view_modes_enabled);
		
	},
	_load_setting: function(key, default_val){
		var ret = null;
		if (typeof default_val != 'undefined') ret = default_val;
		if (typeof localStorage[key] == 'undefined' && localStorage.getItem(key) == null){
			return ret;
		}
		return JSON.parse(localStorage[key]);
	},
	_save_setting: function(key, val){
		try {
			localStorage.setItem(key, JSON.stringify(val));
			return true;
		} catch(e) { }
		return false;
	},
};

})(jQuery);