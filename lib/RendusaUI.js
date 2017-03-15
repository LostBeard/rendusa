(function($){

var needsUpdate = true;
var rgbWidth = 2;
var rgbHeight = 2;

THREE.RendusaRenderers = THREE.RendusaRenderers ? THREE.RendusaRenderers : {};

THREE.RendusaRenderers['RendusaUI'] = function ( renderer, source, target, _rendusa ) {
	var oThis = this;
	this.rendererName = 'RendusaUI';

    var $ui = $('<div class="rendusa_ui_div">').appendTo(target.rendusa_el);
    this.$ui = $ui;
    var $control_panel = $('<div class="rendusa_ui_control_panel">').appendTo($ui);

    var $cover = $('<div class="rendusa_ui_cover">').appendTo($ui);

    var $help_panel = $('<div class="rendusa_ui_help_panel">').appendTo($ui);
    var $help_table = $('<table class="rendusa_ui_help_table">').appendTo($help_panel);
    $('<tr>').appendTo($help_table).append('<td><div>Left Arrow</div></td>').append('<td><div>Previous Source</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>Right Arrow</div></td>').append('<td><div>Next Source</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>Space</div></td>').append('<td><div>Pause / Play</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>M</div></td>').append('<td><div>Mute</div></td>');

    $('<tr>').appendTo($help_table).append('<td><div>[</div></td>').append('<td><div>Previous 3D Format</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>]</div></td>').append('<td><div>Next 3D Format</div></td>');


    $('<tr>').appendTo($help_table).append('<td><div>F</div></td>').append('<td><div>Fullscreen</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>P</div></td>').append('<td><div>Perspective Mode</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>S</div></td>').append('<td><div>Stats</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>T</div></td>').append('<td><div>Head tracking (Requires Camera)</div></td>');
    $('<tr>').appendTo($help_table).append('<td><div>H</div></td>').append('<td><div>Help screen</div></td>');

    var $info_panel = $('<div class="rendusa_ui_info_panel">').appendTo($ui);
    var $info_table = $('<table class="rendusa_ui_info_table">').appendTo($info_panel);
    $('<tr>').appendTo($info_table).append('<td><div>Game</div></td>').append('<td><div class="rendusa_ui_in_src_game_label"></div></td>');
    $('<tr>').appendTo($info_table).append('<td><div class="rendusa_ui_in_src_name_label_label">Media</div></td>').append('<td><div class="mouse_events rendusa_ui_in_src_name_label"></div></td>');
    $('<tr>').appendTo($info_table).append('<td><div>Shared By</div></td>').append('<td><div class="rendusa_ui_in_src_shared_by_label"></div></td>');
    $('<tr>').appendTo($info_table).append('<td><div>Format</div></td>').append('<td><div class="rendusa_ui_in_format_3d_label"></div></td>');

    var $progress = $('<div class="rendusa_ui_progress_bar rendusa_ui_progress_current_time">').appendTo($control_panel);
    var $progress_inner = $('<div class="rendusa_ui_progress_bar_inner">').appendTo($progress);
    var $progress_inner_2 = $('<div class="rendusa_ui_progress_bar_inner_2">').appendTo($progress);
    var $progress_inner_perspective = $('<div class="rendusa_ui_progress_bar_inner_vbar">').appendTo($progress);

    var $controls = $('<div class="rendusa_ui_controls">').appendTo($control_panel);

    var $controls_c = $('<div class="rendusa_ui_controls_center">').appendTo($controls);
    var $controls_l = $('<div class="rendusa_ui_controls_left">').appendTo($controls);
    var $controls_r = $('<div class="rendusa_ui_controls_right">').appendTo($controls);
    //
    $(target.rendusa_el).keydown(function(e) {
        switch(e.which) {
            case 72: // h
				oThis.toggleHelp();
		    break;
        }
    });
    this.toggleHelp = function(){
        $help_panel.toggle();
        if ($help_panel.is(':visible')){
            last_moved = new Date().getTime();
        }
    };
    
    
    $('<div class="rendusa_ui_button rendusa_ui_help_button mouse_events">').appendTo($controls_r).click(function(){
        oThis.toggleHelp();
    });

    var $perspective_cb = $('<div class="rendusa_ui_checkbox rendusa_ui_perspective_checkbox mouse_events">').appendTo($controls_r).on('rendusa_ui_checkbox_changed', function(){
        var $el = $(this);
        target.perspectiveXEnabled = $el.is('[checked]');
    });
    var update_perspective_enabled = function(){
        if (target.perspectiveXEnabled){
            $perspective_cb.attr('checked', 'checked');
        } else {
            $perspective_cb.removeAttr('checked');
        }
    };
    $(target.target_el).on('rendusa_perspective_changed', function(){
        update_perspective_enabled();
    });
    update_perspective_enabled();

    var $mute_cb = $('<div class="rendusa_ui_checkbox rendusa_ui_mute_checkbox mouse_events">').appendTo($controls_r).on('rendusa_ui_checkbox_changed', function(){
        var $el = $(this);
        source.muted = $el.is('[checked]');
    });
    var update_mute = function(){
        if (source.muted){
            $mute_cb.attr('checked', 'checked');
        } else {
            $mute_cb.removeAttr('checked');
        }
    };
    $(source.video_in).on('volumechange', function(){
        update_mute();
    });
    update_mute();
    //
    
    $('<div class="rendusa_ui_button rendusa_ui_expand_button mouse_events">').appendTo($controls_r).click(function(){
        _rendusa.toggleFullscreen();
    });
    //


    $('<div class="rendusa_ui_button rendusa_ui_format_3d_button mouse_events">').appendTo($controls_l).click(function(){
        _rendusa.formatNext();
    });
    $('<div class="rendusa_ui_format_3d_label mouse_events">').appendTo($controls_l).click(function(){
        _rendusa.formatNext();
    });
    var update_format_3d_out = function(){
        $ui.find('.rendusa_ui_format_3d_label').text(_rendusa.format3DName());
    };
    var update_info = function(){

        var format3D = source.info && source.info.format3D === '2DZ' ? '2D+Z' : '';
        var src_name = source.info && source.info.filename ? source.info.filename : '';
        var game = source.info && source.info.steam_name ? source.info.steam_name : '';
        var shared_by = source.info && source.info.shared_by ? source.info.shared_by : '';
        //
        $ui.find('.rendusa_ui_in_src_game_label').text(game).closest('tr').css('display', game === '' ? 'none' : '');
        $ui.find('.rendusa_ui_in_src_shared_by_label').text(shared_by).closest('tr').css('display', shared_by === '' ? 'none' : '');
        $ui.find('.rendusa_ui_in_format_3d_label').text(format3D).closest('tr').css('display', format3D === '' ? 'none' : '');

        $ui.find('.rendusa_ui_in_src_name_label_label').text((_rendusa.source_index + 1) + ' of ' + _rendusa.sources.length);
        $ui.find('.rendusa_ui_in_src_name_label').text(src_name);
    };
    $(target.target_el).on('rendusa_source_change_start', function(){
        // the source changed
        //console.log('rendusa_source_change_start');
        update_info();
        update_format_3d_out();
        needsUpdate = true;
    });
    $(target.target_el).on('rendusa_source_changed', function(){


    });
    $(target.target_el).on('rendusa_format_3d_changed', function(){
        update_format_3d_out();
    });
    //
    var $dur_label_cont = $('<div class="rendusa_ui_progress_label_container">').appendTo($progress);
    var $dur_label = $('<div class="rendusa_ui_progress_label">').appendTo($dur_label_cont).text('00:00:00 - 00:00:00');
    var updateTimeLabel = function(){
        var label = _rendusa.secondsToTime(source.currentTime) + ' - ' + _rendusa.secondsToTime(source.duration);
        $dur_label.text(label);
    };
    //$('<br/>').appendTo($controls_c);
    //
    $('<div class="rendusa_ui_button rendusa_ui_prev_button mouse_events">').appendTo($controls_c).click(function(){
        source.prev();
    });
    //
    var $play_cb = $('<div class="rendusa_ui_checkbox rendusa_ui_play_checkbox mouse_events">').appendTo($controls_c).on('rendusa_ui_checkbox_changed', function(){
        var $el = $(this);
        if ($el.is('[checked]')){
            source.play();
        } else {
            source.pause();
        }
    });
    var update_play = function(){
        if (!source.paused){
            $play_cb.attr('checked', 'checked');
        } else {
            $play_cb.removeAttr('checked');
        }
    };
    $(target.target_el).on('rendusa_paused_changed', function(){
        update_play();
    });
    update_play();
    //
    $('<div class="rendusa_ui_button rendusa_ui_next_button mouse_events">').appendTo($controls_c).click(function(){
        source.next();
    });
    //


    //
    $ui.find('img').load(function(){
        // if ther eare images update the ui when they finish loading
        needsUpdate = true;
    });
    //
    $ui.find('.rendusa_ui_in_src_name_label').click(function(){
        _rendusa.sourceDownload();
    });
    $ui.find('.rendusa_ui_checkbox').click(function(){
        var $el = $(this);
        if ($el.is('[checked]')){
            $el.removeAttr('checked');
        } else {
            $el.attr('checked', 'checked');
        }
        $el.trigger('rendusa_ui_checkbox_changed');
    });
    //
    var bitmap = document.createElement('canvas');
    var g = bitmap.getContext('2d');
    var texture = null;

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

    function inBoundsCheck(pos, bounds){
        if (bounds.x <= pos.x && bounds.x + bounds.width > pos.x){
            if (bounds.y <= pos.y && bounds.y + bounds.height > pos.y){
                return true;
            }
        }
        return false;
    }
    function getObjectAtPos(pos){
        var $fnd = null;
        if (oThis.visible) {
            var ui_offset = $ui.offset();
            $ui.find('*:visible.mouse_events, *:visible.rendusa_ui_button, *:visible.rendusa_ui_checkbox').each(function(){
                var $el = $(this);
                var el_offset = $el.offset();
                var bounds = { 
                    x: el_offset.left - ui_offset.left,
                    y: el_offset.top - ui_offset.top,
                    width: $el.width(),
                    height: $el.height()
                };
                if (inBoundsCheck(pos, bounds)){
                    $fnd = $el;
                }
            });
        }
        return $fnd;
    }

    var last_moved = new Date().getTime();
	// mouse events
    $(target.canvas_out).on('mousemove', function(e){
        var elm = $(this);
        var posX = e.pageX - elm.offset().left;
        var posY = e.pageY - elm.offset().top;
        var pos = {
            x: posX,        
            y: posY,
            x_orig: posX,   // these values are not allowed (they could but shouldn't) to be changed by event handlers
            y_orig: posY,
        };
        $(target.target_el).trigger('rendusa_ui_pos_pre', [ pos ]);
        if (pos.x > rgbWidth || pos.x < 0 || pos.y > rgbHeight || pos.y < 0) {
            return;
        }
        last_moved = new Date().getTime();

        target.perspectiveX = pos.x * 2 / target.width - 1;

        //
        // var $fnd = getObjectAtPos(pos);
        // if ($fnd){
            
        // }
        //
        $(target.target_el).trigger('rendusa_ui_mousemove', [ pos ]);
        if (!oThis.visible) {
            oThis.visible = true;
        }
        needsUpdate = true;
    });

    $(target.canvas_out).on('mousedown', function(e){
        var elm = $(this);
        var posX = e.pageX - elm.offset().left;
        var posY = e.pageY - elm.offset().top;
        var pos = {
            x: posX,        
            y: posY,
            x_orig: posX,   // these values are not allowed (they could but shouldn't) to be changed by event handlers
            y_orig: posY,
        };
        $(target.target_el).trigger('rendusa_ui_pos_pre', [ pos ]);
        if (pos.x > rgbWidth || pos.x < 0 || pos.y > rgbHeight || pos.y < 0) {
            return;
        }
        //
        $ui.find('.rendusa_ui_mousedown').removeClass('rendusa_ui_mousedown');
        var $fnd = getObjectAtPos(pos);
        if ($fnd) {
            //$ui.find('.rendusa_ui_mousedown').removeClass('rendusa_ui_mousedown');
            $fnd.addClass('rendusa_ui_mousedown');
        }
        //
        $(target.target_el).trigger('rendusa_ui_mousedown', [ pos ]);
        needsUpdate = true;
    });

    $(target.canvas_out).on('mouseup', function(e){
        var elm = $(this);
        var posX = e.pageX - elm.offset().left;
        var posY = e.pageY - elm.offset().top;
        var pos = {
            x: posX,        
            y: posY,
            x_orig: posX,   // these values are not allowed (they could but shouldn't) to be changed by event handlers
            y_orig: posY,
        };
        $(target.target_el).trigger('rendusa_ui_pos_pre', [ pos ]);
        var inbounds = true;
        if (pos.x > rgbWidth || pos.x < 0 || pos.y > rgbHeight || pos.y < 0) {
            inbounds = false;
        }
        //
        $ui.find('.rendusa_ui_mousedown').removeClass('rendusa_ui_mousedown');
        // var $fnd = getObjectAtPos(pos);
        // if ($fnd){
            
        // }
        //
        $(target.target_el).trigger('rendusa_ui_mouseup', [ pos, inbounds ]);
        needsUpdate = true;
    });

    $(target.canvas_out).click(function(e){
        var elm = $(this);
        var posX = e.pageX - elm.offset().left;
        var posY = e.pageY - elm.offset().top;
        // Trigger ui click event with click position before it is used (pre)
        // this will allow other renderers the chance to adjust the coordinates depending on the current 3D mode
        // Example. 2D+Z and stereo side by side will multiply x by 2 to account for the side by side views
        var pos = {
            x: posX,        
            y: posY,
            x_orig: posX,   // these values are not allowed (they could but shouldn't) to be changed by event handlers
            y_orig: posY,
        };
        //console.log('click', pos.x, pos.y);
        // this event will allow changes to 
        $(target.target_el).trigger('rendusa_ui_pos_pre', [ pos ]);
        if (pos.x > rgbWidth || pos.x < 0 || pos.y > rgbHeight || pos.y < 0) {
            return;
        }
        //
        var $fnd = getObjectAtPos(pos);
        if ($fnd){
            if ($fnd.click) $fnd.click();
        }
        //
        $(target.target_el).trigger('rendusa_ui_click', [ pos ]);
        needsUpdate = true;
    });


	// shaders
	var shaderUI = new THREE.ShaderMaterial( THREE.UIShader, { transparent: true, opacity: 0.5, depthWrite: false, depthTest: false } );

	var setSize = function ( width, height ) {	
        if (!width || !height) reutrn;
		oThis.dispose();
        needsUpdate = true;
		rgbWidth = width;
		rgbHeight = height;
        bitmap.width = width;
        bitmap.height = height;
		_camera.aspect = width / height;
		_camera.updateProjectionMatrix();	
        scene.updateMatrixWorld();
		return true;
	};

    /****
    * Options/Indicators UI needs to make available
    * format3D output select - 2D, Stereo SBS, 2DZ (depnding on input)
    * Flat ON/OFF
    * thumbnails for sources. selectable
    * pause, play, next, prev, mute, progress indicator, fadeable media info when 
    * all clickable
    * keyboard controls
    ****/
    var _imgcache = {};
    var getBackgroundImage = function(background_img){
        var ret = false;
        if (_imgcache[background_img]){
            if (_imgcache[background_img].width == 0){
                // loading just need to wait for this image
                return ret;
            } else {
                ret = _imgcache[background_img];
                return ret;
            }
        }

        var m = background_img.match(/^url\("?(.+?)"?\)$/i);
        var src = '';
        if (m) src = m[1];
        if (src != ''){
            var img = new Image();
            img.onload = function(){
                needsUpdate = true;
            };
            img.src = src;
            _imgcache[background_img] = img;
            return ret;
        }
        return ret;
    }
    var updateUI = function(){
        // clear canvas
        update_info();
        update_format_3d_out();
        if (bitmap.width != rgbWidth || bitmap.height != rgbHeight){
            bitmap.width = rgbWidth;
            bitmap.height = rgbHeight;
        }
        g.clearIt();
        if (oThis.visible) {
            var ui_offset = $ui.offset();
            $ui.find('*').each(function(){
                var $el = $(this);
                var el_offset = $el.offset();
                var y = el_offset.top - ui_offset.top;
                var x = el_offset.left - ui_offset.left;
                var width = $el.width();
                var height = $el.height();
                if (!$el.is(':visible')) return;
                g.globalAlpha = 1;
                if ($el.is('div')){
                    // background-color
                    var opacity = $el.css('opacity');
                    g.globalAlpha = opacity;
                    var background_color = $el.css('background-color');
                    g.fillStyle = background_color;
                    g.fillRect(x, y, width, height);
                    // background-image
                    var img = getBackgroundImage($el.css('background-image'));
                    if (img){
                        g.drawImage(img, x, y, width, height);
                    }
                } else if ($el.is('img')){
                    g.drawImage(this, x, y, width, height);
                }
                // if it has no children it may be a text elelement
                if ($el.find('*').length == 0){
                    var txt = $el.text();
                    if (typeof txt == 'string' && txt.length > 0){
                        var font_color = $el.css('color');
                        var font = $el.css('font-size') + ' ' + $el.css('font-family');
                        var font_height = font.match(/[0-9]+/) * 1;
                        var font_weight = $el.css('font-weight') * 1;
                        if (font_weight > 400) font = 'bold ' + font;
                        g.fillStyle = font_color;
                        g.font = font;
                        g.fillText(txt, x, y + font_height);
                    }
                }
            });
        }
        // update texture
        if (!texture) {
            texture = new THREE.Texture(bitmap);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

        }
        texture.needsUpdate = true;
        needsUpdate = false;
    };
     
    var _html = '';
    var _outFormat = '';
    var hide_delay = 5000;
    var _checkit = function(){
        var ticks = new Date().getTime();
        var outFormat = _rendusa.activeRenderer && _rendusa.activeRenderer.outFormats ? _rendusa.activeRenderer.outFormats[_rendusa.activeRenderer.outFormat] : '';
        if (_outFormat != outFormat){
            _outFormat = outFormat;
            needsUpdate = true;
        }
        if (oThis.visible && ticks - last_moved > hide_delay){
            oThis.visible = false;
        } else if (!oThis.visible && ticks - last_moved < hide_delay) {
            oThis.visible = true;
        }
        // current time position in media
        var perc = 0;
        if (source.duration > 0){
            perc = Math.ceil(source.currentTime * 100 / source.duration);
        }
        $progress_inner.css('width', perc + '%');
        // current percent of media downloaded
        perc = 0;
        if (source.duration > 0){
            perc = Math.ceil(source.durationDownloaded * 100 / source.duration);
        }
        $progress_inner_2.css('width', perc + '%');
        updateTimeLabel();

        perc = (target.perspectiveX + 1) * 100 / 2;
        $progress_inner_perspective.css('left', perc + '%');


        //
        if ($ui.html() != _html){
            _html = $ui.html();
            needsUpdate = true;
        }
    };


    var srcIDChanged = function(){
		_srcID = source.srcID;
        needsUpdate = true;
		//console.log('RendusaUI srcIDChanged', _srcID);
	};

    var _srcID = 0;
	this.renderUI = function () {
        if (_srcID != source.srcID) srcIDChanged();
        if (target.width != rgbWidth || target.height != rgbHeight){
            setSize(target.width, target.height);
        }
        _checkit();
        if (needsUpdate) updateUI();
        // draw texture onto overlay
        shaderUI.uniforms[ "mapIn" ].value = texture;
        scene.overrideMaterial = shaderUI;
        renderer.render( scene, _camera, target.overlayRenderTarget, true); // maybe make true false to not clear rendertarget in case it's already been drawn on. would need rendusa to clear at beginning of each frame
        shaderUI.uniforms[ "mapIn" ].value = null;  // release source.texture
		target.overlayRenderTargetReady = true;
	};
	this.dispose = function() {
        if (texture) texture.dispose();
        texture = null;
	};
    var _visible = true;
    Object.defineProperties(this, {
         visible: {
             get: function(){
                 return _visible || !source.ready;
             },
             set: function(value){
                 if (_visible == value) return;
                 _visible = value;
                 if (!_visible) $help_panel.hide();
                 needsUpdate = true;
             }
         },
    });
};



})(jQuery);