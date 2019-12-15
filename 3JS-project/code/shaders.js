var MODULE = (function (app) {

    app.get_terrainMaterial = function () {
        var material = new THREE.ShaderMaterial({
            side: THREE.FrontSide,
            fog: true,
            uniforms: THREE.UniformsUtils.merge([

                THREE.UniformsLib["fog"],
                {
                    "shift": { value: new THREE.Vector2() },
                    "worldRotation": { value: 0.0 },
                    "colorMap": { value: new THREE.TextureLoader() },
                    "heightMap": { value: new THREE.TextureLoader() }
                },
            ]),
            vertexShader: [
                THREE.ShaderChunk["fog_pars_vertex"],
                "uniform vec2 shift;",
                "uniform float worldRotation;",
                "uniform sampler2D heightMap;",
                "varying vec2 vUv;",
                "mat2 rotate2d(float angle){",
                "  return mat2(cos(angle),-sin(angle),",
                "     sin(angle),cos(angle));",
                "}",
                "void main() {",
                "  vec2 rotatedUV = uv - vec2(0.5); //move rotation center to center of object",
                "  rotatedUV = rotate2d(worldRotation) * rotatedUV;",
                "  rotatedUV += shift; // movement uv shift",
                "  rotatedUV += vec2(0.5); // move uv back to origin",
                "  vUv = rotatedUV;",
                "  float heightTex = texture2D(heightMap,vUv).x;",
                "  vec3 displacedPosition = vec3(position.x,heightTex,position.z);",
                "  vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );",
                "  gl_Position = projectionMatrix * mvPosition;",
                THREE.ShaderChunk["fog_vertex"],
                "}",
            ].join("\n"),
            fragmentShader: [
                THREE.ShaderChunk["fog_pars_fragment"],
                "uniform sampler2D colorMap;",
                "uniform sampler2D heightMap;",
                "varying vec2 vUv;",
                "void main( void ) {",
                "  vec3 color = texture2D(colorMap,vUv).xyz;",
                "  vec3 finalColor = color;",
                "  gl_FragColor = vec4( finalColor, 1.0 );",
                THREE.ShaderChunk["fog_fragment"],
                "}"
            ].join("\n")
        });

        return material;
    }

    return app;
}(MODULE));