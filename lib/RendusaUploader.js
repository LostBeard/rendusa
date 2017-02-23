
// add format and source name to each entry
// add button next to ^ to mark all entries the same way (for quicker uploading of similar items)
// add entry progress bars
// add total progress bar 
// add additional tools such as 2DZ header checker

jQuery(document).ready(function(){

var $ = jQuery;


function RendusaUploader(options){
    var defaults = {
        action: '',
        method: 'post',
    };
    for(var key in defaults) if (typeof options[key] == 'undefined') options[key] = defaults[key];
    if (!options || !options.target || !$(options.target).length) {
        console.error('RendusaUploader bad options');
        return;
    }
    this.options = options;
    var $target =   $(options.target);
    
    var allowed_mime = [
        'image/png',
        'image/bmp',
        'image/jpeg',
        'video/mp4',
        'video/ogg',
        'video/webm',
    ];

    $target.addClass('rendusa_uploader').addClass('rendusa_uploader_empty');
    // <div class="rendusa_upload_queue_controls">

    var rendusa = new THREE.Rendusa({ target: $('<div class="rendusa_preview"></div>').appendTo($target) });
    this.rendusa = rendusa;
    rendusa.source.video_in.muted = true;
    rendusa.source.loop = 2;

    $(rendusa.target.target_el).on('rendusa_source_changed', function(e, edat){
        console.log('edat', edat);
        $target.find('.rendusa_upload_queue_item.rendusa_preview_item').removeClass('rendusa_preview_item');
        $target.find('.rendusa_upload_queue_item').eq(edat.index).addClass('rendusa_preview_item');
    });

    // add event listener for rendusa on source change


    var $ruqc = $('<div class="rendusa_upload_queue_controls">').appendTo($target);
    $('<div tabindex="0" class="rendusa_upload_queue_button rendusa_upload_clear_button">').html('<div></div><div>Clear</div>').appendTo($ruqc);
    $('<div tabindex="0" class="rendusa_upload_queue_button rendusa_upload_all_button">').html('<div></div><div>Upload All</div>').appendTo($ruqc);
    $('<div class="rendusa_upload_queue_status">').appendTo($target);
    var $queue = $('<div class="rendusa_upload_queue">').appendTo($target);

    var $drop = $('<div class="rendusa_upload_drop_zone">').appendTo($target.find('.rendusa')).on('click', function(){
        $reset_file_input.click();
        $file_input.click();
    });;
    $('<div>').html('Drag and drop media files <br/> Or click to select files to upload').appendTo($drop);
    
    var $form = $('<form>').css('display', 'none').appendTo($target);
    var $file_input = $('<input type="file" name="mediafile" multiple>').attr('accept', allowed_mime.join(',')).appendTo($form);
    var $reset_file_input = $('<input type="reset">').appendTo($form);
    var isAdvancedUpload = function() {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();

    var sources = [];
    this.sources = sources;
    rendusa.setSources(sources);
    function uploadAll(){
        $queue.find('[queue-state="ready"] .rendusa_upload_item_upload_button').not('[disabled]').click();
    }
    function clearAll(){
        if ($queue.find('.rendusa_upload_busy_item').length) return;
        $queue.empty();
        
        sources.splice(0, sources.length)
        rendusa.setSources(sources);    
        checkEmpty();    
    }

    $target.find('.rendusa_upload_all_button').on('click', function(){
        uploadAll();
    });
    $target.find('.rendusa_upload_clear_button').on('click', function(){
        clearAll();
    });
    function checkEmpty(){
        if ($target.find('.rendusa_upload_queue_item').length == 0) {
            $target.addClass('rendusa_uploader_empty');
        } else {
            $target.removeClass('rendusa_uploader_empty');
        }
    }

    function queueEntry($q){
        if ($q.attr('queue-state') != 'ready') return;
        // TODO - verify all required entry info is set before continuing

        $q.attr('queue-state', 'uploadqueue').addClass('rendusa_upload_busy_item');
        
        $q.find('.rendusa_upload_format_3d').attr('disabled', 'disabled');
        $q.find('.rendusa_upload_item_upload_button').val('Upload Queued').attr('disabled', 'disabled');
        uploadNextQueued();
    }

    var $input_format_3d_template = $('<select class="rendusa_upload_format_3d"><option selected="selected" value="">Select</option></select>');
    for(var i = 0;i < rendusa_formats_3d.length; i++){
        var rf3 = rendusa_formats_3d[i];
        $('<option value=""></option>').val(rf3).text(rf3).appendTo($input_format_3d_template);
    }
    function validateEntry($q){
        var is_ready = true;
        if ($q.find('.rendusa_upload_format_3d').val() === '') { 
            is_ready = false;
            $q.addClass('rendusa_upload_item_needs_info');
        }
        else
        {
            $q.removeClass('rendusa_upload_item_needs_info');
        }
        if ($q.is('[queue-state="uploadfailed"]') || $q.is('[queue-state="uploaded"]')) is_ready = false;
        if (is_ready){
            $q.find('.rendusa_upload_item_upload_button').removeAttr('disabled');
            
        } else {
            $q.find('.rendusa_upload_item_upload_button').attr('disabled', 'disabled');
        }
        return is_ready;
    }
    function loadFile(file, preview_it){
        var source = null;
        if (allowed_mime.indexOf(file.type) === -1) return;
        var src = (window.URL || window.webkitURL || window.mozURL).createObjectURL(file);
        var $q = $('<div class="rendusa_upload_queue_item rendusa_upload_busy_item" tabindex="0" queue-index="' + sources.length + '" queue-state="hashqueue" hash="">').appendTo($queue);
        source = {
            url: src,
            format3D: 'Unknown',            // default format. user will change 
            mime: file.type,
            filename: file.name,
            local: true,
            file: file,
            $q: $q,
            index: sources.length,
            width: 0,
            height: 0,
            hash: '',
        };
        sources.push(source);
        // build $q
        // filename
        var $head = $('<div class="rendusa_upload_item_head">').appendTo($q);
        $('<div class="rendusa_upload_item_img_tags">').appendTo($head);
        $('<div class="rendusa_upload_item_name">').appendTo($head).text(file.name);
        var $item_body = $('<div class="rendusa_upload_item_body">').appendTo($q);
        //
        var $table = $('<table class="rendusa_upload_item_info" cellspacing="0" cellpadding="0">').appendTo($item_body);
        var $tbody = $('<tbody>').appendTo($table);
        var $inpformat_row = $('<tr>').append('<td>3D Format</td>').append('<td></td>').appendTo($tbody);
        $('<tr>').append('<td>Size</td>').append('<td>' + rendusa.byteSizeToReadable(file.size) + '</td>').appendTo($tbody);
        $('<tr>').append('<td>Resolution</td>').append('<td class="rendusa_queue_item_dim"></td>').appendTo($tbody);
        $('<tr>').append('<td>Type</td>').append('<td>' + file.type + '</td>').appendTo($tbody);
        $q.click(function(){
            if (rendusa.renderers[source.format3D]) rendusa.sourceSelect(source.index);

        });
        var $f3d_in = $input_format_3d_template.clone().on('change', function(){
            var format_3d = $(this).val();
            source.format3D = format_3d;
            console.log(source);
            // restart rendusa preview with this source
            rendusa.sourceSelect(source.index);
            validateEntry($q);
        }).appendTo($inpformat_row.find('td').eq(1));

        var complete = function(){
            $q.find('.rendusa_queue_item_dim').text(source.width + 'x' + source.height);
            //
            var $inpready_row = $('<tr>').append('<td></td>').append('<td></td>').appendTo($tbody);
            $('<input class="rendusa_upload_item_upload_button" disabled="disabled" value="Hash Queue" type="button">').on('click', function(){
                source.setProgress(0);
                queueEntry($q);
            }).appendTo($inpready_row.find('td').eq(1));
            //
            if (preview_it !== false) rendusa.setSources(sources, source.index); 
            hashNextQeueued();
            checkEmpty();
            validateEntry($q);
        };

        var $thumb = $('<div class="rendusa_upload_thumb">').appendTo($item_body);
        if (file.type.indexOf('image/') === 0){
            $('<img width="192">').attr('src', src).appendTo($thumb);
            var img = new Image();
            img.onload = function(){
                source.width = this.width;
                source.height = this.height;
                
                var header_1 = rendusa.renderers['2DZ'].checkImageHeader(this);
                if (header_1){
                    $f3d_in.val('2DZ').change();
                }
                complete();
            };
            img.src = src;
        } else if (file.type.indexOf('video/') === 0){
            $('<tr>').append('<td>Duration</td>').append('<td class="rendusa_queue_item_duration"></td>').appendTo($tbody);
            $('<tr>').append('<td>Bitrate</td>').append('<td class="rendusa_queue_item_bps"></td>').appendTo($tbody);
            $('<video style="width: 100%;">').append('<source src="' + src + '">').bind('loadedmetadata',function(e){
                source.width = this.videoWidth;
                source.height = this.videoHeight;
                source.duration = this.duration;
                var bps = file.size / source.duration;
                bps = rendusa.byteSizeToReadable(bps) + '/s';
                $q.find('.rendusa_queue_item_bps').text(bps);
                $q.find('.rendusa_queue_item_duration').text(rendusa.secondsToTime(source.duration));

                

                
            }).bind('loadeddata', function(e){
                console.log('uploader ' + e.type);
                var header_1 = rendusa.renderers['2DZ'].checkVideoHeader(this);
                if (header_1){
                    $f3d_in.val('2DZ').change();
                }
                complete();
            }).appendTo($thumb);
        }
        var $pbar = $('<div class="rendusa_upload_item_progress">').appendTo($item_body);
        var $prog_in = $('<div class="rendusa_upload_item_progress_inner">').appendTo($pbar);
        source.setProgress = function(perc){
            $prog_in.css('width', perc + '%');
        };
        //
    }

    function loadFiles(files){
        // TODO - unload any previous files
        // busy-state is busy unless item is queue-state is ready or uploaded
        if ($queue.find('.rendusa_upload_busy_item').length) return;
        clearAll();
        for(var i = 0; i < files.length; i++){
            var file = files[i];
            loadFile(file, i == files.length - 1);
        }
        rendusa.setSources(sources);
        //rendusa.sourceSelect(0);
        // queue-state values:
        // hashqueue, 
        // hashing, 
        // checkqueue, 
        // checking (checking if server file hash. will be marked as uploaded if true), 

        // needsinfo - needs the user to set additional info like format 3d

        // ready (to queue. been hashed and hash was not found on server), 
        // uploadqueue, 
        // uploading, 
        // uploaded 
        // uploadfailed
    }
    var busy = false;
    function busyCheck(){
        if ($queue.find('.rendusa_upload_busy_item').length) { 
            $target.addClass('rendusa_upload_busy'); 
            busy = true;
        } else { 
            $target.removeClass('rendusa_upload_busy'); 
            busy = false;
        };
    }
    function uploadNextQueued(){
        if ($queue.find('[queue-state="uploading"]').length) return;
        var $q = $queue.find('[queue-state="uploadqueue"]').first();
        if ($q.length){
            var si = $q.attr('queue-index') * 1;
            var source = sources[si];
            var file = source.file;
            $q.attr('queue-state', 'uploading');
            $q.find('.rendusa_upload_item_upload_button').val('Uploading');
            $q.addClass('rendusa_upload_busy_item');
            // TODO - set otehr form fields with correct data for this file
            source.setProgress(0);
            busyCheck();
            uploadFile(
                source, 
                function(f, success){
                    // oncomplete
                    if (success){
                        $q.attr('queue-state', 'uploaded');
                        $q.find('.rendusa_upload_item_upload_button').val('Uploaded').attr('disabled', 'disabled');
                    }
                    else 
                    {
                        $q.attr('queue-state', 'uploadfailed');
                        $q.find('.rendusa_upload_item_upload_button').val('Failed').attr('disabled', 'disabled');
                    }
                    $q.removeClass('rendusa_upload_busy_item');
                    busyCheck();
                    uploadNextQueued();
                },
                function(perc){
                    // up_progress
                    source.setProgress(perc);
                },
                function(){
                    // down_progress

                }
            );
        } else {
            console.log('All queued files uploaded');
        }
    }
    function uploadFile(source, oncomplete, up_progress, down_progress){
        var file = source.file;
        var success = false;
        var err = '';
        if (isAdvancedUpload) {
            // ajax for modern browsers
            var ajaxData = new FormData();  // $form.get(0)
            ajaxData.append( 'mediafile', file );
            ajaxData.append( 'format_3d', source.format3D );
            ajaxData.append( 'duration', source.duration );
            ajaxData.append( 'mediahash', source.hash );
            ajaxData.append( 'cmd', 'upload' );
            var xhr = null;
            var adat = {
                url: options.action,
                type: options.method,
                data: ajaxData,
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false,
                complete: function() {
                    oncomplete(file, success);
                },
                success: function(data) {
                    console.log('upload success data', data);
                    success = data.success == true;
                    if (!success) err = data.error;
                },
                error: function(e) {
                    err = 'Uploading error';
                }
            };
            if (window.XMLHttpRequest){
                adat.xhr = function(){ 
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded * 100 / evt.total;
                            //console.log('upload progress', percentComplete);
                            if (up_progress) up_progress(percentComplete);
                        }
                    }, false);
                    xhr.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded * 100 / evt.total;
                            console.log('download progress', percentComplete);
                            if (down_progress) down_progress(percentComplete);
                        }
                    }, false);
                    return xhr;
                }
            }
            $.ajax(adat);
        } else {
            console.log('!! unsupported browser !!');
        }
    }
    function checkFile(source, oncomplete, up_progress, down_progress){
        var file = source.file;
        var existing_mediainfo = false;
        var err = '';
        if (isAdvancedUpload) {
            // ajax for modern browsers
            var ajaxData = new FormData();
            ajaxData.append( 'mediahash', source.hash );
            ajaxData.append( 'cmd', 'existscheck' );
            var xhr = null;
            var adat = {
                url: options.action,
                type: options.method,
                data: ajaxData,
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false,
                complete: function() {
                    oncomplete(file, existing_mediainfo);
                },
                success: function(data) {
                    console.log('check data', data);
                    existing_mediainfo = data;
                    if (data.error) err = data.error;
                },
                error: function(e) {
                    // Log the error, show an alert, whatever works for you
                    err = 'Exists check error';
                }
            };
            if (window.XMLHttpRequest){
                adat.xhr = function(){ 
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded * 100 / evt.total;
                            //Do something with upload progress here
                            console.log('upload progress', percentComplete);
                            if (up_progress) up_progress(percentComplete);
                        }
                    }, false);
                    xhr.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded * 100 / evt.total;
                            //Do something with download progress
                            console.log('download progress', percentComplete);
                            if (down_progress) down_progress(percentComplete);
                        }
                    }, false);
                    return xhr;
                }
            }
            $.ajax(adat);
        } else {
            console.log('!! unsupported browser !!');
        }
    }
    function checkNextQeueued(){
        if ($queue.find('[queue-state="checking"]').length) return;
        var $q = $queue.find('[queue-state="checkqueue"]').first();
        if ($q.length){
            var si = $q.attr('queue-index') * 1;
            var source = sources[si];
            var file = source.file;
            $q.attr('queue-state', 'checking');
            checkFile(
                source, 
                function(f, existing_mediainfo){
                    // oncomplete
                    if (existing_mediainfo && existing_mediainfo.exists){
                        $q.attr('queue-state', 'uploaded');
                        $q.find('.rendusa_upload_item_upload_button').val('Exists');
                        source.format3D = existing_mediainfo.format3D;
                        $q.find('.rendusa_upload_format_3d').val(source.format3D).change().attr('disabled','disabled');
                        //$q.find('.rendusa_upload_format_3d').attr('disabled', 'disabled');
                    }
                    else 
                    {
                        $q.attr('queue-state', 'ready');
                        $q.find('.rendusa_upload_item_upload_button').val('Upload');
                    }
                    $q.removeClass('rendusa_upload_busy_item');
                    validateEntry($q);
                    busyCheck();
                    checkNextQeueued();
                }, 
                function(perc){
                    // up 
                    source.setProgress(perc * 0.5);
                }, 
                function(perc){
                    // down 
                    source.setProgress(0.5 + (perc / 2));
                }
            );
        } else {
            console.log('All files hashed and checked');
        }
    }
    function hashNextQeueued(){
        if ($queue.find('[queue-state="hashing"]').length) return;
        var $q = $queue.find('[queue-state="hashqueue"]').first();
        if ($q.length){
            busyCheck();
            var si = $q.attr('queue-index') * 1;
            var source = sources[si];
            var file = source.file;
            $q.attr('queue-state', 'hashing');
            $q.find('.rendusa_upload_item_upload_button').val('Hashing');
            source.setProgress(0);
            hashFile(
                file, 
                function(f, hash){
                    // oncomplete
                    $q.attr('queue-state', 'checkqueue');
                    $q.find('.rendusa_upload_item_upload_button').val('Checking');
                    $q.attr('hash', hash);
                    source.hash = hash;
                    checkNextQeueued();
                    hashNextQeueued();
                },
                function(perc){
                    // onprogress
                    source.setProgress(perc);
                }
            );
        } else {
            console.log('All files hashed');
        }
    }
    function hashFile(file, oncomplete, onprogress){
        console.info('hashing', file.name);  // Compute hash
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunkSize = 2097152,                             // Read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();
        fileReader.onload = function (e) {
            var perc = Math.round((currentChunk + 1) * 100 / chunks);
            if (onprogress) onprogress(perc, currentChunk + 1, chunks);
            spark.append(e.target.result);                   // Append array buffer
            currentChunk++;
            if (currentChunk < chunks) {
                setTimeout(loadNext, 0);
            } else {
                var hash = spark.end() + '-' + file.size;
                console.info('hashed', file.name, hash);  // Compute hash
                oncomplete(file, hash);
            }
        };
        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };
        function loadNext() {
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }
        setTimeout(loadNext, 0);
    }

    if (isAdvancedUpload){

        // prevent files not dropped on our drop zone but dropped in the browser window from being opened by the browser
        window.addEventListener("dragover", function(e){
            e = e || event;
            e.preventDefault();
        }, false);
        window.addEventListener("drop", function(e){
            e = e || event;
            e.preventDefault();
        }, false);

        $('body').addClass('supports_advanced_uploads');

        $target.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('dragover dragenter', function() {
            $(this).addClass('is-dragover').css({'border': '2px solid red'});
        })
        .on('dragleave dragend drop', function() {
            $(this).removeClass('is-dragover').css({'border': ''});
        })
        .on('drop', function(e) {
            var droppedFiles = e.originalEvent.dataTransfer.files;
            loadFiles(droppedFiles);
        });
    }

    $form.on('submit', function(e) {
        if (true) return false;
        e.preventDefault();
    });
    $file_input.on('change', function () {
        // alternative to drag and drop
        loadFiles(this.files);
    });

}

var rendusa_uploader = new RendusaUploader({
    target: '#rendusa_upload_container',
    //action: '?q=rendusa/media/upload/',
    //method: 'post',
    xdata: 45,
});
window.rendusa_uploader = rendusa_uploader;

});

