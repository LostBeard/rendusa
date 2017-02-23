uniform sampler2D tDiffuse;
uniform float width;
uniform float height;
varying vec2 vUv;
float headerGetByteVal(float headerByteIndex, float hy){
    float fval = 0.0;
    float bmin = 0.5;
    float xoffset = headerByteIndex * 16.0 + 0.5;
    if (texture2D( tDiffuse, vec2( xoffset / width, hy ) ).b > bmin) fval += 128.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 2.0) / width, hy ) ).b > bmin) fval += 64.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 4.0) / width, hy ) ).b > bmin) fval += 32.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 6.0) / width, hy ) ).b > bmin) fval += 16.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 8.0) / width, hy ) ).b > bmin) fval += 8.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 10.0) / width, hy ) ).b > bmin) fval += 4.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 12.0) / width, hy ) ).b > bmin) fval += 2.0;
    if (texture2D( tDiffuse, vec2( (xoffset + 14.0) / width, hy ) ).b > bmin) fval += 1.0;
    return fval;
}
void main() {
    float bhval = 0.0;
    float hy = (height - 0.5) / height;
    vec2 vu = vec2(gl_FragCoord.x / width, hy);
    if (gl_FragCoord.y == 0.5) {
        // bottom row
        if (gl_FragCoord.x == 1.5) {
            // 1, 0 byte value should be 241
            bhval = headerGetByteVal(0.0, hy) == 241.0 ? 1.0 : 0.0;
            gl_FragColor = vec4( bhval, bhval, bhval, 1.0 );
        } else if (gl_FragCoord.x == 3.5) {
            // 3, 0 content type
            bhval = headerGetByteVal(1.0, hy) / 255.0;
            gl_FragColor = vec4( bhval, bhval, bhval, 1.0 );
        } else if (gl_FragCoord.x == 5.5) {
            // 5, 0 factor
            bhval = headerGetByteVal(2.0, hy) / 255.0;
            gl_FragColor = vec4( bhval, bhval, bhval, 1.0 );
        } else if (gl_FragCoord.x == 7.5) {
            // 7, 0 offset
            bhval = headerGetByteVal(3.0, hy) / 255.0;
            gl_FragColor = vec4( bhval, bhval, bhval, 1.0 );
        } else {
            // rest of top row. pass along
            gl_FragColor = texture2D( tDiffuse, vu );
            float b = gl_FragColor.b >= 0.5 ? 1.0 : 0.0;
            gl_FragColor = vec4(b, b, b, 1.0);
            //gl_FragColor = vec4(b, 0.0, 0.0, 1.0);
        }
    } else {
        // rest of image
        gl_FragColor = texture2D( tDiffuse, vu );
    }
}