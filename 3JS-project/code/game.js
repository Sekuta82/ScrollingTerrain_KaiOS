var MODULE = (function (app) {
    app.pi = Math.PI;

    // ======== CONFIG ========
    const isDebugMode = false;
    const isDoubleSize = false;

    var screenWidth = isDoubleSize ? 480 : 240;
    var screenHeight = isDoubleSize ? 640 : 320;

    var debugHUD = document.getElementById("debugHUD");

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(90, screenWidth / screenHeight, 0.1, app.terrain_scaleFactor * 50);
    var player = new THREE.Group();
    var player_startPosition = new THREE.Vector3();

    var terrainObject = {};

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(screenWidth, screenHeight);
    renderer.antialiasing = false;

    const clock = new THREE.Clock(true);

    const raycaster = new THREE.Raycaster();
    var raycastTargets = [];

    var gameRunning = false;

    // set background
    var backgroundColor = new THREE.Color(0xfefadd);
    scene.background = backgroundColor;
    const fog_color = backgroundColor;
    scene.fog = app.get_fog(fog_color, 10, app.terrain_scaleFactor * 50);

    // GLTF list
    const gltf_files = {
        'terrain_ground': 'assets/terrain/terrain_ground.glb'
    }

    // ======== GLTF loading ========
    const gltf_loader = new THREE.GLTFLoader();
    gltf_loader.crossOrigin = true;

    var fileIndex = 0;
    function load_gltf() {
        if (fileIndex > Object.keys(gltf_files).length - 1) {
            // all files done
            scene_start();
            return;
        }
        var key = Object.keys(gltf_files)[fileIndex]; // get key by index
        gltf_loader.load(gltf_files[key], function (gltf) {
            app.gltf_scenes[key] = (gltf.scene); // add to scenes dict
            fileIndex++;
            get_objects(key); // do something after loading
            load_gltf(); // load next file
        });
    }
    load_gltf();

    function get_objects(name) {
        switch (name) {
            case 'terrain_ground': terrainObject = app.get_terrain(); break;
        }
    }

    // ======== START ========
    function scene_start() {
        scene_setup();
        document.body.appendChild(renderer.domElement);
        gameRunning = true;
    }

    function scene_setup() {
        // terrain
        terrainObject.mesh.position.z = terrainObject.rayMesh.position.z = -1.0;
        scene.add(terrainObject.object);
        if (isDebugMode) terrainObject.material.wireframe = true;
        raycastTargets.push(terrainObject.rayMesh); // add to raycast targets; don't cast rays to the hi-res terrain mesh!

        // create player
        player_startPosition.set(0, 50, 0);
        player.add(app.get_player(3, 0x00cccc));
        player.position.add(player_startPosition);
        player.add(camera);
        scene.add(player);

        camera.position.set(0, 10, -20);
    }

    // ======== ANIMATE ========
    var deltaTime = 0;
    const forwardSpeed = 50.0;
    var verticalMovement = 0.0, verticalMovement_velocity = 0.0;
    var player_worldPosition = new THREE.Vector3();
    var movingDirection = new THREE.Vector3(0, 0, 0);
    var player_rotation = 0.0;
    var player_rotation_velocity = 0.0;
    var local_rotation_vector = new THREE.Vector3();
    var local_rotation_velocity = new THREE.Vector3();
    const local_rotation_vector_clamp_left = new THREE.Vector3(-0.5, -0.5, -0.5);
    const local_rotation_vector_clamp_right = new THREE.Vector3(0.5, 0.5, 0.5);

    const terrain_scale = 1 / (100 * app.terrain_scaleFactor);
    const downVector = new THREE.Vector3(0, -1, 0);
    var terrainShift = new THREE.Vector2(0, 0);
    var terrain_ray_origin = new THREE.Vector3(0.0, 0.0, 0.0);
    var terrain_hitPoint = {};
    var direction = new THREE.Vector3();

    // animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (!gameRunning) return;

        deltaTime = clock.getDelta();
        getFPS(deltaTime);
        deltaTime = Math.min(deltaTime, 0.1); // avoid extreme acceleration during frame drops

        // fly forward
        moveForward(player, forwardSpeed);

        // flight controls
        direction.y = Number(app.moveDown) - Number(app.moveUp);
        direction.x = Number(app.moveRight) - Number(app.moveLeft);
        direction.normalize();

        if (app.moveLeft || app.moveRight) {
            player_rotation -= direction.x * 2.0 * deltaTime;
            local_rotation_vector.y -= direction.x * 5.0 * deltaTime;
        } else {
            local_rotation_vector.y = 0.0;
        }
        if (app.moveUp || app.moveDown) {
            verticalMovement = direction.y * 50.0 * deltaTime;
            local_rotation_vector.x -= direction.y * 5.0 * deltaTime;
        } else {
            verticalMovement = 0;
            local_rotation_vector.x = 0.0;
        }
        verticalMovement_velocity = THREE.Math.lerp(verticalMovement_velocity, verticalMovement, deltaTime * 0.5);
        local_rotation_vector.clamp(local_rotation_vector_clamp_left, local_rotation_vector_clamp_right);

        player_rotation_velocity = THREE.Math.lerp(player_rotation_velocity, player_rotation, deltaTime * 0.5);
        player.rotation.y = player_rotation_velocity;

        local_rotation_velocity.lerp(local_rotation_vector, deltaTime * 0.5);
        camera.rotation.set(-local_rotation_velocity.x * 0.3 + 0.3, app.pi, -local_rotation_velocity.y * 0.5, 'XYZ');

        // animate terrain
        player.getWorldPosition(player_worldPosition);
        terrainObject.object.position.set(player_worldPosition.x, -app.terrain_height, player_worldPosition.z);
        terrainObject.object.rotation.y = player.rotation.y;
        terrainShift.set(-player_worldPosition.x * terrain_scale, player_worldPosition.z * terrain_scale);
        terrainObject.material.uniforms.shift.value = terrainShift;
        terrainObject.material.uniforms.worldRotation.value = -terrainObject.object.rotation.y;

        // detect collisions with terrain
        terrain_ray_origin.set(player_worldPosition.x, 10, player_worldPosition.z);
        terrain_hitPoint = raycast2terrain(terrain_ray_origin, downVector);
        if (terrain_hitPoint.position.y >= player_worldPosition.y - 3) {
            player.position.y = terrain_hitPoint.position.y + 3;
            local_rotation_vector.x = 0.0;
        }

        renderer.render(scene, camera);
    }
    animate();

    function moveForward(object, distance) {
        movingDirection.setFromMatrixColumn(object.matrix, 0);
        movingDirection.crossVectors(object.up, movingDirection);
        movingDirection.y = verticalMovement_velocity;
        object.position.addScaledVector(movingDirection, -distance * deltaTime);
    };

    // ======== RAYCAST ========
    var ray_hitPoint = new THREE.Vector3(0.0, 0.0, 0.0);
    var intersects = [];
    var intersect_uv = {};
    var terrain = {};

    function raycast2terrain(origin, direction) {
        if (raycastTargets.length == 0) return;
        raycaster.set(origin, direction);
        intersects = raycaster.intersectObjects(raycastTargets, false);
        if (intersects.length > 0) {
            for (let i = 0; i < intersects.length; i++) {

                if (intersects[i].object.name == 'terrain_raytarget') {
                    intersect_uv = intersects[i].uv;
                    terrain = get_terrain_height(intersect_uv);
                    ray_hitPoint.set(intersects[i].point.x, terrain.height, intersects[i].point.z);
                    return { position: ray_hitPoint };
                }
            }
        }
    }

    var transformedUV = new THREE.Vector2(0.0, 0.0);;
    var pixelCoord = [0, 0];
    var pixel = [0, 0, 0];
    var terrain_height = 0.0;

    function get_terrain_height(uv) {
        transformedUV.copy(transform_UVs(uv, terrainShift, -terrainObject.object.rotation.y));
        if (terrainObject.heightMap.image) {
            pixelCoord = [transformedUV.x * terrainObject.heightMap.image.width, (1 - transformedUV.y) * terrainObject.heightMap.image.height];
            pixel = terrainObject.heightMapData.getImageData(pixelCoord[0], pixelCoord[1], 1, 1).data;
        }
        terrain_height = -app.terrain_height + (pixel[0] / 255) * app.terrain_height; // read red channel and multiply by terrain height
        return { height: terrain_height, color: pixel };
    }

    // transfered from vertex shader
    const uv_origin = new THREE.Vector2(0.5, 0.5);
    var rotatedUV = new THREE.Vector2(0.0, 0.0);

    function transform_UVs(uv, shift, rotation) {
        rotatedUV.set(uv.x - 0.5, uv.y - 0.5); //move rotation center to center of object
        rotatedUV = rotate2d(rotation, rotatedUV);
        rotatedUV.add(shift); // movement uv shift
        rotatedUV.add(uv_origin); // move uv back to origin
        rotatedUV.x = (rotatedUV.x > 0) ? rotatedUV.x % 1 : 1 + rotatedUV.x % 1;
        rotatedUV.y = (rotatedUV.y > 0) ? rotatedUV.y % 1 : 1 + rotatedUV.y % 1;

        return rotatedUV;
    }

    var roatation_vector = new THREE.Vector2(0.0, 0.0);

    function rotate2d(angle, uv) {
        roatation_vector.set(Math.cos(angle) * uv.x + Math.sin(angle) * uv.y,
            Math.cos(angle) * uv.y - Math.sin(angle) * uv.x);
        return roatation_vector;
    }

    // ======== DEBUG OBJECTS ========
    if (isDebugMode) {
        var size = [2, 200, 2];
        for (let i = 0; i < 50; i++) {
            var cube = app.get_cube(size, 0xff0000);
            cube.position.z = -500 + i * 50;
            scene.add(cube);
        }
    }

    // ======== FPS ========
    var time = 0.0;
    var framecount = 0;
    function getFPS(deltaTime) {
        framecount++;
        time += deltaTime;
        debugHUD.innerHTML = 'use arrow keys to turn <br />';
        debugHUD.innerText += 'FPS: ' + (1.0 / (time / framecount)).toFixed(1);
        if (framecount > 100) {
            time = 0.0;
            framecount = 0;
        }
    }

    return app;
}(MODULE));