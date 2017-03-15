uniform sampler2D viewTexArray[9];
uniform sampler2D interleaverTex;
uniform vec2 pattern_size;
uniform vec2 interleaverTex_size;

varying vec2 vUv;

vec4 getViewColor(vec2 uv, float imgIndexNorm){
    int imgIndex = int(255.0 * imgIndexNorm);
    vec4 ret = vec4(0.0, 0.0, 0.0, 1.0);
    if (imgIndex == 0){
        ret = texture2D( viewTexArray[0], uv );
    } else if (imgIndex == 1){
        ret = texture2D( viewTexArray[1], uv );
    } else if (imgIndex == 2){
        ret = texture2D( viewTexArray[2], uv );
    } else if (imgIndex == 3){
        ret = texture2D( viewTexArray[3], uv );
    } else if (imgIndex == 4){
        ret = texture2D( viewTexArray[4], uv );
    } else if (imgIndex == 5){
        ret = texture2D( viewTexArray[5], uv );
    } else if (imgIndex == 6){
        ret = texture2D( viewTexArray[6], uv );
    } else if (imgIndex == 7){
        ret = texture2D( viewTexArray[7], uv );
    } else if (imgIndex == 8){
        ret = texture2D( viewTexArray[8], uv );
    }
    return ret;
}

void main() {
	vec2 PatternTexCoord = vec2( (mod(gl_FragCoord.x, pattern_size.x) + 0.5) / interleaverTex_size.x, (mod(gl_FragCoord.y, pattern_size.y) + 0.5) / interleaverTex_size.y);
	vec4 color = texture2D(interleaverTex, PatternTexCoord);
    float r = getViewColor(vUv, color.r).r;
    float g = getViewColor(vUv, color.g).g;
    float b = getViewColor(vUv, color.b).b;
    // r = color.r;
    // g = color.g;
    // b = color.b;
    gl_FragColor = vec4(r, g, b, 1.0);
}