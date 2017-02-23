uniform sampler2D viewTexArray[3];
uniform float width;
uniform float height;
varying vec2 vUv;

void main() {
      vec4 o;
      vec2 uv = vUv;
      float hy = (height - 0.6) / height; // < take out of shader in precalc once per frame instead of per frag
      if (uv.y >= hy && gl_FragCoord.x < 512.0)
      {
            uv = vec2(gl_FragCoord.x / 512.0, 0.5);
            o = texture2D( viewTexArray[2], uv );
            //o = vec4(1.0, 0.0, 0.0, 1.0);
      } else if (uv.x < 0.5) {
            uv.x = uv.x * 2.0;
            o = texture2D( viewTexArray[0], uv );
      } else {
            uv.x = (uv.x - 0.5) * 2.0;
            o = texture2D( viewTexArray[1], uv );
      }
      gl_FragColor = o;
}