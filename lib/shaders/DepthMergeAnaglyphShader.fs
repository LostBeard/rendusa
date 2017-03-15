uniform sampler2D viewTexArray[2];
uniform float brightness;
uniform float contrast;	
uniform float redMixer[6];
uniform float greenMixer[6];
uniform float blueMixer[6];
varying vec2 vUv;

void main() {
      vec2 uv = vUv;
      float gammaRGB = 2.2;
      vec4 l = texture2D( viewTexArray[0], uv );
      vec4 r = texture2D( viewTexArray[1], uv );
      // gamma correction
      l.r = pow(l.r, 1.0 / gammaRGB);
      l.g = pow(l.g, 1.0 / gammaRGB);
      l.b = pow(l.b, 1.0 / gammaRGB);
      r.r = pow(r.r, 1.0 / gammaRGB);
      r.g = pow(r.g, 1.0 / gammaRGB);
      r.b = pow(r.b, 1.0 / gammaRGB);
      //r.rgb = pow(r.rgb, 1.0 / gammaRGB);
      //
      float red   = l.r * redMixer[0]     + l.g * redMixer[1]     + l.b * redMixer[2]     + r.r * redMixer[3]     + r.g * redMixer[4]     + r.b * redMixer[5];
	float green = l.r * greenMixer[0]   + l.g * greenMixer[1]   + l.b * greenMixer[2]   + r.r * greenMixer[3]   + r.g * greenMixer[4]   + r.b * greenMixer[5];
	float blue  = l.r * blueMixer[0]    + l.g * blueMixer[1]    + l.b * blueMixer[2]    + r.r * blueMixer[3]    + r.g * blueMixer[4]    + r.b * blueMixer[5];
	vec4 o = vec4(red, green, blue, 1.0);
	o.rgb = (o.rgb - 0.5) * (contrast + 1.0) + 0.5;  
      o.rgb = o.rgb + brightness;
      // gamma correction
      o.r = pow(o.r, gammaRGB);
      o.g = pow(o.g, gammaRGB);
      o.b = pow(o.b, gammaRGB);
      //
      gl_FragColor = o;
}