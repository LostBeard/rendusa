uniform sampler2D mapLeft;
uniform sampler2D mapRight;
uniform sampler2D mapHeader;
uniform float sepMax;
uniform float spaceX;
uniform float spaceXHalf;
varying vec2 vUv;

#define LOOPCNT 24

void main()
{
	float validif1 = texture2D( mapHeader, vec2(1.5 / 512.0, 0.5) ).b;
	float content = texture2D( mapHeader, vec2(3.5 / 512.0, 0.5) ).b;
	float factor_f = texture2D( mapHeader, vec2(5.5 / 512.0, 0.5) ).b;
	float offset_f  = texture2D( mapHeader, vec2(7.5 / 512.0, 0.5) ).b;
	vec4 o = vec4(0.0, 0.0, 0.0, 0.0);
	vec4 pDepth;
	vec2 uv = vUv;
	vec2 uvNext = vUv;
	float diff_x = 0.0;
	float cur_depth = -1.0;
	float dest_x = 0.0; 
	float sep_max = sepMax * factor_f;
	float cur_coord_x = -1.0;
	float shiftMode = sep_max < 0.0 ? -1.0 : 1.0;
	if (abs(sep_max) < spaceX)
	{
		o = texture2D( mapLeft, uv );
		o.a = 1.0;
	}
	else
	{
		uvNext.x += spaceX * 2.0 * shiftMode;
		uvNext.x += sep_max * ( 1.0 - offset_f );
		for (int n = 0; n < LOOPCNT; n++)
		{
			uvNext.x -= spaceX * shiftMode;
			pDepth = texture2D( mapRight, uvNext );
			dest_x = uvNext.x + ( sep_max * ( offset_f - pDepth.r ) );
			diff_x = uv.x - dest_x;
			if ( diff_x >= -spaceXHalf && diff_x < spaceXHalf && cur_depth < pDepth.r )
			{
				cur_depth = pDepth.r;
				cur_coord_x = uvNext.x;
			}
		}
		if (cur_coord_x > -1.0){
			if (cur_depth == 0.0) cur_depth = 0.003921568627451;	// 1/255
			o = texture2D( mapLeft, vec2(cur_coord_x, uvNext.y) );
			o.a = cur_depth;	// store this pixels depth in the alpha channel
		}
	}
	gl_FragColor = o;
}
