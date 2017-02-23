uniform sampler2D viewTexArray[9];
varying vec2 vUv;

void main() {
    vec2 uv = vUv * 3.0;
    int imgIndex = int(ceil(uv.x) * ceil(uv.y) - 1.0);
    uv.x -= floor(uv.x);
    uv.y -= floor(uv.y);
    if (imgIndex == 0){
        gl_FragColor = texture2D( viewTexArray[0], uv );
    } else if (imgIndex == 1){
        gl_FragColor = texture2D( viewTexArray[1], uv );
    } else if (imgIndex == 2){
        gl_FragColor = texture2D( viewTexArray[2], uv );
    } else if (imgIndex == 3){
        gl_FragColor = texture2D( viewTexArray[3], uv );
    } else if (imgIndex == 4){
        gl_FragColor = texture2D( viewTexArray[4], uv );
    } else if (imgIndex == 5){
        gl_FragColor = texture2D( viewTexArray[5], uv );
    } else if (imgIndex == 6){
        gl_FragColor = texture2D( viewTexArray[6], uv );
    } else if (imgIndex == 7){
        gl_FragColor = texture2D( viewTexArray[7], uv );
    } else if (imgIndex == 8){
        gl_FragColor = texture2D( viewTexArray[8], uv );
    }
}