var radius = 1;
var stackCount = 20;
var sectorCount = 20; 

var fieldOfViewRadians = degToRad(45);
var cameraAngleRadians = degToRad(0);

function degToRad(d) {
  return d * Math.PI / 180;
}

var cubeRotation = 0.0;
const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

var Scene1 = init_building(gl);
//setTimeout(console.log(Scene1.objects), 5000);

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
sleep(5000).then(() => {
  main();
});


//
// Start here
//
function main() {

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  //ng separamos a View da Model

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
      vColor = aVertexColor;
      vColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'), //ng: novos uniforms
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
    }
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers_main(gl);  //ng: _main
  console.log(buffers);
//const buffers = null;

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    //requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function initBuffers_obj1(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  const positions = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  1.0,  1.0],    // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    number_of_indices: indices.length
  };
}

function initBuffers_obj2(gl) {
  //ng: esta função vai fazer o mesmo que a init_buffers(gl) fazia no sample5, p.ex.

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  const positions = [
    // Front face
    0.0,  1.0,  0.0,
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    // Right face
    0.0,  1.0,  0.0,
    1.0, -1.0,  1.0,
    1.0, -1.0, -1.0,
    // Back face
    0.0,  1.0,  0.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
    // Left face
    0.0,  1.0,  0.0,
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  const faceColors = [
    // Front face
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    // Right face
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    // Back face
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    // Left face
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0
  ];

  // Convert the array of colors into a table for all the vertices.

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.


  return {
    position: positionBuffer,
    color: colorBuffer,

  };
}

function initBuffers_obj3(gl){
  
  const postionSphere = [];
  const vertexNormalsSphere = [];
  var faceColorsSphere = [];
  const indicesSphere = [];

  var x ,y,z, xy;
  var nx, ny, nz, lengthInv = 1.0 / radius;

  var sectorStep = 2 * Math.PI / sectorCount;
  var stackStep = Math.PI / stackCount;
  var sectorAngle, stackAngle;

  for(var i = 0; i <= stackCount; i++){
    stackAngle = Math.PI / 2 - i * stackStep;
    xy = radius * Math.cos(stackAngle);
    z = radius * Math.sin(stackAngle);

    for(var j = 0; j <= sectorCount; j++){
      sectorAngle = j * sectorStep;

      x = xy * Math.cos(sectorAngle);
      y = xy * Math.sin(sectorAngle);
      postionSphere.push(x);
      postionSphere.push(y);
      postionSphere.push(z);

      nx = x * lengthInv;
      ny = y * lengthInv;
      nz = z * lengthInv;

      vertexNormalsSphere.push(nx);
      vertexNormalsSphere.push(ny);
      vertexNormalsSphere.push(nz);

      faceColorsSphere = faceColorsSphere.concat([0.0, 0.0, 1.0, 1.0]);
    }
  }

  const positionBufferSphere = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferSphere);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(postionSphere), gl.STATIC_DRAW);

  const normalBufferSphere = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferSphere);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormalsSphere),gl.STATIC_DRAW);

  const colorBufferSphere = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferSphere);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColorsSphere), gl.STATIC_DRAW);

  var k1, k2;
  for(var i = 0; i < stackCount; i++){
    k1 = i * (sectorCount + 1);
    k2 = k1 + sectorCount + 1;

    for(var j = 0; j < sectorCount; j++, k1++, k2++){
      if(i != 0){
        indicesSphere.push(k1);
        indicesSphere.push(k2);
        indicesSphere.push(k1 + 1);
      }

      if(i != stackCount - 1){
        indicesSphere.push(k1 + 1);
        indicesSphere.push(k2);
        indicesSphere.push(k2 + 1);
      }
    }
  }

  const indexBufferSphere = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferSphere);

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesSphere), gl.STATIC_DRAW);

  return{
    position: positionBufferSphere,
    color: colorBufferSphere,
    indices: indexBufferSphere,
    number_of_indices: indicesSphere.length
  };
}


function initBuffers_main(gl){
    //ng: também podiamos retornar uma lista, p.ex.
    return{
        obj1: initBuffers_obj1(gl),
        obj2: initBuffers_obj2(gl),
        obj3: initBuffers_obj3(gl)
    };
}

function init_building(gl){
    //Scene.loadObjectByParts('models/geometry/Building/part','Office',758);
    Scene.loadObject('models/geometry/Building/arco.json','Object');
    //Load the ground
    //Scene.loadObject('models/geometry/Building/plane.json','Plane');
    //Scene.loadObject('models/geometry/Building/obj.json','Object');
    //console.log(Scene.objects)
    return Scene;
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);



  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  //ng: comentem o translate acima, e experimentem com a seguinte função
  //documentação: https://stackoverflow.com/questions/21830340/understanding-glmlookat
  //https://www.khronos.org/registry/OpenGL-Refpages/gl2.1/xhtml/gluLookAt.xml
  //https://learnopengl.com/Getting-started/Camera
  const viewMatrix = mat4.create();

  //mat4.lookAt(viewMatrix, [0.0, 0.0, 25.0], [0.0, 0.0, 1.0], [0.0, 1.0, 0.0]);
  mat4.translate(viewMatrix, viewMatrix, [0.0,  0.0, -40.0]);
  //console.log("viewMatrix", viewMatrix);

  /**********************************************************************/
  
  const modelMatrixCube = mat4.create();
  
  mat4.translate(modelMatrixCube,     // destination matrix
    modelMatrixCube,     // matrix to translate
                 [-5.0, 0.0, 0.0]);  // amount to translate
  /*
  mat4.rotate(modelMatrixCube,  // destination matrix
    modelMatrixCube,  // matrix to rotate
              cubeRotation,// amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around (X)
   */ 

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj1.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj1.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }
    

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.obj1.indices);
  
  
  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    modelMatrixCube);

  {
     const vertexCount = buffers.obj1.number_of_indices;
     const type = gl.UNSIGNED_SHORT;
     const offset = 0;
     gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  /******************************************************************************************/

  const modelMatrixCube2 = mat4.create();

  mat4.translate(modelMatrixCube2, modelMatrixCube2, [8.0, 0.0, 0.0]);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj2.position);  //ng: .obj2.
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj2.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  //ng: precisamos de passar a modelMatrix do obj2 para o shader
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
gl.uniformMatrix4fv(
    programInfo.uniformLocations.viewMatrix,
    false,
    viewMatrix);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    modelMatrixCube2);

  {
    const vertexCount = 12;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
  }
  /******************************************************************************/
  
  const modelViewMatrixSphere = mat4.create();

  mat4.translate(modelViewMatrixSphere, modelViewMatrixSphere, [0.0, 0.0, 0.0]);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj3.position);  //ng: .obj2.
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.obj3.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.obj3.indices);
  
  
  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    modelViewMatrixSphere);

  {
     const vertexCount = buffers.obj3.number_of_indices;
     const type = gl.UNSIGNED_SHORT;
     const offset = 0;
     gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  
  //draw_json(gl, programInfo);
  
  // Update the rotation for the next draw

  cubeRotation += deltaTime;
}

function draw_json(gl, programInfo) {
      
  try{      
    
      for (var i = 0; i <  Scene1.objects.length; i++){          
          var object = Scene1.objects[i];
          //console.log(object);
        
          //Setting uniforms
          //gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
          //gl.uniform1i(prg.uWireframe,object.wireframe);
          //gl.uniform1i(prg.uPerVertexColor, object.perVertexColor);
          
          //Setting attributes
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
          gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor);
          
          gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
          
          
           if (object.perVertexColor){
          gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,4,gl.FLOAT, false, 0,0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
           }
          
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);
          
          var modelMatrix = mat4.create();
          gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, modelMatrix);

          gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT,0);

          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
          //console.log("drawing");
      }
  }
  catch(err){
      alert(err);
      console.error(err.description);
  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
