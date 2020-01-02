var MODULE = (function (app) {

    app.get_terrainMaterial = function () {
        var material = new THREE.RawShaderMaterial({
            side: THREE.FrontSide,
            fog: true,
            uniforms: THREE.UniformsUtils.merge([

                THREE.UniformsLib["envmap"],
                THREE.UniformsLib["fog"],
                {
                    "shift": { value: new THREE.Vector2() },
                    "worldRotation": { value: 0.0 },
                    "colorMap": { value: new THREE.TextureLoader() },
                    "heightMap": { value: new THREE.TextureLoader() }
                },
            ]),
            vertexShader: [
                `
                precision highp float;
                attribute vec3 position;
                attribute vec3 normal;
                attribute vec2 uv;
                attribute vec2 uv2;
                uniform vec3 cameraPosition;
                uniform mat4 modelMatrix;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform mat4 viewMatrix;
                uniform vec2 shift;
                uniform float worldRotation;
                uniform sampler2D heightMap;
                varying vec2 vUv;
                varying vec3 vReflect;
                varying float fogDepth;
                
                mat2 rotate2d(float angle){
                  return mat2(cos(angle),-sin(angle),
                     sin(angle),cos(angle));
                }
                void main() {
                  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                  vec3 cameraToVertex;
                  cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
                  vec3 worldNormal = normalize ( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
                  vReflect = reflect( cameraToVertex, worldNormal );
                  vec2 rotatedUV = uv - vec2(0.5); //move rotation center to center of object
                  rotatedUV = rotate2d(worldRotation) * rotatedUV;
                  rotatedUV += shift; // movement uv shift
                  rotatedUV += vec2(0.5); // move uv back to origin
                  vUv = rotatedUV;
                  float heightTex = texture2D(heightMap,vUv).x;
                  vec3 displacedPosition = vec3(position.x,heightTex,position.z);
                  vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );
                  gl_Position = projectionMatrix * mvPosition;
                  fogDepth = -mvPosition.z;
                }
                `,
            ].join("\n"),
            fragmentShader: [
                `
                precision highp float;
                uniform sampler2D colorMap;
                uniform sampler2D heightMap;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                varying vec2 vUv;
                uniform samplerCube envMap;
                varying vec3 vReflect;
                varying float fogDepth;
                void main( void ) {
                  vec3 reflectVec = vReflect;
                  vec4 envColor = textureCube( envMap, reflectVec );
                  vec3 color = texture2D(colorMap,vUv).xyz;
                  float envMask = texture2D(heightMap,vUv).y;
                  vec3 finalColor = color + envColor.xyz * vec3(envMask * 0.7);
                  gl_FragColor = vec4( finalColor, 1.0 );
                  float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
                  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
                }
                `
            ].join("\n")
        });

        return material;
    }

    return app;
}(MODULE));