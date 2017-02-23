uniform sampler2D mapIn;	
uniform sampler2D mapHeader;
uniform float spaceX;
uniform float sepMax;
varying vec2 vUv;

#define LOOPCNT 24

void main() {
	float validif1 = texture2D( mapHeader, vec2(1.5 / 512.0, 0.5) ).b;
	float content = texture2D( mapHeader, vec2(3.5 / 512.0, 0.5) ).b;
	float factor_f = texture2D( mapHeader, vec2(5.5 / 512.0, 0.5) ).b;
	float offset_f  = texture2D( mapHeader, vec2(7.5 / 512.0, 0.5) ).b;
	// float factor_f = rC0[1];
	// float sep_max_x = rC0[2];
	// float extra_shift_x = rC0[3];
	// float spaceX = rC4[0];
	// float pixel_width_half = rC4[1];
    float sep_max = sepMax * factor_f;
	float diff_x = 0.0;
	vec4 cNext;
	float cur_diff;
	vec2 uv = vUv;
	vec2 uvNext = vUv;
	vec4 o = texture2D( mapIn, uv );
	float lDepth = 1.0;
	float rDepth = 1.0;
	vec4 lColor = vec4(1.0, 0.0, 0.0, 0.0);
	vec4 rColor = vec4(1.0, 0.0, 0.0, 0.0);
	float lDiff = 1.0;
	float rDiff = 1.0;
	float shiftMode = sep_max < 0.0 ? -1.0 : 1.0;
	if (o.a == 0.0)
	{
		//uvNext.x -= spaceX * 2.0 * shiftMode;
		uvNext.x -= sep_max * ( 1.0 - offset_f );
		for (int n = 0; n < LOOPCNT; n++)
		{
			uvNext.x += spaceX * shiftMode;
			cNext = texture2D( mapIn, uvNext );
			// cNext.a = is the pixel depth
			diff_x = abs(uv.x - uvNext.x);
			if (uv.x > uvNext.x && cNext.a > 0.0 && lDiff > diff_x)
			{
				// to the left of this pixel
				lColor = cNext;
				lDepth = cNext.a;
				lDiff = diff_x;
			}
			if (uv.x < uvNext.x && cNext.a > 0.0 && rDiff > diff_x)
			{
				// to the right of this pixel
				rColor = cNext;
				rDepth = cNext.a;
				rDiff = diff_x;
			}
		}
		// use farthest away pixel that is valid
		if (lColor.a > 0.0 && lColor.a < rColor.a) {
			// going to use pixel to left
			o = lColor;
		} else {
			// going to use pixel to right. could still be initial value of 0 but should not be
			o = rColor;
		}
		// if (o.a == 0.0){
		// 	o = vec4(1.0, 0.0, 0.0, 1.0);
		// }
		o.a = 1.0;
		//o = vec4(1.0, 0.0, 0.0, 1.0);
	} 
	// else 
	// {
	// 	o *= 0.1;
	// }
	gl_FragColor = o;
}