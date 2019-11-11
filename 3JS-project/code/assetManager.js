var MODULE = (function (app) {

   app.gltf_scenes = {};

   app.get_fog = function (color, near, far) {
      var fog = new THREE.Fog( color, near, far );
      return fog;
   }
   
   app.get_cube = function (size, color) {
      var geometry = new THREE.BoxGeometry( size[0],size[1],size[2] );
      var material = new THREE.MeshBasicMaterial( { color: color } );
      var cube = new THREE.Mesh( geometry, material );

      return cube;
   }

   app.get_player = function (size, color) {
      var geometry = new THREE.SphereGeometry( size, 64, 64 );
      var material = new THREE.MeshBasicMaterial( {color: color} );
      var sphere = new THREE.Mesh( geometry, material );

      return sphere;
   }

   app.terrain_scaleFactor = 30.0;
   app.terrain_height = 60.0;

   app.get_terrain = function () {
      var terrain_scene = app.gltf_scenes['terrain_ground'];
      var terrain = terrain_scene.children[0];
      var terrain_mesh = terrain.children[0];
      var colorMap = new THREE.TextureLoader().load( 'assets/terrain/terrain_color.jpg' );
      var heightMap = new THREE.TextureLoader().load( 'assets/terrain/terrain_masks.jpg' );
      var material = app.get_terrainMaterial();
      material.uniforms.colorMap.value = colorMap;
      material.uniforms.colorMap.value.wrapS = material.uniforms.colorMap.value.wrapT = THREE.RepeatWrapping;
      material.uniforms.heightMap.value = heightMap;
      material.uniforms.heightMap.value.wrapS = material.uniforms.heightMap.value.wrapT = THREE.RepeatWrapping;
      terrain_mesh.material = material;

      terrain.scale.set(app.terrain_scaleFactor,app.terrain_height,app.terrain_scaleFactor);

      return terrain;
   }

   return app;
 }(MODULE));