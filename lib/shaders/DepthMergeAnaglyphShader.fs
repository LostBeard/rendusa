uniform sampler2D viewTexArray[2];
uniform float brightness;
uniform float saturation;			
uniform int outFormat;
uniform float redMixer[6];
uniform float greenMixer[6];
uniform float blueMixer[6];
varying vec2 vUv;

vec4 dubois(vec4 l, vec4 r) {
	// http://www.site.uottawa.ca/~edubois/anaglyph/LeastSquaresHowToPhotoshop.pdf
	float red   = l.r* 0.437 + l.g* 0.449 + l.b* 0.164 + r.r*-0.011 + r.g*-0.032 + r.b*-0.007;
	float green = l.r*-0.062 + l.g*-0.062 + l.b*-0.024 + r.r* 0.377 + r.g* 0.761 + r.b* 0.009;
	float blue  = l.r*-0.048 + l.g*-0.050 + l.b*-0.017 + r.r*-0.026 + r.g*-0.093 + r.b* 1.234;
	return vec4(red, green, blue, 1.0);
}

vec4 anaglyph_tt2(vec4 l, vec4 r) {
      float red   = l.r* 0.299 + l.g* 0.587 + l.b* 0.114;
	float green = l.r*-0.062 + l.g*-0.062 + l.b*-0.024 + r.r* 0.377 + r.g* 0.761 + r.b* 0.009;
	float blue  = l.r*-0.048 + l.g*-0.050 + l.b*-0.017 + r.r*-0.026 + r.g*-0.093 + r.b* 1.234;
	return vec4(red, green, blue, 1.0);
}
vec4 anaglyph_tt(vec4 l, vec4 r) {
      float red   = l.r* 0.299 + l.g* 0.587 + l.b* 0.114;
	float green = l.r*-0.262 + l.g*-0.062 + l.b*-0.024 + r.r* 0.377 + r.g* 0.761 + r.b* 0.009;
	float blue  = l.r*-0.048 + l.g*-0.050 + l.b*-0.017 + r.r*-0.026 + r.g*-0.093 + r.b* 1.234;
	return vec4(red, green, blue, 1.0);
}

void main() {
      vec2 uv = vUv;
      vec4 l = texture2D( viewTexArray[0], uv );
      vec4 r = texture2D( viewTexArray[1], uv );
      float red   = l.r * redMixer[0]     + l.g * redMixer[1]     + l.b * redMixer[2]     + r.r * redMixer[3]     + r.g * redMixer[4]     + r.b * redMixer[5];
	float green = l.r * greenMixer[0]   + l.g * greenMixer[1]   + l.b * greenMixer[2]   + r.r * greenMixer[3]   + r.g * greenMixer[4]   + r.b * greenMixer[5];
	float blue  = l.r * blueMixer[0]    + l.g * blueMixer[1]    + l.b * blueMixer[2]    + r.r * blueMixer[3]    + r.g * blueMixer[4]    + r.b * blueMixer[5];
      gl_FragColor = vec4(red, green, blue, 1.0) * brightness;
}