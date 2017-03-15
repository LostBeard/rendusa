uniform sampler2D viewTexArray[2];
uniform float brightness;
uniform float contrast;			
uniform int outFormat;

varying vec2 vUv;

void main() {
      vec4 colorM;
      vec2 uv = vUv;
      if (outFormat == 0) {
            // Copy from tex 0 only
            gl_FragColor = texture2D( viewTexArray[0], uv );
      } else if (outFormat == 1) {
            // Side By Side
            if (uv.x < 0.5) {
                  uv.x = uv.x * 2.0;
                  gl_FragColor = texture2D( viewTexArray[0], uv );
            } else {
                  uv.x = (uv.x - 0.5) * 2.0;
                  gl_FragColor = texture2D( viewTexArray[1], uv );
            }
      } else if (outFormat == 2) {
            // Over Under
            if (uv.y < 0.5) {
                  uv.y = uv.y * 2.0;
                  gl_FragColor = texture2D( viewTexArray[1], uv );
            } else {
                  uv.y = (uv.y - 0.5) * 2.0;
                  gl_FragColor = texture2D( viewTexArray[0], uv );
            }
      }
}