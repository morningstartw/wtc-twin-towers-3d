/**
 * TributeInLight.js
 * 紀念天際光柱 (Tribute in Light Memorial Beams)
 *
 * 歷史與象徵背景：
 * 為悼念 2001 年 9 月 11 日世貿雙塔與罹難者，紐約每年秋季在雙塔遺址旁投射兩束
 * 由 88 具 7,000 瓦氙氣探照燈組成的強大垂直藍白光柱，直射雲霄達 4 英里 (約 6,400 米)。
 * 本模組於雙塔天際重現這兩道神聖而震撼的半透明體積發光光柱與光塵粒子。
 *
 * 規格：
 * - 2 束巨型垂直光柱，分別自北塔與南塔屋頂印記向上投射
 * - 高度 ~1,200m，基底半徑 ~19m，頂部微擴散 ~28m
 * - 雙層發光體積 (內層超亮高密核心筒 + 外層大氣藍暈 + 垂直交錯四向擴散面)
 * - 採用 THREE.AdditiveBlending、透明雙面漸層、無深度寫入 (depthWrite: false)
 * - 動態呼吸光律動與大氣懸浮光塵微粒 (Atmospheric Sparkles)
 */

import * as THREE from 'three';

/**
 * 建立單一束紀念光柱
 * @param {Object} options
 * @param {number} options.x - X 座標
 * @param {number} options.z - Z 座標
 * @param {number} [options.originY=415] - 光柱起點高度 (預設為雙塔天台 415 米)
 * @param {number} [options.height=1200] - 光柱投射高度
 * @param {number} [options.radiusBottom=19] - 光柱基底半徑
 * @param {number} [options.radiusTop=28] - 光柱頂端半徑
 * @returns {Object}
 */
function createSingleBeam(options) {
  const {
    x,
    z,
    originY = 415,
    height = 1200,
    radiusBottom = 19,
    radiusTop = 28
  } = options;

  const beamGroup = new THREE.Group();
  beamGroup.position.set(x, originY + height / 2, z);

  // 1. 外層大氣柔光圓柱 (Volumetric Outer Cone)
  const outerGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32, 1, true);

  const outerVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const outerFragmentShader = `
    uniform vec3 color;
    uniform float opacity;
    uniform float time;
    uniform float pulse;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // 垂直漸層：基底快速淡入，頂端漸隱至虛無
      float bottomFade = smoothstep(0.0, 0.06, vUv.y);
      float topFade = 1.0 - smoothstep(0.25, 1.0, vUv.y);
      float verticalGrad = bottomFade * topFade;

      // 邊緣柔化 (Rim Falloff)：減少多邊形邊界生硬感，營造大氣光錐感
      vec3 norm = normalize(vNormal);
      vec3 view = normalize(vViewPosition);
      float rim = abs(dot(norm, view));
      float edgeGlow = pow(1.0 - rim, 0.85) * 0.55 + 0.45;

      // 細緻縱向動態光波
      float wave = 0.95 + 0.05 * sin(time * 3.0 - vUv.y * 12.0);

      float alpha = verticalGrad * edgeGlow * opacity * pulse * wave;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const outerUniforms = {
    color: { value: new THREE.Color(0x6aaeff) }, // 標誌性夜空淡藍
    opacity: { value: 0.38 },
    time: { value: 0 },
    pulse: { value: 1.0 }
  };

  const outerMat = new THREE.ShaderMaterial({
    vertexShader: outerVertexShader,
    fragmentShader: outerFragmentShader,
    uniforms: outerUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  beamGroup.add(outerMesh);

  // 2. 核心超亮發光筒 (Intense Core Beam)
  const coreRadiusBottom = radiusBottom * 0.42;
  const coreRadiusTop = radiusTop * 0.45;
  const coreGeo = new THREE.CylinderGeometry(coreRadiusTop, coreRadiusBottom, height, 24, 1, true);

  const coreUniforms = {
    color: { value: new THREE.Color(0xd6eeff) }, // 核心亮白偏天青
    opacity: { value: 0.58 },
    time: { value: 0 },
    pulse: { value: 1.0 }
  };

  const coreMat = new THREE.ShaderMaterial({
    vertexShader: outerVertexShader,
    fragmentShader: outerFragmentShader,
    uniforms: coreUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  beamGroup.add(coreMesh);

  // 3. 垂直十字交叉擴散面 (Cross Volumetric Billboards)
  // 提供自任意視角皆飽滿的立體體積光效果
  const planeGeo = new THREE.PlaneGeometry(radiusBottom * 2.2, height);

  const planeVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const planeFragmentShader = `
    uniform vec3 color;
    uniform float opacity;
    uniform float pulse;
    varying vec2 vUv;

    void main() {
      // 水平高斯鐘形柔邊
      float xDist = abs(vUv.x - 0.5) * 2.0;
      float horizontalFalloff = exp(-xDist * xDist * 3.5);

      // 垂直漸隱
      float bottomFade = smoothstep(0.0, 0.05, vUv.y);
      float topFade = 1.0 - smoothstep(0.2, 1.0, vUv.y);
      float alpha = horizontalFalloff * bottomFade * topFade * opacity * pulse;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const planeUniforms = {
    color: { value: new THREE.Color(0x8bc4ff) },
    opacity: { value: 0.32 },
    pulse: { value: 1.0 }
  };

  const planeMat = new THREE.ShaderMaterial({
    vertexShader: planeVertexShader,
    fragmentShader: planeFragmentShader,
    uniforms: planeUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const planeA = new THREE.Mesh(planeGeo, planeMat);
  beamGroup.add(planeA);

  const planeB = new THREE.Mesh(planeGeo, planeMat);
  planeB.rotation.y = Math.PI / 2;
  beamGroup.add(planeB);

  // 4. 光柱內懸浮光塵粒子 (Illuminated Dust Motes & Atmospheric Sparkles)
  const moteCount = 280;
  const moteGeo = new THREE.BufferGeometry();
  const motePositions = new Float32Array(moteCount * 3);
  const moteSpeeds = new Float32Array(moteCount);
  const moteRadii = new Float32Array(moteCount);
  const moteAngles = new Float32Array(moteCount);

  for (let i = 0; i < moteCount; i++) {
    const r = Math.random() * (radiusBottom * 0.9);
    const theta = Math.random() * Math.PI * 2;
    const yRel = (Math.random() - 0.5) * height;

    motePositions[i * 3] = Math.cos(theta) * r;
    motePositions[i * 3 + 1] = yRel;
    motePositions[i * 3 + 2] = Math.sin(theta) * r;

    moteRadii[i] = r;
    moteAngles[i] = theta;
    moteSpeeds[i] = 18 + Math.random() * 32; // 向上漂移速度
  }

  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));

  const moteMat = new THREE.PointsMaterial({
    color: 0xebf5ff,
    size: 4.8,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const motePoints = new THREE.Points(moteGeo, moteMat);
  beamGroup.add(motePoints);

  // 5. 更新邏輯
  function update(time, delta) {
    // 呼吸律動週期約 3.2 秒
    const breath = 0.92 + 0.08 * Math.sin(time * 1.95);
    outerUniforms.time.value = time;
    outerUniforms.pulse.value = breath;
    coreUniforms.time.value = time;
    coreUniforms.pulse.value = breath;
    planeUniforms.pulse.value = breath;

    // 核心微細縮放脈動
    const coreScale = 1.0 + 0.03 * Math.sin(time * 2.3);
    coreMesh.scale.set(coreScale, 1.0, coreScale);

    // 懸浮光塵緩緩向上螺旋飄移
    const pos = moteGeo.attributes.position.array;
    const halfH = height / 2;
    for (let i = 0; i < moteCount; i++) {
      const idx = i * 3;
      moteAngles[i] += 0.35 * delta;
      pos[idx] = Math.cos(moteAngles[i]) * moteRadii[i];
      pos[idx + 2] = Math.sin(moteAngles[i]) * moteRadii[i];
      pos[idx + 1] += moteSpeeds[i] * delta;

      if (pos[idx + 1] > halfH) {
        pos[idx + 1] = -halfH;
      }
    }
    moteGeo.attributes.position.needsUpdate = true;
  }

  return {
    group: beamGroup,
    update
  };
}

/**
 * 建立雙塔紀念光柱系統 (Tribute in Light)
 *
 * @param {Object} [options]
 * @param {Object} [options.northPos={ x: -70, y: 415, z: -70 }] - 北塔位置
 * @param {Object} [options.southPos={ x: 70, y: 415, z: 70 }] - 南塔位置
 * @param {number} [options.height=1200] - 光柱投射高度
 * @param {number} [options.radiusBottom=19] - 光柱基底半徑
 * @param {number} [options.radiusTop=28] - 光柱頂端半徑
 * @param {boolean} [options.visible=false] - 預設是否可見
 * @returns {Object}
 */
export function createTributeInLight(options = {}) {
  const {
    northPos = { x: -70, y: 415, z: -70 },
    southPos = { x: 70, y: 415, z: 70 },
    height = 1200,
    radiusBottom = 19,
    radiusTop = 28,
    visible = false
  } = options;

  const group = new THREE.Group();
  group.name = 'TributeInLight';

  // 1. 北塔紀念光束
  const northBeam = createSingleBeam({
    x: northPos.x,
    z: northPos.z,
    originY: northPos.y,
    height,
    radiusBottom,
    radiusTop
  });
  group.add(northBeam.group);

  // 2. 南塔紀念光束
  const southBeam = createSingleBeam({
    x: southPos.x,
    z: southPos.z,
    originY: southPos.y,
    height,
    radiusBottom,
    radiusTop
  });
  group.add(southBeam.group);

  let isVisible = visible;
  group.visible = visible;

  let lastTime = 0;

  return {
    group,
    /**
     * 開關光柱顯示狀態
     * @param {boolean} val
     */
    setVisible(val) {
      isVisible = Boolean(val);
      group.visible = isVisible;
    },
    /**
     * 是否正在顯示
     */
    get isVisible() {
      return isVisible;
    },
    set isVisible(val) {
      this.setVisible(val);
    },
    /**
     * 動態更新呼吸律動與光塵
     * @param {number} time - 經過總秒數
     */
    update(time) {
      if (!isVisible && !group.visible) return;
      const delta = Math.min(Math.max(time - lastTime, 0.001), 0.1);
      lastTime = time;

      northBeam.update(time, delta);
      southBeam.update(time, delta);
    }
  };
}
