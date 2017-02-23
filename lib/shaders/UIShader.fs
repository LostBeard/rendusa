uniform sampler2D mapIn;	
varying vec2 vUv;

void main() {
      vec4 o = texture2D( mapIn, vUv );
    //   if (o.a < 0.5) {
    //       discard;
    //   }
    //   else
    //   {
    //       gl_FragColor = vec4(o.a, o.a, o.a, 1.0);
    //   }
      gl_FragColor = o;
}
