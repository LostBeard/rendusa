
// TODO
// need to add requestAnimationFrame fallbacks.
// currently uses jQuery. Not really needed could remove dependency with little modification.

$(document).on('ShaderLoaderComplete', function(){
	window.rendusa = new THREE.Rendusa({ 
		sources: [
			{
				url: 'test/media/TheForest_1.mp4',
				format3D: '2DZ',
			},
			{
				url: 'test/media/2dzforest1.png',
				format3D: '2DZ',
			},
			{
				url: 'test/media/fallout.mp4',
				format3D: '2DZ',
			},
			{
				url: 'test/media/sbs_stereograph-lg.jpg',
			},
		], 
		target: $('#main'),
		stats: false,
		autoplay: true,
	});
	window.rendusa.source.muted = true;
	var headtrackr_fnd = false;
	// $('canvas').click(function(){
	// 	rendusa.formatNext();
	// });
	var midir = 0.3;
	window.MoveIt = function(){
		var max =  4.00;
		var min = -4.00;
		var cur = rendusa.renderers.Perspective.sepScale;
		if (cur + midir > max || cur + midir < min){
			midir = -midir;
		} else {
			cur = cur + midir;
			//renderers.Stereo.sepScale = cur;
			//renderers.Anaglyph.sepScale = cur;
			rendusa.renderers.Perspective.sepScale = cur;
			//console.log(cur);
		}
	}


});