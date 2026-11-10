/**
 * UrbanStreets.js
 * 紐約曼哈頓西街（West Street / Route 9A）多線道幹道、長曝光車流光軌與砲台公園城水岸都市綠化
 *
 * 核心架構：
 * 1. 西街主幹道鋪面與地面工程 (West Street Highway Infrastructure):
 *    - 介於世貿中心 (x ≈ -80m) 與世界金融中心 (x ≈ -130m) 之間，全長 1000 米 (z: -500m ~ +500m)。
 *    - 雙向 8 線道深色瀝青路面，車道標線、中央實體水泥分隔島 (Jersey Barrier)、路緣石與斑馬線路口 (Crosswalks at Vesey, Fulton, Liberty St)。
 *    - 橫跨西街之人行天橋橋墩防撞墩柱 (Skybridge Pylons & Crash Barriers)。
 * 2. InstancedMesh 長曝光車流流動光軌 (High-Speed Traffic Light Trails):
 *    - 南向車道（西半部）：批次渲染白金/暖白車頭燈光軌長條，以高速向南流動 (+z 方向)。
 *    - 北向車道（東半部）：批次渲染鮮紅尾燈光軌長條，以高速向北流動 (-z 方向)。
 *    - 端點平滑循環回繞 (Smooth Loop Wrapping)，零每幀記憶體配置 (Zero Allocation, 60+ FPS)。
 *    - 日夜與氣候動態連動：日間半透明繁忙車流，夜間與黃昏高強度發光並觸發 UnrealBloomPass 後製泛光管線。
 * 3. 砲台公園城水岸行道樹與美式古典街燈 (Trees & Streetlamps):
 *    - 採用 InstancedMesh 批次種植約 210 棵常青綠樹與楓樹，分佈於水岸步道與西街人行道兩側。
 *    - 沿街佈設美式復古黑金屬街燈，夜間透出暖黃光暈。
 */

import * as THREE from 'three';

/**
 * 跨環境安全建立 Canvas 實例
 */
function createSafeCanvas(width, height) {
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  throw new Error('Canvas execution environment is not available');
}

/**
 * 簡易 PRNG 偽隨機數生成器
 */
function createPRNG(seed = 19730911) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 建立西街 8 線道瀝青路面程序化紋理
 * 包含：車道線（白虛線）、實體分隔島雙黃線、外側白實線與車輪磨損軌跡
 */
function createRoadwayTexture() {
  const width = 512;
  const height = 1024;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(9090);

  // 1. 深色微粗糙瀝青底色
  ctx.fillStyle = '#17191f';
  ctx.fillRect(0, 0, width, height);

  // 瀝青顆粒噪點
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (prng() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. 八個車道輪跡深色磨損條帶
  const laneCenters = [
    0.07, 0.18, 0.29, 0.40, // 南向 4 車道
    0.60, 0.71, 0.82, 0.93  // 北向 4 車道
  ];

  ctx.fillStyle = 'rgba(10, 11, 14, 0.42)';
  laneCenters.forEach((lc) => {
    const cx = lc * width;
    const w = width * 0.07;
    ctx.fillRect(cx - w * 0.5, 0, w, height);
  });

  // 3. 車道邊緣與分隔島雙黃線 (Center Median Double Yellow Lines)
  ctx.strokeStyle = '#f5c518';
  ctx.lineWidth = 4;
  // 分隔島兩側黃實線
  ctx.beginPath();
  ctx.moveTo(width * 0.485, 0);
  ctx.lineTo(width * 0.485, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.515, 0);
  ctx.lineTo(width * 0.515, height);
  ctx.stroke();

  // 4. 外側邊緣白實線 (Outer White Solid Shoulder Lines)
  ctx.strokeStyle = '#e6ecf0';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(width * 0.015, 0);
  ctx.lineTo(width * 0.015, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.985, 0);
  ctx.lineTo(width * 0.985, height);
  ctx.stroke();

  // 5. 車道間白色虛線 (White Dashed Lane Dividers)
  // 美國標準公路規範：虛線長度約佔總週期 35% ~ 40%
  const dividers = [
    0.125, 0.235, 0.345, // 南向車道分割線
    0.655, 0.765, 0.875  // 北向車道分割線
  ];

  ctx.strokeStyle = '#dce3ea';
  ctx.lineWidth = 3;
  ctx.setLineDash([height * 0.36, height * 0.64]);
  ctx.lineDashOffset = 0;

  dividers.forEach((divX) => {
    ctx.beginPath();
    ctx.moveTo(divX * width, 0);
    ctx.lineTo(divX * width, height);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40); // 1000m 道路重複 40 次，每次 25m
  return texture;
}

/**
 * 建立人行道花崗岩地磚程序化紋理
 */
function createSidewalkTexture() {
  const width = 256;
  const height = 256;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 水泥方格地磚淺灰色
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, width, height);

  // 方格石磚勾縫陰影
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  const tileSize = 32;

  for (let x = 0; x <= width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 60);
  return texture;
}

/**
 * 建立都市街道、西街交通要道與綠化景觀總成
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.isNight=false] - 初始夜間狀態
 * @returns {{
 *   group: THREE.Group,
 *   update: (delta: number) => void,
 *   setNightMode: (isNight: boolean) => void
 * }}
 */
export function createUrbanStreets(options = {}) {
  const group = new THREE.Group();
  group.name = 'UrbanStreets_WestStreet';

  const isNightInit = !!options.isNight;
  const roadLength = 1000; // 覆蓋南北 z: -500m ~ +500m

  // ==========================================
  // 1. 材質系統建立
  // ==========================================
  const roadTexture = createRoadwayTexture();
  const sidewalkTexture = createSidewalkTexture();

  // 瀝青路面材質
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.85,
    metalness: 0.12
  });

  // 路基深色混凝土側邊材質
  const roadBedMat = new THREE.MeshStandardMaterial({
    color: 0x1f232b,
    roughness: 0.90,
    metalness: 0.10
  });

  // 人行道石磚面材
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTexture,
    roughness: 0.78,
    metalness: 0.15
  });

  // 路緣石 (Curb) 與分隔島混凝土
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x8a929e,
    roughness: 0.75,
    metalness: 0.20
  });

  // 中央水泥防撞護欄 (Jersey Barrier)
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x717985,
    roughness: 0.70,
    metalness: 0.25
  });

  // 斑馬線與路口停止線高白高反光標線材質
  const markingMat = new THREE.MeshStandardMaterial({
    color: 0xf0f4f8,
    roughness: 0.40,
    metalness: 0.15
  });

  // 天橋橋墩防撞柱與鋼構龍門架
  const bridgePierMat = new THREE.MeshStandardMaterial({
    color: 0x4a525d,
    roughness: 0.65,
    metalness: 0.40
  });

  // 龍門架綠底白字公路標誌牌 (Route 9A Highway Sign)
  const highwaySignMat = new THREE.MeshStandardMaterial({
    color: 0x006633, // 經典州際/公路綠
    roughness: 0.35,
    metalness: 0.25
  });

  // ==========================================
  // 2. 西街主幹道鋪面、路基與人行道
  // ==========================================
  // 座標規劃：
  // 西街中心位於 x = -105m
  // 8 線道車道寬度 40m：x 範圍 -125m ~ -85m
  // 西側人行道：x 範圍 -131m ~ -125m (寬 6m, y 表面 = 1.62m)
  // 東側人行道：x 範圍 -85m ~ -79m (寬 6m, y 表面 = 1.58m)
  // 車道表面標高 y = 1.52m (路基底延伸至 y = 0.0m，消除浮空與 Z-fighting)

  const roadWidth = 40;
  const roadCenterX = -105;
  const roadSurfaceY = 1.52;

  // (A) 車道路基與表面
  const roadBedGeo = new THREE.BoxGeometry(roadWidth, roadSurfaceY, roadLength);
  const roadBed = new THREE.Mesh(roadBedGeo, roadBedMat);
  roadBed.position.set(roadCenterX, roadSurfaceY * 0.5, 0);
  roadBed.receiveShadow = true;
  group.add(roadBed);

  const roadSurfaceGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
  roadSurfaceGeo.rotateX(-Math.PI * 0.5);
  const roadSurface = new THREE.Mesh(roadSurfaceGeo, asphaltMat);
  roadSurface.position.set(roadCenterX, roadSurfaceY + 0.005, 0);
  roadSurface.receiveShadow = true;
  group.add(roadSurface);

  // (B) 西側人行道 (連接世界金融中心東側)
  const westSidewalkW = 6;
  const westSidewalkX = -128;
  const westSidewalkH = 1.62;
  const westSidewalkGeo = new THREE.BoxGeometry(westSidewalkW, westSidewalkH, roadLength);
  const westSidewalk = new THREE.Mesh(westSidewalkGeo, sidewalkMat);
  westSidewalk.position.set(westSidewalkX, westSidewalkH * 0.5, 0);
  westSidewalk.receiveShadow = true;
  group.add(westSidewalk);

  // 西側花崗岩路緣石
  const westCurbGeo = new THREE.BoxGeometry(0.35, 0.15, roadLength);
  const westCurb = new THREE.Mesh(westCurbGeo, curbMat);
  westCurb.position.set(-125 - 0.175, roadSurfaceY + 0.075, 0);
  westCurb.receiveShadow = true;
  group.add(westCurb);

  // (C) 東側人行道 (連接世貿中心西側)
  const eastSidewalkW = 6;
  const eastSidewalkX = -82;
  const eastSidewalkH = 1.58;
  const eastSidewalkGeo = new THREE.BoxGeometry(eastSidewalkW, eastSidewalkH, roadLength);
  const eastSidewalk = new THREE.Mesh(eastSidewalkGeo, sidewalkMat);
  eastSidewalk.position.set(eastSidewalkX, eastSidewalkH * 0.5, 0);
  eastSidewalk.receiveShadow = true;
  group.add(eastSidewalk);

  // 東側花崗岩路緣石
  const eastCurbGeo = new THREE.BoxGeometry(0.35, 0.15, roadLength);
  const eastCurb = new THREE.Mesh(eastCurbGeo, curbMat);
  eastCurb.position.set(-85 + 0.175, roadSurfaceY + 0.075, 0);
  eastCurb.receiveShadow = true;
  group.add(eastCurb);

  // (D) 中央實體水泥分隔島 (Jersey Barrier Island)
  // 分隔島寬 2.4m，中心位於 x = -105m
  const medianW = 2.4;
  const medianH = 0.22;
  const medianIslandGeo = new THREE.BoxGeometry(medianW, medianH, roadLength);
  const medianIsland = new THREE.Mesh(medianIslandGeo, curbMat);
  medianIsland.position.set(roadCenterX, roadSurfaceY + medianH * 0.5, 0);
  medianIsland.receiveShadow = true;
  group.add(medianIsland);

  // 分隔島頂部混凝土紐澤西護欄 (Jersey Barrier)
  const jerseyW = 0.65;
  const jerseyH = 0.82;
  const jerseyGeo = new THREE.BoxGeometry(jerseyW, jerseyH, roadLength);
  const jerseyBarrier = new THREE.Mesh(jerseyGeo, barrierMat);
  jerseyBarrier.position.set(roadCenterX, roadSurfaceY + medianH + jerseyH * 0.5, 0);
  jerseyBarrier.castShadow = true;
  jerseyBarrier.receiveShadow = true;
  group.add(jerseyBarrier);

  // ==========================================
  // 3. 斑馬線路口標線 (Zebra Crossings at Key Intersections)
  // 於 Vesey St (z ≈ -155m), Fulton St (z ≈ 0m), Liberty St (z ≈ +105m)
  // 採用 InstancedMesh 批次渲染所有條紋
  // ==========================================
  const intersectionsZ = [-155, 0, 105];
  const stripesPerSide = 22; // 南北向兩側車道各排布斑馬線條紋
  const totalCrosswalkStripes = intersectionsZ.length * stripesPerSide * 2;

  const stripeGeo = new THREE.BoxGeometry(0.7, 0.02, 4.2);
  const crosswalkMesh = new THREE.InstancedMesh(stripeGeo, markingMat, totalCrosswalkStripes);
  crosswalkMesh.name = 'CrosswalkStripes';
  crosswalkMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let stripeIdx = 0;

  intersectionsZ.forEach((intZ) => {
    // 西半側車道斑馬線 (x: -124m ~ -107m)
    for (let i = 0; i < stripesPerSide; i++) {
      const sx = -124 + (i / (stripesPerSide - 1)) * 16.5;
      dummy.position.set(sx, roadSurfaceY + 0.015, intZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      crosswalkMesh.setMatrixAt(stripeIdx++, dummy.matrix);
    }
    // 東半側車道斑馬線 (x: -103m ~ -86m)
    for (let i = 0; i < stripesPerSide; i++) {
      const sx = -103 + (i / (stripesPerSide - 1)) * 16.5;
      dummy.position.set(sx, roadSurfaceY + 0.015, intZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      crosswalkMesh.setMatrixAt(stripeIdx++, dummy.matrix);
    }
  });

  crosswalkMesh.instanceMatrix.needsUpdate = true;
  group.add(crosswalkMesh);

  // ==========================================
  // 4. 西街上方天橋橋墩防撞墩與公路導引龍門架
  // ==========================================
  // 在北天橋 (z ≈ -70m) 與南天橋 (z ≈ +50m) 下方設置中央防撞墩與立柱支撐
  const bridgePositions = [
    { z: -70, label: 'North Bridge Pylon' },
    { z: 50, label: 'South Bridge Pylon' }
  ];

  const pylonGeo = new THREE.BoxGeometry(1.6, 12, 1.6);
  const crashBullnoseGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.8, 16);

  bridgePositions.forEach((bp) => {
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(roadCenterX, roadSurfaceY + medianH, bp.z);

    // 混凝土主立柱
    const pylon = new THREE.Mesh(pylonGeo, bridgePierMat);
    pylon.position.set(0, 6, 0);
    pylon.castShadow = true;
    pylon.receiveShadow = true;
    pylonGroup.add(pylon);

    // 南北兩側流線型防撞墩 (Crash Bullnose)
    const bnSouth = new THREE.Mesh(crashBullnoseGeo, curbMat);
    bnSouth.position.set(0, 0.9, 1.6);
    bnSouth.castShadow = true;
    pylonGroup.add(bnSouth);

    const bnNorth = new THREE.Mesh(crashBullnoseGeo, curbMat);
    bnNorth.position.set(0, 0.9, -1.6);
    bnNorth.castShadow = true;
    pylonGroup.add(bnNorth);

    group.add(pylonGroup);
  });

  // 公路綠色引導標誌橫架 (Highway Overhead Gantry Sign at z = -280 & z = 220)
  const gantryZList = [-280, 220];
  const gantryBeamGeo = new THREE.BoxGeometry(41, 0.8, 0.8);
  const gantryPostGeo = new THREE.CylinderGeometry(0.35, 0.4, 7.8, 12);
  const signBoardGeo = new THREE.BoxGeometry(9.5, 2.6, 0.25);

  gantryZList.forEach((gz) => {
    const gantry = new THREE.Group();
    gantry.position.set(roadCenterX, roadSurfaceY, gz);

    // 橫跨橫樑
    const beam = new THREE.Mesh(gantryBeamGeo, bridgePierMat);
    beam.position.set(0, 7.4, 0);
    beam.castShadow = true;
    gantry.add(beam);

    // 西側與東側支撐鋼柱
    const postW = new THREE.Mesh(gantryPostGeo, bridgePierMat);
    postW.position.set(-19.5, 3.9, 0);
    postW.castShadow = true;
    gantry.add(postW);

    const postE = new THREE.Mesh(gantryPostGeo, bridgePierMat);
    postE.position.set(19.5, 3.9, 0);
    postE.castShadow = true;
    gantry.add(postE);

    // 兩側車道指示牌
    const signSouth = new THREE.Mesh(signBoardGeo, highwaySignMat);
    signSouth.position.set(-9.5, 7.4, 0.5);
    gantry.add(signSouth);

    const signNorth = new THREE.Mesh(signBoardGeo, highwaySignMat);
    signNorth.position.set(9.5, 7.4, -0.5);
    gantry.add(signNorth);

    group.add(gantry);
  });

  // ==========================================
  // 5. InstancedMesh 長曝光車流流動光軌 (Light Trails)
  // ==========================================
  // 南向車道 (西半側)：白金/暖白車頭燈光軌，高速向南流動 (+z 方向)
  // 北向車道 (東半側)：鮮豔赤紅車尾燈光軌，高速向北流動 (-z 方向)
  // 0 GC 每幀內存配置，支援 UnrealBloomPass 高光發光

  const trailsPerDirection = 72; // 每方向 72 條高速流動光軌，總計 144 條
  const trailHeightY = roadSurfaceY + 0.38; // 略高於路面之大燈/尾燈標高

  // 南向 4 車道 X 座標 (西側車道)
  const sbLanes = [-121.5, -116.8, -112.1, -107.4];
  // 北向 4 車道 X 座標 (東側車道)
  const nbLanes = [-102.6, -97.9, -93.2, -88.5];

  // (A) 南向車頭燈光軌材質 (白金色高亮發光)
  const sbHeadlightMat = new THREE.MeshStandardMaterial({
    color: 0xfffae6,
    emissive: new THREE.Color(0xfff0c4),
    emissiveIntensity: isNightInit ? 3.0 : 0.6,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: isNightInit ? 0.95 : 0.40,
    toneMapped: false // 允許輝光亮度直通 BloomPass 閾值
  });

  // (B) 北向車尾燈光軌材質 (鮮豔紅光發光)
  const nbTaillightMat = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: new THREE.Color(0xff1810),
    emissiveIntensity: isNightInit ? 3.0 : 0.6,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: isNightInit ? 0.95 : 0.40,
    toneMapped: false
  });

  // 基礎單元長方體幾何體 (寬 0.38m, 高 0.22m, 基準長度 1.0m)
  const trailGeo = new THREE.BoxGeometry(0.38, 0.22, 1.0);

  const sbInstancedMesh = new THREE.InstancedMesh(trailGeo, sbHeadlightMat, trailsPerDirection);
  sbInstancedMesh.name = 'TrafficTrails_Southbound_Headlights';

  const nbInstancedMesh = new THREE.InstancedMesh(trailGeo, nbTaillightMat, trailsPerDirection);
  nbInstancedMesh.name = 'TrafficTrails_Northbound_Taillights';

  // 預先配置 TypedArray 記錄動態狀態，避免每幀垃圾回收 (Zero Allocation)
  const sbZ = new Float32Array(trailsPerDirection);
  const sbSpeed = new Float32Array(trailsPerDirection);
  const sbLaneX = new Float32Array(trailsPerDirection);
  const sbLength = new Float32Array(trailsPerDirection);

  const nbZ = new Float32Array(trailsPerDirection);
  const nbSpeed = new Float32Array(trailsPerDirection);
  const nbLaneX = new Float32Array(trailsPerDirection);
  const nbLength = new Float32Array(trailsPerDirection);

  const prngTraffic = createPRNG(424242);

  // 初始化南向車頭燈光軌分佈與微光色調
  const colorHeadlights = [
    new THREE.Color(0xffffff), // 冷白 Xenon
    new THREE.Color(0xfff3d6), // 暖白鹵素
    new THREE.Color(0xffe699)  // 金黃
  ];

  for (let i = 0; i < trailsPerDirection; i++) {
    const laneIdx = i % sbLanes.length;
    const laneBaseX = sbLanes[laneIdx];
    // 車道內隨機橫向微偏擺 (±0.4m)
    sbLaneX[i] = laneBaseX + (prngTraffic() - 0.5) * 0.8;
    // 縱向均勻分佈於 -500m ~ +500m 且伴隨偽隨機散佈
    sbZ[i] = -500 + (i / trailsPerDirection) * 1000 + (prngTraffic() - 0.5) * 25;
    // 車速分佈：32 ~ 58 m/s (約 115 ~ 210 km/h，符合高速曝光攝影長拖尾)
    sbSpeed[i] = 34 + prngTraffic() * 24;
    // 長曝光光軌長度：16 ~ 34 米
    sbLength[i] = 16 + prngTraffic() * 18;

    dummy.position.set(sbLaneX[i], trailHeightY, sbZ[i]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, sbLength[i]);
    dummy.updateMatrix();
    sbInstancedMesh.setMatrixAt(i, dummy.matrix);

    const col = colorHeadlights[Math.floor(prngTraffic() * colorHeadlights.length)];
    sbInstancedMesh.setColorAt(i, col);
  }

  // 初始化北向車尾燈光軌分佈與微光色調
  const colorTaillights = [
    new THREE.Color(0xff2a2a), // 亮紅
    new THREE.Color(0xff1414), // 深紅
    new THREE.Color(0xff4433)  // 橙紅
  ];

  for (let i = 0; i < trailsPerDirection; i++) {
    const laneIdx = i % nbLanes.length;
    const laneBaseX = nbLanes[laneIdx];
    nbLaneX[i] = laneBaseX + (prngTraffic() - 0.5) * 0.8;
    nbZ[i] = 500 - (i / trailsPerDirection) * 1000 + (prngTraffic() - 0.5) * 25;
    nbSpeed[i] = 34 + prngTraffic() * 24;
    nbLength[i] = 16 + prngTraffic() * 18;

    dummy.position.set(nbLaneX[i], trailHeightY, nbZ[i]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, nbLength[i]);
    dummy.updateMatrix();
    nbInstancedMesh.setMatrixAt(i, dummy.matrix);

    const col = colorTaillights[Math.floor(prngTraffic() * colorTaillights.length)];
    nbInstancedMesh.setColorAt(i, col);
  }

  sbInstancedMesh.instanceMatrix.needsUpdate = true;
  nbInstancedMesh.instanceMatrix.needsUpdate = true;
  if (sbInstancedMesh.instanceColor) sbInstancedMesh.instanceColor.needsUpdate = true;
  if (nbInstancedMesh.instanceColor) nbInstancedMesh.instanceColor.needsUpdate = true;

  group.add(sbInstancedMesh);
  group.add(nbInstancedMesh);

  // ==========================================
  // 6. 砲台公園城水岸行道樹與西街綠化植栽 (InstancedMesh Trees)
  // 規格：種植約 180 ~ 240 棵樹木 (樹幹 + 綠蔭樹冠)
  // 分佈於：
  // (1) 砲台公園城水岸步道 (x ≈ -280m, z: -380m ~ +380m, 76 棵)
  // (2) 西街西側人行道 (x ≈ -128.5m, z: -460m ~ +460m, 66 棵)
  // (3) 西街東側人行道 (x ≈ -81m, z: -460m ~ +460m, 66 棵)
  // 總計: 208 棵
  // ==========================================
  const totalTrees = 208;

  // 樹幹幾何體與材質
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 4.2, 7);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2a1c,
    roughness: 0.90,
    metalness: 0.05
  });
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);
  trunkMesh.name = 'UrbanTrees_Trunks';
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;

  // 樹冠幾何體與材質 (採用低多邊形十二面體建築風格風格樹冠，具立體分明切面)
  const canopyGeo = new THREE.DodecahedronGeometry(2.35, 1);
  const canopyMat = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.08,
    flatShading: true
  });
  const canopyMesh = new THREE.InstancedMesh(canopyGeo, canopyMat, totalTrees);
  canopyMesh.name = 'UrbanTrees_Canopies';
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;

  // 樹冠色調庫 (翠綠、深綠、橄欖綠、微黃楓綠)
  const canopyPalette = [
    new THREE.Color(0x285934),
    new THREE.Color(0x356e3f),
    new THREE.Color(0x1e4627),
    new THREE.Color(0x3e7b42),
    new THREE.Color(0x486c31)
  ];

  // 人行道樹穴石材地框 (Tree Grates)
  const grateGeo = new THREE.BoxGeometry(1.6, 0.04, 1.6);
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    roughness: 0.85,
    metalness: 0.2
  });
  const grateMesh = new THREE.InstancedMesh(grateGeo, grateMat, totalTrees);
  grateMesh.name = 'UrbanTrees_Grates';
  grateMesh.receiveShadow = true;

  const prngTree = createPRNG(777123);
  let treeIdx = 0;

  // (1) 砲台公園城水岸步道行道樹 (76 棵)
  const esplanadeTreeCount = 76;
  const esplanadeGroundY = 1.80;
  for (let i = 0; i < esplanadeTreeCount; i++) {
    const tz = -380 + (i / (esplanadeTreeCount - 1)) * 760;
    // 避開冬季花園正前方出入口中軸 (z 介於 -35 ~ +35)
    if (Math.abs(tz) < 28) continue;

    const tx = -280 + (prngTree() - 0.5) * 1.5;
    const scaleNoise = 0.85 + prngTree() * 0.35;

    // 樹穴框
    dummy.position.set(tx, esplanadeGroundY + 0.02, tz);
    dummy.rotation.set(0, prngTree() * Math.PI, 0);
    dummy.scale.set(scaleNoise, 1, scaleNoise);
    dummy.updateMatrix();
    grateMesh.setMatrixAt(treeIdx, dummy.matrix);

    // 樹幹
    dummy.position.set(tx, esplanadeGroundY + 2.1 * scaleNoise, tz);
    dummy.scale.set(scaleNoise, scaleNoise, scaleNoise);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(treeIdx, dummy.matrix);

    // 樹冠
    dummy.position.set(tx, esplanadeGroundY + (4.2 + 1.8) * scaleNoise, tz);
    dummy.scale.set(scaleNoise * 1.05, scaleNoise * 1.25, scaleNoise * 1.05);
    dummy.updateMatrix();
    canopyMesh.setMatrixAt(treeIdx, dummy.matrix);

    const foliageCol = canopyPalette[Math.floor(prngTree() * canopyPalette.length)];
    canopyMesh.setColorAt(treeIdx, foliageCol);

    treeIdx++;
  }

  // (2) 西街西側人行道行道樹 (66 棵)
  const westSidewalkTreeCount = 66;
  for (let i = 0; i < westSidewalkTreeCount; i++) {
    const tz = -460 + (i / (westSidewalkTreeCount - 1)) * 920;
    // 避開斑馬線路口
    if (Math.abs(tz - (-155)) < 12 || Math.abs(tz) < 12 || Math.abs(tz - 105) < 12) continue;

    const tx = -128.5 + (prngTree() - 0.5) * 0.4;
    const scaleNoise = 0.88 + prngTree() * 0.32;

    dummy.position.set(tx, westSidewalkH + 0.02, tz);
    dummy.rotation.set(0, prngTree() * Math.PI, 0);
    dummy.scale.set(scaleNoise, 1, scaleNoise);
    dummy.updateMatrix();
    grateMesh.setMatrixAt(treeIdx, dummy.matrix);

    dummy.position.set(tx, westSidewalkH + 2.1 * scaleNoise, tz);
    dummy.scale.set(scaleNoise, scaleNoise, scaleNoise);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(treeIdx, dummy.matrix);

    dummy.position.set(tx, westSidewalkH + (4.2 + 1.8) * scaleNoise, tz);
    dummy.scale.set(scaleNoise, scaleNoise * 1.2, scaleNoise);
    dummy.updateMatrix();
    canopyMesh.setMatrixAt(treeIdx, dummy.matrix);

    const foliageCol = canopyPalette[Math.floor(prngTree() * canopyPalette.length)];
    canopyMesh.setColorAt(treeIdx, foliageCol);

    treeIdx++;
  }

  // (3) 西街東側人行道行道樹 (66 棵)
  const eastSidewalkTreeCount = 66;
  for (let i = 0; i < eastSidewalkTreeCount; i++) {
    const tz = -460 + (i / (eastSidewalkTreeCount - 1)) * 920;
    if (Math.abs(tz - (-155)) < 12 || Math.abs(tz) < 12 || Math.abs(tz - 105) < 12) continue;

    const tx = -81.2 + (prngTree() - 0.5) * 0.4;
    const scaleNoise = 0.88 + prngTree() * 0.32;

    dummy.position.set(tx, eastSidewalkH + 0.02, tz);
    dummy.rotation.set(0, prngTree() * Math.PI, 0);
    dummy.scale.set(scaleNoise, 1, scaleNoise);
    dummy.updateMatrix();
    grateMesh.setMatrixAt(treeIdx, dummy.matrix);

    dummy.position.set(tx, eastSidewalkH + 2.1 * scaleNoise, tz);
    dummy.scale.set(scaleNoise, scaleNoise, scaleNoise);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(treeIdx, dummy.matrix);

    dummy.position.set(tx, eastSidewalkH + (4.2 + 1.8) * scaleNoise, tz);
    dummy.scale.set(scaleNoise, scaleNoise * 1.2, scaleNoise);
    dummy.updateMatrix();
    canopyMesh.setMatrixAt(treeIdx, dummy.matrix);

    const foliageCol = canopyPalette[Math.floor(prngTree() * canopyPalette.length)];
    canopyMesh.setColorAt(treeIdx, foliageCol);

    treeIdx++;
  }

  // 設定實際種植實例總數
  trunkMesh.count = treeIdx;
  canopyMesh.count = treeIdx;
  grateMesh.count = treeIdx;

  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;
  grateMesh.instanceMatrix.needsUpdate = true;
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;

  group.add(grateMesh);
  group.add(trunkMesh);
  group.add(canopyMesh);

  // ==========================================
  // 7. 美式古典黑金屬街燈 (American Classical Streetlamps)
  // 分佈於：
  // (1) 中央分隔島雙向照明街燈 (x = -105m, 間距 30m, 32 盞)
  // (2) 西側人行道 (x = -127.5m, 間距 35m, 26 盞)
  // (3) 東側人行道 (x = -81.5m, 間距 35m, 26 盞)
  // 總計: 84 盞
  // ==========================================
  const totalLamps = 84;

  const lampPoleGeo = new THREE.CylinderGeometry(0.12, 0.18, 5.2, 8);
  const lampPoleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 0.40,
    metalness: 0.75
  });
  const lampPolesMesh = new THREE.InstancedMesh(lampPoleGeo, lampPoleMat, totalLamps);
  lampPolesMesh.name = 'Streetlamp_Poles';
  lampPolesMesh.castShadow = true;
  lampPolesMesh.receiveShadow = true;

  // 街燈發光玻璃燈罩
  const lampLanternGeo = new THREE.OctahedronGeometry(0.38, 1);
  const lampLanternMat = new THREE.MeshStandardMaterial({
    color: isNightInit ? 0xffdf88 : 0xffffff,
    emissive: new THREE.Color(isNightInit ? 0xffb347 : 0x000000),
    emissiveIntensity: isNightInit ? 2.5 : 0.0,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: isNightInit ? 0.95 : 0.45
  });
  const lampLanternsMesh = new THREE.InstancedMesh(lampLanternGeo, lampLanternMat, totalLamps);
  lampLanternsMesh.name = 'Streetlamp_Lanterns';

  let lampIdx = 0;

  // (1) 中央分隔島雙臂路燈 (32 盞)
  const medianLampCount = 32;
  for (let i = 0; i < medianLampCount; i++) {
    const lz = -465 + (i / (medianLampCount - 1)) * 930;
    const baseH = roadSurfaceY + medianH;

    dummy.position.set(roadCenterX, baseH + 2.6, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPolesMesh.setMatrixAt(lampIdx, dummy.matrix);

    dummy.position.set(roadCenterX, baseH + 5.3, lz);
    dummy.updateMatrix();
    lampLanternsMesh.setMatrixAt(lampIdx, dummy.matrix);

    lampIdx++;
  }

  // (2) 西側人行道路燈 (26 盞)
  const westLampCount = 26;
  for (let i = 0; i < westLampCount; i++) {
    const lz = -450 + (i / (westLampCount - 1)) * 900;
    const lx = -127.5;
    const baseH = westSidewalkH;

    dummy.position.set(lx, baseH + 2.6, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPolesMesh.setMatrixAt(lampIdx, dummy.matrix);

    dummy.position.set(lx, baseH + 5.3, lz);
    dummy.updateMatrix();
    lampLanternsMesh.setMatrixAt(lampIdx, dummy.matrix);

    lampIdx++;
  }

  // (3) 東側人行道路燈 (26 盞)
  const eastLampCount = 26;
  for (let i = 0; i < eastLampCount; i++) {
    const lz = -450 + (i / (eastLampCount - 1)) * 900;
    const lx = -81.5;
    const baseH = eastSidewalkH;

    dummy.position.set(lx, baseH + 2.6, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPolesMesh.setMatrixAt(lampIdx, dummy.matrix);

    dummy.position.set(lx, baseH + 5.3, lz);
    dummy.updateMatrix();
    lampLanternsMesh.setMatrixAt(lampIdx, dummy.matrix);

    lampIdx++;
  }

  lampPolesMesh.count = lampIdx;
  lampLanternsMesh.count = lampIdx;

  lampPolesMesh.instanceMatrix.needsUpdate = true;
  lampLanternsMesh.instanceMatrix.needsUpdate = true;

  group.add(lampPolesMesh);
  group.add(lampLanternsMesh);

  // ==========================================
  // 8. 日夜切換 (setNightMode) 與動畫循環更新 (update)
  // ==========================================
  let isNightCurrent = isNightInit;

  /**
   * 切換日夜模式
   * @param {boolean} isNight
   */
  const setNightMode = (isNight) => {
    isNightCurrent = !!isNight;

    // (A) 車流光軌發光強度與透明度調整
    if (sbHeadlightMat) {
      sbHeadlightMat.emissiveIntensity = isNightCurrent ? 3.0 : 0.6;
      sbHeadlightMat.opacity = isNightCurrent ? 0.95 : 0.40;
      sbHeadlightMat.needsUpdate = true;
    }

    if (nbTaillightMat) {
      nbTaillightMat.emissiveIntensity = isNightCurrent ? 3.0 : 0.6;
      nbTaillightMat.opacity = isNightCurrent ? 0.95 : 0.40;
      nbTaillightMat.needsUpdate = true;
    }

    // (B) 街燈夜間點亮暖黃發光
    if (lampLanternMat) {
      lampLanternMat.color.setHex(isNightCurrent ? 0xffdf88 : 0xffffff);
      lampLanternMat.emissive.setHex(isNightCurrent ? 0xffb347 : 0x000000);
      lampLanternMat.emissiveIntensity = isNightCurrent ? 2.5 : 0.0;
      lampLanternMat.opacity = isNightCurrent ? 0.95 : 0.45;
      lampLanternMat.needsUpdate = true;
    }
  };

  if (isNightInit) {
    setNightMode(true);
  }

  /**
   * 每幀更新：雙向高速光軌循環流動
   * 0 堆記憶體分配 (Zero Garbage Collection) 確保穩鎖 60 FPS
   * @param {number} delta - 幀間隔秒數
   */
  const update = (delta) => {
    // 限制過大跳幀，防止視窗背景運算導致位置突變
    const dt = Math.min(delta || 0.016, 0.1);

    // 1. 南向車道光軌更新 (+z 方向流動)
    for (let i = 0; i < trailsPerDirection; i++) {
      let z = sbZ[i] + sbSpeed[i] * dt;
      if (z > 500) {
        z = -500 + (z - 500); // 平滑回繞到北端入口
      }
      sbZ[i] = z;

      dummy.position.set(sbLaneX[i], trailHeightY, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, sbLength[i]);
      dummy.updateMatrix();
      sbInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    sbInstancedMesh.instanceMatrix.needsUpdate = true;

    // 2. 北向車道光軌更新 (-z 方向流動)
    for (let i = 0; i < trailsPerDirection; i++) {
      let z = nbZ[i] - nbSpeed[i] * dt;
      if (z < -500) {
        z = 500 - (-500 - z); // 平滑回繞到南端入口
      }
      nbZ[i] = z;

      dummy.position.set(nbLaneX[i], trailHeightY, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, nbLength[i]);
      dummy.updateMatrix();
      nbInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    nbInstancedMesh.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    update,
    setNightMode
  };
}
