uniform sampler2D mapIn;
uniform sampler2D mapOverlay;
uniform sampler2D mapHeader;
uniform int blend;
uniform float maskColor;

varying vec2 vUv;

void main() {
      vec4 o = texture2D( mapIn, vUv );
      if (blend == 0){
            gl_FragColor = o;
      }
      else if (blend == 1)
      {
            // alpha blend
            vec4 o2 = texture2D( mapOverlay, vUv );
            o = o - ((o - o2) * o2.a);
            o.a = 1.0;
            gl_FragColor = o;
      }
      else if (blend == 2)
      {
            float validif1    = texture2D( mapHeader, vec2(1.5 / 512.0, 0.5) ).b;
            float content     = texture2D( mapHeader, vec2(3.5 / 512.0, 0.5) ).b;
            float factor_f    = texture2D( mapHeader, vec2(5.5 / 512.0, 0.5) ).b;
            float offset_f    = texture2D( mapHeader, vec2(7.5 / 512.0, 0.5) ).b;
            // draw a mask of the overlay oonto mapin
            vec4 o2 = texture2D( mapOverlay, vUv );
            if (o2.a > 0.0){
                  //o = vec4(maskColor, maskColor, maskColor, 1.0);
                  o = vec4(offset_f, offset_f, offset_f, 1.0);
            }
            o.a = 1.0;
            gl_FragColor = o;
      }
}