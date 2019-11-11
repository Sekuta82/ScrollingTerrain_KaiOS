var MODULE = (function (app) {
  app.pi = Math.PI;

  // ======== CONFIG ========
  var isDebugMode = true;
  var isDoubleSize = true;	
  var useHiresTerrain = false;
  var showWireframe = false;

  app.screenWidth = isDoubleSize ? 480 : 240;
  app.screenHeight = isDoubleSize ? 640 : 320;

  app.debugHUD = document.getElementById("debugHUD");
  if (!isDebugMode) app.debugHUD.remove();

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 65, app.screenWidth / app.screenHeight, 10, app.terrain_scaleFactor * 50 );
  var player = new THREE.Group();
  var player_startPosition = new THREE.Vector3();

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( app.screenWidth, app.screenHeight );
  renderer.antialiasing = false;

  var clock = new THREE.Clock(true);

  app.gameRunning = false;
  
  // set background
  var backgroundColor = new THREE.Color(0xfefadd);
  scene.background = backgroundColor;
  var fog_color = backgroundColor;
  scene.fog = app.get_fog(fog_color, 10, app.terrain_scaleFactor * 50);

  // GLTF list
  var gltf_files = {
    'terrain_ground' : useHiresTerrain ? 'assets/terrain/terrain_ground_hires.glb' : 'assets/terrain/terrain_ground.glb'
  }

  // ======== GLTF loading ========
  var gltf_loader = new THREE.GLTFLoader();
  gltf_loader.crossOrigin = true;

  var fileIndex = 0;
  function load_gltf () {
    if (fileIndex > Object.keys(gltf_files).length - 1) {
      // all files done
      scene_start();
      return;
    }
    var key = Object.keys(gltf_files)[fileIndex]; // get key by index
    gltf_loader.load( gltf_files[key], function ( gltf ) {
      app.gltf_scenes[key] = (gltf.scene); // add to scenes dict
      fileIndex++;
      get_objects(key); // do something after loading
      load_gltf(); // load next file
    });
  }
  load_gltf();

  var terrainObject;
  function get_objects (name) {
    switch (name) {
      case 'terrain_ground' : terrainObject = app.get_terrain(); break;
    }
  }

  // ======== START ========
  function scene_start () {
    scene_setup();
    document.body.appendChild( renderer.domElement );
    app.gameRunning = true;
  }

  function scene_setup () {
    // terrain
    scene.add(terrainObject);
    if (showWireframe) terrainObject.children[0].material.wireframe = true;

    // create player
    player_startPosition.set(0,50,0);
    player.add(app.get_player(3,0x00cccc));
    player.position.add(player_startPosition);
    player.add(camera);
    scene.add(player);

    camera.position.z = -30;
  }

  // ======== ANIMATE ========
  var forwardSpeed = 0.5;
  var verticalMovement = 0.0, verticalMovement_velocity = 0.0;
  var player_wordlPosition = new THREE.Vector3();
  var player_rotation = 0.0;
  var player_rotation_velocity = 0.0;
  var local_rotation_vector = new THREE.Vector3();
  var local_rotation_velocity = new THREE.Vector3();

  var terrain_scale = 1 / (100 * app.terrain_scaleFactor);

  function animate() {
    requestAnimationFrame( animate );
    if (!app.gameRunning) return;

    var deltaTime = clock.getDelta();
    if(isDebugMode) getFPS(deltaTime);
    deltaTime = Math.min(deltaTime,0.1); // avoid extreme acceleration during frame drops
    
    // fly forward
    moveForward(player, forwardSpeed);

    // flight controls
    var direction = new THREE.Vector3();
    direction.y = Number( app.moveDown ) - Number( app.moveUp );
    direction.x = Number( app.moveRight ) - Number( app.moveLeft );
    direction.normalize();
    
    if ( app.moveLeft || app.moveRight ) {
      player_rotation -= direction.x * 2.0 * deltaTime;
      local_rotation_vector.y -= direction.x * 5.0 * deltaTime;
    } else {
      local_rotation_vector.y = 0.0;
    }
    if (app.moveUp || app.moveDown ) {
      verticalMovement = direction.y * 30.0 * deltaTime;
      local_rotation_vector.x -= direction.y * 5.0 * deltaTime;
    } else {
      verticalMovement = 0;
      local_rotation_vector.x = 0.0;
    }
    verticalMovement_velocity = lerp(verticalMovement_velocity,verticalMovement,deltaTime*0.5);
    local_rotation_vector.clamp(new THREE.Vector3(-0.5,-0.5,-0.5), new THREE.Vector3(0.5,0.5,0.5));

    player_rotation_velocity = lerp(player_rotation_velocity,player_rotation, deltaTime*0.5);
    player.rotation.y = player_rotation_velocity;

    local_rotation_velocity.lerp(local_rotation_vector, deltaTime*0.5);
    camera.rotation.set(-local_rotation_velocity.x * 0.5 + 0.3, app.pi, -local_rotation_velocity.y * 0.5, 'XYZ');

    // animate terrain
    player.getWorldPosition(player_wordlPosition);
    terrainObject.position.set(player_wordlPosition.x,-app.terrain_height,player_wordlPosition.z);
    terrainObject.rotation.y = player.rotation.y;
    terrainObject.children[0].material.uniforms.shift.value = new THREE.Vector2(-player_wordlPosition.x * terrain_scale,player_wordlPosition.z * terrain_scale);
    terrainObject.children[0].material.uniforms.worldRotation.value = -terrainObject.rotation.y;

    renderer.render( scene, camera );
  }
  animate();

  function moveForward ( object, distance ) {
    var vec = player_startPosition;
    vec.setFromMatrixColumn( object.matrix, 0 );
    vec.crossVectors( object.up, vec );
    vec.y = verticalMovement_velocity;
    object.position.addScaledVector( vec, -distance );
  };

  function lerp (start, end, amt){
    return (1-amt)*start+amt*end
  }

  // ======== DEBUG OBJECTS ========
  if (isDebugMode) {
    var size = [2,200,2];
    for (let i = 0; i < 50; i++) {
      var cube = app.get_cube(size, 0xff0000);
      cube.position.z = -500 + i*50;
      scene.add(cube);
    }
  }

  // ======== FPS ========
  var time = 0.0;
  var framecount = 0;
  function getFPS (deltaTime) {
    framecount++;
    time += deltaTime;
    app.debugHUD.innerHTML = 'use arrow keys to turn <br />';
    app.debugHUD.innerText += 'FPS: ' + (1.0 / (time / framecount)).toFixed(1);
    if(framecount > 100) {
      time = 0.0;
      framecount = 0;
    }
  }

  return app;
}(MODULE));