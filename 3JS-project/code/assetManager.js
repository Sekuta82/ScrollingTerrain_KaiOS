var MODULE = (function (app) {
    app.gltf_loadingDone = false;

    app.totalTextureCount = 4;
    app.texturesLoaded = 0;

    var resourceLoadingCheck_interval = setInterval(checkLoadingStatus, 100);

    function checkLoadingStatus() {
        if (app.gltf_loadingDone && app.texturesLoaded >= app.totalTextureCount) {
            app.scene_start();
            clearInterval(resourceLoadingCheck_interval);
        }
    }

    // GLTF list
    const gltf_files = {
        'terrain_ground': 'assets/terrain/terrain_ground.glb'
    }

    app.gltf_scenes = {};

    // ======== GLTF loading ========
    const gltf_loader = new THREE.GLTFLoader();
    gltf_loader.crossOrigin = true;

    var fileIndex = 0;
    function load_gltf() {
        if (fileIndex > Object.keys(gltf_files).length - 1) {
            // all files done
            app.gltf_loadingDone = true;
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
            case 'terrain_ground': app.terrainObject = app.get_terrain(); break;
        }
    }

    // textures
    function textureLoaded() {
        app.texturesLoaded++;
    }

    var cube;
    app.get_background = function () {
        cube = new THREE.CubeTextureLoader()
            .setPath('assets/cubeMaps/')
            .load([
                'groundLevel_left.jpg',
                'groundLevel_right.jpg',
                'groundLevel_top.jpg',
                'groundLevel_bottom.jpg',
                'groundLevel_front.jpg',
                'groundLevel_back.jpg'
            ], function () { textureLoaded(); });
        return cube;
    }

    app.get_fog = function (color, near, far) {
        var fog = new THREE.Fog(color, near, far);
        return fog;
    }

    app.get_cube = function (size, color) {
        var geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        var material = new THREE.MeshBasicMaterial({ color: color });
        var cube = new THREE.Mesh(geometry, material);

        return cube;
    }

    app.get_player = function (size, color) {
        var geometry = new THREE.SphereGeometry(size, 64, 64);
        var material = new THREE.MeshBasicMaterial({ color: color });
        var sphere = new THREE.Mesh(geometry, material);

        return sphere;
    }

    //terrain 
    app.terrain_scaleFactor = 30.0;
    app.terrain_height = 80.0;

    app.get_terrain = function () {
        var object = {};
        var terrain_scene = app.gltf_scenes['terrain_ground'];
        var terrain = terrain_scene.children[0];
        object.object = terrain;
        var terrain_mesh = terrain.children[0];
        object.mesh = terrain_mesh;

        // simple plane with matching UVs for cheap raycasting
        var terrain_rayMesh = terrain.children[1];
        var raytarget_material = new THREE.MeshBasicMaterial({ color: 0x000000, visible: false });
        terrain_rayMesh.material = raytarget_material;
        object.rayMesh = terrain_rayMesh;

        var colorMap = new THREE.TextureLoader().load('assets/terrain/terrain_color.jpg', function () { textureLoaded(); });
        object.colorMap = colorMap;
        // load height map and add it to a new canvas for color lookup in code
        object.heightMapData = null;
        object.normalMapData = null;
        var heightMap = new THREE.TextureLoader().load('assets/terrain/terrain_masks.png', function (texture) { textureLoaded(); object.heightMapData = createCanvas(texture.image); });
        var normalMap = new THREE.TextureLoader().load('assets/terrain/terrain_normal.png', function (texture) { textureLoaded(); object.normalMapData = createCanvas(texture.image); });
        object.heightMap = heightMap;
        object.normalMap = normalMap;

        // terrain material with color and height map
        var material = app.get_terrainMaterial();
        material.uniforms.envMap.value = cube;
        material.uniforms.colorMap.value = colorMap;
        material.uniforms.colorMap.value.wrapS = material.uniforms.colorMap.value.wrapT = THREE.RepeatWrapping;
        material.uniforms.heightMap.value = heightMap;
        material.uniforms.heightMap.value.wrapS = material.uniforms.heightMap.value.wrapT = THREE.RepeatWrapping;

        terrain_mesh.material = material;
        object.material = material;

        terrain.scale.set(app.terrain_scaleFactor, app.terrain_height, app.terrain_scaleFactor);

        return object;
    }

    // canvas for height map
    function createCanvas(image) {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context;
    }

    return app;
}(MODULE));