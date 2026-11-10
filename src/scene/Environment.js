/**
 * Environment.js
 * 動態環境氣候系統與大氣天幕 (Weather & Atmosphere System)
 *
 * 支援四大氣候模式：
 * 1. 'day' (晴天): 湛藍漸層天空、暖白天光、主太陽方向光 (投射清晰建築陰影)、漂浮白雲
 * 2. 'sunset' (黃昏): 橙紅至深紫晚霞天空、低角度金黃夕陽、長陰影、暖色大氣微霧
 * 3. 'night' (夜景): 深邃星空 (微閃爍星星粒子)、冷色月光、暗夜環境光 (凸顯辦公室燈火與航空障礙燈)
 * 4. 'rain' (雨霧): 灰暗陰雨天空、大氣指數霧 (THREE.FogExp2)、動態高保真垂直雨絲粒子系統 (~4,000 滴)
 */

import * as THREE from 'three';

/**
 * 建立雨絲粒子紋理 (垂直拉長半透明漸層)
 * @returns {THREE.CanvasTexture}
 */
function createRainDropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
  grad.addColorStop(0.2, 'rgba(210, 230, 255, 0.3)');
  grad.addColorStop(0.8, 'rgba(230, 245, 255, 0.85)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(6, 0, 4, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * 建立低多邊形大氣漂浮雲朵群
 * @returns {THREE.Group}
 */
function createCloudSystem() {
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'CloudSystem';

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
    transparent: true,
    opacity: 0.88
  });

  const cloudCount = 12;
  const clouds = [];

  for (let i = 0; i < cloudCount; i++) {
    const singleCloud = new THREE.Group();

    // 每個雲朵由 5~8 個擠壓球體組合成蓬鬆棉絮狀
    const puffCount = 5 + Math.floor(Math.random() * 4);
    for (let p = 0; p < puffCount; p++) {
      const radius = 18 + Math.random() * 22;
      const geo = new THREE.DodecahedronGeometry(radius, 1);
      const puff = new THREE.Mesh(geo, cloudMaterial);

      puff.position.set(
        (Math.random() - 0.5) * 55,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 45
      );
      puff.scale.set(1.2, 0.55, 1.0);
      singleCloud.add(puff);
    }

    // 分佈在雙塔四周遠景 (高度 360m ~ 460m，半徑 350m ~ 950m)
    const angle = (i / cloudCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 420 + Math.random() * 500;
    singleCloud.position.set(
      Math.cos(angle) * dist,
      370 + Math.random() * 80,
      Math.sin(angle) * dist
    );

    // 隨機自轉與飄移速度
    singleCloud.userData = {
      driftSpeed: 3.5 + Math.random() * 4.0,
      initialZ: singleCloud.position.z
    };

    cloudGroup.add(singleCloud);
    clouds.push(singleCloud);
  }

  return {
    group: cloudGroup,
    clouds,
    material: cloudMaterial,
    update(delta) {
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.position.x += c.userData.driftSpeed * delta;
        // 超出邊界循環重置
        if (c.position.x > 1100) {
          c.position.x = -1100;
        }
      }
    }
  };
}

/**
 * 建立夜空星群粒子系統 (Twinkling Starfield)
 * @returns {THREE.Points}
 */
function createStarfield() {
  const starCount = 850;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const phases = new Float32Array(starCount);

  const radius = 2200;
  for (let i = 0; i < starCount; i++) {
    // 在上半球均勻隨機分佈
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.08 + Math.random() * 0.92); // 仰角 > 5 度

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // 星星色調微調 (冷白 / 淡藍 / 暖金)
    const tintType = Math.random();
    let r = 1.0, g = 1.0, b = 1.0;
    if (tintType < 0.25) {
      r = 0.82; g = 0.90; b = 1.0; // 藍白星
    } else if (tintType < 0.45) {
      r = 1.0; g = 0.94; b = 0.82; // 暖黃星
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 4.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const starPoints = new THREE.Points(geometry, material);
  starPoints.name = 'Starfield';
  starPoints.visible = false;

  return {
    points: starPoints,
    material,
    update(time) {
      if (!starPoints.visible) return;
      // 微妙星光明滅呼吸
      material.opacity = 0.82 + 0.16 * Math.sin(time * 1.8);
    }
  };
}

/**
 * 建立高效垂直雨絲粒子系統 (~4,000 顆動態雨滴)
 * @returns {Object}
 */
function createRainSystem() {
  const rainCount = 4000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  const speeds = new Float32Array(rainCount);

  const boundX = 750;
  const boundZ = 750;
  const maxY = 480;

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * boundX;
    positions[i * 3 + 1] = Math.random() * maxY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * boundZ;

    // 下墜速度 280 ~ 420 m/s
    speeds[i] = 290 + Math.random() * 130;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainTexture = createRainDropTexture();

  const material = new THREE.PointsMaterial({
    map: rainTexture,
    size: 9.5,
    transparent: true,
    opacity: 0.68,
    color: 0xcde0f5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'RainParticles';
  points.visible = false;

  return {
    points,
    material,
    update(delta) {
      if (!points.visible) return;
      const pos = geometry.attributes.position.array;
      // 微風向 X 偏移
      const windX = -28.0;

      for (let i = 0; i < rainCount; i++) {
        const idx = i * 3;
        pos[idx + 1] -= speeds[i] * delta; // Y 下降
        pos[idx] += windX * delta;         // 斜雨漂移

        // 落地循環重置
        if (pos[idx + 1] < 0) {
          pos[idx + 1] = maxY + Math.random() * 20;
          pos[idx] = (Math.random() - 0.5) * boundX;
          pos[idx + 2] = (Math.random() - 0.5) * boundZ;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
}

/**
 * 建立全景大氣漸層天幕球 (Atmosphere Sky Dome)
 * @returns {THREE.Mesh}
 */
function createSkyDome() {
  const skyGeo = new THREE.SphereGeometry(2400, 32, 16);

  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform vec3 sunColor;
    uniform vec3 sunDirection;
    uniform float sunGlow;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normWorld = normalize(vWorldPosition + vec3(0.0, offset, 0.0));
      float h = max(normWorld.y, 0.0);
      vec3 sky = mix(bottomColor, topColor, max(pow(h, exponent), 0.0));

      // 太陽光暈與天際暮色補償
      float sunDot = max(dot(normWorld, normalize(sunDirection)), 0.0);
      sky += sunColor * (pow(sunDot, 12.0) * 0.35 * sunGlow + pow(sunDot, 48.0) * 0.7 * sunGlow);

      gl_FragColor = vec4(sky, 1.0);
    }
  `;

  const uniforms = {
    topColor: { value: new THREE.Color(0x4a90e2) },
    bottomColor: { value: new THREE.Color(0x9ec7ff) },
    sunColor: { value: new THREE.Color(0xfffaed) },
    sunDirection: { value: new THREE.Vector3(300, 650, 400).normalize() },
    sunGlow: { value: 0.8 },
    offset: { value: 50.0 },
    exponent: { value: 0.75 }
  };

  const skyMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.name = 'SkyDome';
  return { mesh: skyMesh, uniforms };
}

/**
 * 建立環境動態氣候系統
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} [renderer]
 * @returns {Object}
 */
export function createEnvironment(scene, renderer) {
  let currentWeather = 'day';
  let totalTime = 0;

  // 1. 初始化大氣天幕
  const skyDome = createSkyDome();
  scene.add(skyDome.mesh);

  // 2. 初始化雲朵群
  const clouds = createCloudSystem();
  scene.add(clouds.group);

  // 3. 初始化星空粒子群
  const starfield = createStarfield();
  scene.add(starfield.points);

  // 4. 初始化動態雨絲粒子
  const rainSystem = createRainSystem();
  scene.add(rainSystem.points);

  // 5. 初始化核心燈光
  // 主方向光 (陽光/夕陽/月光)
  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.5);
  dirLight.position.set(300, 650, 400);
  dirLight.castShadow = true;

  // 陰影配置 (涵蓋雙塔 415 米與整體廣場)
  const d = 420;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 1300;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // 環境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  // 半球環境散射光
  const hemiLight = new THREE.HemisphereLight(0x78a7ff, 0x3a4b58, 0.6);
  hemiLight.position.set(0, 600, 0);
  scene.add(hemiLight);

  // 氣候參數預設表
  const weatherConfigs = {
    day: {
      bgColor: 0x78a7ff,
      topSky: 0x3f88e3,
      bottomSky: 0x9ec7ff,
      sunColor: 0xfffaed,
      sunDir: new THREE.Vector3(300, 650, 400),
      sunGlow: 0.85,
      exponent: 0.75,
      dirLightColor: 0xfffaed,
      dirLightIntensity: 1.5,
      dirLightPos: [300, 650, 400],
      ambientColor: 0xffffff,
      ambientIntensity: 0.72,
      hemiSky: 0x78a7ff,
      hemiGround: 0x3a4b58,
      hemiIntensity: 0.6,
      fogColor: 0x78a7ff,
      fogDensity: 0.00025,
      cloudColor: 0xffffff,
      cloudOpacity: 0.88,
      cloudsVisible: true,
      starsVisible: false,
      rainVisible: false
    },
    sunset: {
      bgColor: 0x3a1c71,
      topSky: 0x2a144e, // 深邃紫羅蘭天頂
      bottomSky: 0xfc6a3f, // 橙紅金黃晚霞地平線
      sunColor: 0xff8030,
      sunDir: new THREE.Vector3(650, 160, 260), // 低角度夕陽
      sunGlow: 1.4,
      exponent: 0.6,
      dirLightColor: 0xff9045, // 金黃夕陽
      dirLightIntensity: 1.6,
      dirLightPos: [650, 160, 260],
      ambientColor: 0xffb890,
      ambientIntensity: 0.45,
      hemiSky: 0xfc6a3f,
      hemiGround: 0x2a1530,
      hemiIntensity: 0.55,
      fogColor: 0xfc6a3f, // 暖橘大氣微霧
      fogDensity: 0.0006,
      cloudColor: 0xff9575, // 晚霞染紅雲層
      cloudOpacity: 0.92,
      cloudsVisible: true,
      starsVisible: false,
      rainVisible: false
    },
    night: {
      bgColor: 0x040814,
      topSky: 0x02040a, // 深夜黑天頂
      bottomSky: 0x081024, // 曼哈頓夜色微光地平線
      sunColor: 0x6688cc,
      sunDir: new THREE.Vector3(-250, 520, -320),
      sunGlow: 0.15,
      exponent: 0.85,
      dirLightColor: 0x6688cc, // 皎潔柔冷月光
      dirLightIntensity: 0.35,
      dirLightPos: [-250, 520, -320],
      ambientColor: 0x151e2e, // 暗夜微光，凸顯辦公室室內燈火與避雷針閃爍燈
      ambientIntensity: 0.22,
      hemiSky: 0x1a2840,
      hemiGround: 0x060a12,
      hemiIntensity: 0.25,
      fogColor: 0x040814,
      fogDensity: 0.0004,
      cloudColor: 0x0a1220,
      cloudOpacity: 0.35,
      cloudsVisible: true,
      starsVisible: true,
      rainVisible: false
    },
    rain: {
      bgColor: 0x2b3340,
      topSky: 0x1e242d, // 陰霾沉鬱暴雨天頂
      bottomSky: 0x36404f,
      sunColor: 0x627080,
      sunDir: new THREE.Vector3(200, 500, 250),
      sunGlow: 0.05,
      exponent: 0.9,
      dirLightColor: 0x7a8a9a, // 漫射微弱天光
      dirLightIntensity: 0.42,
      dirLightPos: [200, 500, 250],
      ambientColor: 0x404b5c,
      ambientIntensity: 0.45,
      hemiSky: 0x4d596a,
      hemiGround: 0x1c222b,
      hemiIntensity: 0.38,
      fogColor: 0x2b3340, // 濃密暴雨大氣指數霧
      fogDensity: 0.0018,
      cloudColor: 0x323a46,
      cloudOpacity: 0.95,
      cloudsVisible: true,
      starsVisible: false,
      rainVisible: true
    }
  };

  /**
   * 切換天氣模式
   * @param {'day'|'sunset'|'night'|'rain'} mode
   */
  function setWeather(mode) {
    const config = weatherConfigs[mode] || weatherConfigs.day;
    currentWeather = mode;

    // 1. 背景與天幕 Shader Uniforms
    scene.background = new THREE.Color(config.bgColor);
    skyDome.uniforms.topColor.value.setHex(config.topSky);
    skyDome.uniforms.bottomColor.value.setHex(config.bottomSky);
    skyDome.uniforms.sunColor.value.setHex(config.sunColor);
    skyDome.uniforms.sunDirection.value.copy(config.sunDir).normalize();
    skyDome.uniforms.sunGlow.value = config.sunGlow;
    skyDome.uniforms.exponent.value = config.exponent;

    // 2. 方向光更新
    dirLight.color.setHex(config.dirLightColor);
    dirLight.intensity = config.dirLightIntensity;
    dirLight.position.set(...config.dirLightPos);

    // 3. 環境光更新
    ambientLight.color.setHex(config.ambientColor);
    ambientLight.intensity = config.ambientIntensity;

    // 4. 半球天光更新
    hemiLight.color.setHex(config.hemiSky);
    hemiLight.groundColor.setHex(config.hemiGround);
    hemiLight.intensity = config.hemiIntensity;

    // 5. 大氣霧效更新
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);

    // 6. 雲朵外觀與顯示狀態
    clouds.material.color.setHex(config.cloudColor);
    clouds.material.opacity = config.cloudOpacity;
    clouds.group.visible = config.cloudsVisible;

    // 7. 星空狀態
    starfield.points.visible = config.starsVisible;

    // 8. 雨絲粒子狀態
    rainSystem.points.visible = config.rainVisible;
  }

  // 初始套用晴天模式
  setWeather('day');

  return {
    get currentWeather() {
      return currentWeather;
    },
    set currentWeather(mode) {
      setWeather(mode);
    },
    setWeather,
    update(delta) {
      totalTime += delta;
      clouds.update(delta);
      starfield.update(totalTime);
      rainSystem.update(delta);
    },
    lights: {
      dirLight,
      ambientLight,
      hemiLight
    },
    skyDome,
    clouds,
    starfield,
    rainSystem
  };
}
