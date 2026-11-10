/**
 * WTCComplex.js
 * 紐約世界貿易中心 (WTC) 周邊附屬建築群 (WTC 3, 4, 5, 6, 7)
 *
 * 涵蓋歷史建築：
 * 1. WTC 3 (Vista International / Marriott World Trade Center):
 *    - 22 層，標高 74 米，座落於南北雙塔之間西側（西街側）。
 *    - 經典階梯形外觀 (Stepped architectural design)、鋼骨與深色玻璃立面、水平遮陽窗條。
 * 2. WTC 4 (東南側 9 層辦公樓):
 *    - 9 層，標高 36 米，坐落於廣場東南方 (Liberty St & Church St 角落)。
 *    - 深炭色方正量體，底層開敞山崎實風格哥德式挑高柱廊，四面密柱採光窗。
 * 3. WTC 5 (東北側 9 層辦公樓):
 *    - 9 層，標高 36 米，坐落於廣場東北方 (Vesey St & Church St 角落)。
 *    - 與 WTC 4 呼應圍塑出奧斯汀·J·托賓廣場東側界限。
 * 4. WTC 6 (美國海關大樓 U.S. Customhouse):
 *    - 8 層，標高 32 米，位於北塔西北側 (Vesey St & West St)。
 *    - 標誌性中央內凹式開敞中庭 (Recessed central atrium)、深色花崗岩與玻璃立面。
 * 5. WTC 7 (7 World Trade Center):
 *    - 47 層，標高 190 米，坐落於維西街（Vesey St）以北。
 *    - 獨特梯形平面輪廓 (Trapezoidal footprint)、暖紅赤褐色花崗岩立面。
 *    - 橫跨 Vesey St 連接托賓廣場高架散步道的人行空橋 (Promenade Pedestrian Bridge)。
 * 6. 日夜與氣候連動 (setNightMode)：
 *    - 夜間隨機點亮辦公室暖黃、金琥珀與日光色窗格。
 *    - 大樓頂部四角與天線設有紅色航空障礙標誌警示燈 (Red aviation obstruction beacons)。
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
function createPRNG(seed = 1973) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 建立 WTC 3 萬豪酒店專屬程序化立面紋理 (22 層水平金屬遮陽窗條)
 */
function createWTC3Texture(isNight = false) {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(30303);

  // 底色：深炭色鋼構
  ctx.fillStyle = isNight ? '#0a0d14' : '#1e222b';
  ctx.fillRect(0, 0, width, height);

  const floors = 22;
  const columns = 28;
  const floorH = height / floors;
  const colW = width / columns;

  const nightColors = [
    '#ffe49e', '#ffd269', '#fff8e7', '#e2effa', '#ffbe6b'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;
    // 水平金屬遮陽橫條
    ctx.fillStyle = isNight ? '#12161f' : '#333842';
    ctx.fillRect(0, y, width, floorH * 0.35);

    // 窗戶玻璃帶
    const winY = y + floorH * 0.35;
    const winH = floorH * 0.65;

    for (let c = 0; c < columns; c++) {
      const x = c * colW + colW * 0.08;
      const w = colW * 0.84;

      if (isNight) {
        // 酒店客房約 35% 亮燈，帶窗簾陰影
        if (prng() < 0.36) {
          ctx.fillStyle = nightColors[Math.floor(prng() * nightColors.length)];
          ctx.fillRect(x, winY, w, winH);
          if (prng() < 0.4) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x, winY, w * 0.45, winH);
          }
        } else {
          ctx.fillStyle = '#06080c';
          ctx.fillRect(x, winY, w, winH);
        }
      } else {
        // 白天深色反射玻璃
        ctx.fillStyle = '#222d3b';
        ctx.fillRect(x, winY, w, winH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 建立 WTC 4, 5, 6 低層辦公大樓程序化立面紋理 (山崎實密柱採光窗格)
 */
function createLowRiseTexture(isNight = false, seed = 40506) {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  ctx.fillStyle = isNight ? '#080a10' : '#161920';
  ctx.fillRect(0, 0, width, height);

  const floors = 9;
  const columns = 36;
  const floorH = height / floors;
  const colW = width / columns;

  const nightColors = [
    '#ffeaa7', '#ffd666', '#fff9e6', '#d6e8fa', '#ffc069'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;
    // 樓層層間橫樑 (Spandrel)
    ctx.fillStyle = isNight ? '#0d1017' : '#2b303c';
    ctx.fillRect(0, y, width, floorH * 0.3);

    const winY = y + floorH * 0.3;
    const winH = floorH * 0.7;

    for (let c = 0; c < columns; c++) {
      const x = c * colW;
      // 垂直鋁合金立柱
      ctx.fillStyle = isNight ? '#141822' : '#454c59';
      ctx.fillRect(x, winY, colW * 0.36, winH);

      // 窗格
      const winX = x + colW * 0.36;
      const winW = colW * 0.64;

      if (isNight) {
        if (prng() < 0.42) {
          ctx.fillStyle = nightColors[Math.floor(prng() * nightColors.length)];
          ctx.fillRect(winX, winY, winW, winH);
        } else {
          ctx.fillStyle = '#06080c';
          ctx.fillRect(winX, winY, winW, winH);
        }
      } else {
        ctx.fillStyle = '#1c2634';
        ctx.fillRect(winX, winY, winW, winH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 建立 WTC 7 暖紅赤褐色花崗岩立面程序化紋理 (47 層摩天大樓)
 */
function createWTC7Texture(isNight = false) {
  const width = 512;
  const height = 1024;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(70707);

  // 暖紅赤褐色花崗岩底色
  ctx.fillStyle = isNight ? '#1f0d0b' : '#6d3228';
  ctx.fillRect(0, 0, width, height);

  const floors = 47;
  const columns = 28;
  const floorH = height / floors;
  const colW = width / columns;

  const nightColors = [
    '#ffe699', '#ffcc66', '#fff6db', '#e0ecf8', '#ffb84d'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;
    // 花崗岩窗台樑帶
    ctx.fillStyle = isNight ? '#2a120f' : '#853e32';
    ctx.fillRect(0, y, width, floorH * 0.32);

    const winY = y + floorH * 0.32;
    const winH = floorH * 0.68;

    for (let c = 0; c < columns; c++) {
      const x = c * colW;
      // 垂直花崗岩壁柱 (Piers)
      ctx.fillStyle = isNight ? '#230f0c' : '#77372c';
      ctx.fillRect(x, winY, colW * 0.3, winH);

      // 辦公室採光大窗
      const winX = x + colW * 0.3;
      const winW = colW * 0.7;

      if (isNight) {
        if (prng() < 0.45) {
          ctx.fillStyle = nightColors[Math.floor(prng() * nightColors.length)];
          ctx.fillRect(winX, winY, winW, winH);
        } else {
          ctx.fillStyle = '#0a0d12';
          ctx.fillRect(winX, winY, winW, winH);
        }
      } else {
        ctx.fillStyle = '#263342';
        ctx.fillRect(winX, winY, winW, winH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 建立屋頂航空障礙標誌燈 (Red Aviation Warning Beacon)
 */
function createAviationBeacon(beaconsList, beaconMat, x, y, z) {
  const beaconGeo = new THREE.SphereGeometry(0.55, 8, 8);
  const mesh = new THREE.Mesh(beaconGeo, beaconMat);
  mesh.position.set(x, y, z);
  beaconsList.push(mesh);
  return mesh;
}

/**
 * 1. 建造 WTC 3 (Vista / Marriott Hotel): 22 層 (~74m)，階梯狀造型
 */
function buildWTC3(root, textures, beaconMat, materialsRegistry, beaconsList, pos) {
  const group = new THREE.Group();
  group.name = 'WTC_3_MarriottHotel';
  group.position.set(pos.x, pos.y, pos.z);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.wtc3Day,
    roughness: 0.42,
    metalness: 0.58,
    emissive: new THREE.Color(0x000000),
    emissiveMap: null,
    emissiveIntensity: 0.0
  });
  materialsRegistry.push({ material: mat, dayMap: textures.wtc3Day, nightMap: textures.wtc3Night });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.85,
    metalness: 0.2
  });

  // 三段式階梯造型 (Stepped Facade Massing)
  // 第一階 (Tier 1, 1-10 樓, 高 34m, 進深 50m, 面寬 24m)
  const t1W = 24;
  const t1D = 50;
  const t1H = 34;
  const tier1Geo = new THREE.BoxGeometry(t1W, t1H, t1D);
  const tier1Mesh = new THREE.Mesh(tier1Geo, mat);
  tier1Mesh.position.set(0, t1H / 2, 0);
  tier1Mesh.castShadow = true;
  tier1Mesh.receiveShadow = true;
  group.add(tier1Mesh);

  // 第二階 (Tier 2, 11-17 樓, 高 22m, 進深 38m, 面寬 24m, 向南/西階梯退縮)
  const t2W = 24;
  const t2D = 38;
  const t2H = 22;
  const tier2Geo = new THREE.BoxGeometry(t2W, t2H, t2D);
  const tier2Mesh = new THREE.Mesh(tier2Geo, mat);
  tier2Mesh.position.set(0, t1H + t2H / 2, -6);
  tier2Mesh.castShadow = true;
  tier2Mesh.receiveShadow = true;
  group.add(tier2Mesh);

  // 第三階頂層 (Tier 3, 18-22 樓, 高 18m, 總標高 74m, 進深 26m, 面寬 24m)
  const t3W = 24;
  const t3D = 26;
  const t3H = 18;
  const tier3Geo = new THREE.BoxGeometry(t3W, t3H, t3D);
  const tier3Mesh = new THREE.Mesh(tier3Geo, mat);
  tier3Mesh.position.set(0, t1H + t2H + t3H / 2, -12);
  tier3Mesh.castShadow = true;
  tier3Mesh.receiveShadow = true;
  group.add(tier3Mesh);

  // 頂部機房閣樓 (Penthouse)
  const phGeo = new THREE.BoxGeometry(14, 3.5, 14);
  const phMesh = new THREE.Mesh(phGeo, roofMat);
  phMesh.position.set(0, 74 + 1.75, -12);
  phMesh.castShadow = true;
  group.add(phMesh);

  // 西側地面挑高迎賓車道大雨遮 (Hotel Entrance Canopy)
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x161a22,
    metalness: 0.8,
    roughness: 0.3
  });
  const canopyGeo = new THREE.BoxGeometry(7, 0.6, 16);
  const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
  canopyMesh.position.set(-t1W / 2 - 3.5, 4.2, 0);
  canopyMesh.castShadow = true;
  group.add(canopyMesh);

  // 雨遮支撐柱
  const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.2, 8);
  for (let pz of [-7, 7]) {
    const post = new THREE.Mesh(postGeo, canopyMat);
    post.position.set(-t1W / 2 - 6.5, 2.1, pz);
    group.add(post);
  }

  // 屋頂四角航空障礙紅燈
  group.add(createAviationBeacon(beaconsList, beaconMat, -t3W / 2 + 1, 74.6, -12 - t3D / 2 + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, t3W / 2 - 1, 74.6, -12 - t3D / 2 + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, -t3W / 2 + 1, 74.6, -12 + t3D / 2 - 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, t3W / 2 - 1, 74.6, -12 + t3D / 2 - 1));

  root.add(group);
}

/**
 * 2. 建造 WTC 4 (東南側 9 層辦公樓): 9 層 (~36m)
 */
function buildWTC4(root, textures, beaconMat, materialsRegistry, beaconsList, pos) {
  const group = new THREE.Group();
  group.name = 'WTC_4_SoutheastBuilding';
  group.position.set(pos.x, pos.y, pos.z);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.lowRiseDay,
    roughness: 0.40,
    metalness: 0.60,
    emissive: new THREE.Color(0x000000),
    emissiveMap: null,
    emissiveIntensity: 0.0
  });
  materialsRegistry.push({ material: mat, dayMap: textures.lowRiseDay, nightMap: textures.lowRiseNight });

  const colonnadeMat = new THREE.MeshStandardMaterial({
    color: 0x232730,
    roughness: 0.65,
    metalness: 0.35
  });

  const lobbyGlassMat = new THREE.MeshStandardMaterial({
    color: 0x182432,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.85
  });

  const width = 42;
  const depth = 42;
  const height = 36;
  const colonnadeHeight = 7.5;

  // 1. 底層新哥德式柱廊內凹大廳核心 (y = 0 ~ 7.5m)
  const lobbyGeo = new THREE.BoxGeometry(width - 4, colonnadeHeight, depth - 4);
  const lobbyMesh = new THREE.Mesh(lobbyGeo, lobbyGlassMat);
  lobbyMesh.position.y = colonnadeHeight / 2;
  group.add(lobbyMesh);

  // 2. 外圍挑高立柱 (Slender Yamasaki Arcade Columns)
  const colGeo = new THREE.BoxGeometry(0.7, colonnadeHeight, 0.7);
  const colSpacing = 4.2;
  const halfW = width / 2;
  const halfD = depth / 2;

  for (let x = -halfW; x <= halfW + 0.1; x += colSpacing) {
    const col1 = new THREE.Mesh(colGeo, colonnadeMat);
    col1.position.set(x, colonnadeHeight / 2, halfD);
    group.add(col1);

    const col2 = new THREE.Mesh(colGeo, colonnadeMat);
    col2.position.set(x, colonnadeHeight / 2, -halfD);
    group.add(col2);
  }
  for (let z = -halfD + colSpacing; z <= halfD - colSpacing + 0.1; z += colSpacing) {
    const col1 = new THREE.Mesh(colGeo, colonnadeMat);
    col1.position.set(halfW, colonnadeHeight / 2, z);
    group.add(col1);

    const col2 = new THREE.Mesh(colGeo, colonnadeMat);
    col2.position.set(-halfW, colonnadeHeight / 2, z);
    group.add(col2);
  }

  // 柱頂橫樑楣帶 (Entablature beam)
  const beamGeo = new THREE.BoxGeometry(width + 0.4, 1.2, depth + 0.4);
  const beamMesh = new THREE.Mesh(beamGeo, colonnadeMat);
  beamMesh.position.y = colonnadeHeight - 0.6;
  group.add(beamMesh);

  // 3. 上部 7 層密柱辦公樓主體 (y = 7.5 ~ 36m, 高 28.5m)
  const upperH = height - colonnadeHeight;
  const upperGeo = new THREE.BoxGeometry(width, upperH, depth);
  const upperMesh = new THREE.Mesh(upperGeo, mat);
  upperMesh.position.y = colonnadeHeight + upperH / 2;
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  group.add(upperMesh);

  // 4. 屋頂女兒牆與中央機電機房
  const roofH = height;
  const parapetGeo = new THREE.BoxGeometry(width + 0.3, 0.9, depth + 0.3);
  const parapetMesh = new THREE.Mesh(parapetGeo, colonnadeMat);
  parapetMesh.position.y = roofH + 0.45;
  group.add(parapetMesh);

  const phGeo = new THREE.BoxGeometry(16, 3.6, 16);
  const phMesh = new THREE.Mesh(phGeo, colonnadeMat);
  phMesh.position.y = roofH + 1.8;
  phMesh.castShadow = true;
  group.add(phMesh);

  // 四角航空警示燈
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, roofH + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, roofH + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, roofH + 1.2, halfD - 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, roofH + 1.2, halfD - 1));

  root.add(group);
}

/**
 * 3. 建造 WTC 5 (東北側 9 層辦公樓): 9 層 (~36m)
 */
function buildWTC5(root, textures, beaconMat, materialsRegistry, beaconsList, pos) {
  const group = new THREE.Group();
  group.name = 'WTC_5_NortheastBuilding';
  group.position.set(pos.x, pos.y, pos.z);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.lowRiseDay,
    roughness: 0.40,
    metalness: 0.60,
    emissive: new THREE.Color(0x000000),
    emissiveMap: null,
    emissiveIntensity: 0.0
  });
  materialsRegistry.push({ material: mat, dayMap: textures.lowRiseDay, nightMap: textures.lowRiseNight });

  const colonnadeMat = new THREE.MeshStandardMaterial({
    color: 0x232730,
    roughness: 0.65,
    metalness: 0.35
  });

  const lobbyGlassMat = new THREE.MeshStandardMaterial({
    color: 0x182432,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.85
  });

  const width = 42;
  const depth = 42;
  const height = 36;
  const colonnadeHeight = 7.5;

  // 底層柱廊大廳
  const lobbyGeo = new THREE.BoxGeometry(width - 4, colonnadeHeight, depth - 4);
  const lobbyMesh = new THREE.Mesh(lobbyGeo, lobbyGlassMat);
  lobbyMesh.position.y = colonnadeHeight / 2;
  group.add(lobbyMesh);

  // 外圍挑高立柱
  const colGeo = new THREE.BoxGeometry(0.7, colonnadeHeight, 0.7);
  const colSpacing = 4.2;
  const halfW = width / 2;
  const halfD = depth / 2;

  for (let x = -halfW; x <= halfW + 0.1; x += colSpacing) {
    const col1 = new THREE.Mesh(colGeo, colonnadeMat);
    col1.position.set(x, colonnadeHeight / 2, halfD);
    group.add(col1);

    const col2 = new THREE.Mesh(colGeo, colonnadeMat);
    col2.position.set(x, colonnadeHeight / 2, -halfD);
    group.add(col2);
  }
  for (let z = -halfD + colSpacing; z <= halfD - colSpacing + 0.1; z += colSpacing) {
    const col1 = new THREE.Mesh(colGeo, colonnadeMat);
    col1.position.set(halfW, colonnadeHeight / 2, z);
    group.add(col1);

    const col2 = new THREE.Mesh(colGeo, colonnadeMat);
    col2.position.set(-halfW, colonnadeHeight / 2, z);
    group.add(col2);
  }

  // 柱頂楣帶
  const beamGeo = new THREE.BoxGeometry(width + 0.4, 1.2, depth + 0.4);
  const beamMesh = new THREE.Mesh(beamGeo, colonnadeMat);
  beamMesh.position.y = colonnadeHeight - 0.6;
  group.add(beamMesh);

  // 上部主體
  const upperH = height - colonnadeHeight;
  const upperGeo = new THREE.BoxGeometry(width, upperH, depth);
  const upperMesh = new THREE.Mesh(upperGeo, mat);
  upperMesh.position.y = colonnadeHeight + upperH / 2;
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  group.add(upperMesh);

  // 女兒牆與機電閣樓
  const parapetGeo = new THREE.BoxGeometry(width + 0.3, 0.9, depth + 0.3);
  const parapetMesh = new THREE.Mesh(parapetGeo, colonnadeMat);
  parapetMesh.position.y = height + 0.45;
  group.add(parapetMesh);

  const phGeo = new THREE.BoxGeometry(16, 3.6, 16);
  const phMesh = new THREE.Mesh(phGeo, colonnadeMat);
  phMesh.position.y = height + 1.8;
  phMesh.castShadow = true;
  group.add(phMesh);

  // 四角警示燈
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, height + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, height + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, height + 1.2, halfD - 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, height + 1.2, halfD - 1));

  root.add(group);
}

/**
 * 4. 建造 WTC 6 (美國海關大樓 U.S. Customhouse): 8 層 (~32m)，帶中央內凹中庭
 */
function buildWTC6(root, textures, beaconMat, materialsRegistry, beaconsList, pos) {
  const group = new THREE.Group();
  group.name = 'WTC_6_USCustomhouse';
  group.position.set(pos.x, pos.y, pos.z);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.lowRiseDay,
    roughness: 0.42,
    metalness: 0.58,
    emissive: new THREE.Color(0x000000),
    emissiveMap: null,
    emissiveIntensity: 0.0
  });
  materialsRegistry.push({ material: mat, dayMap: textures.lowRiseDay, nightMap: textures.lowRiseNight });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    roughness: 0.70,
    metalness: 0.30
  });

  const atriumFloorMat = new THREE.MeshStandardMaterial({
    color: 0x3d434d,
    roughness: 0.85,
    metalness: 0.15
  });

  const width = 52;
  const depth = 52;
  const height = 32;
  const atriumW = 20;
  const atriumD = 20;

  // 四邊翼樓環抱中央內凹式中庭 (Recessed Central Atrium)
  // 北翼 (North Wing)
  const nWingD = (depth - atriumD) / 2;
  const nGeo = new THREE.BoxGeometry(width, height, nWingD);
  const nMesh = new THREE.Mesh(nGeo, mat);
  nMesh.position.set(0, height / 2, -depth / 2 + nWingD / 2);
  nMesh.castShadow = true;
  nMesh.receiveShadow = true;
  group.add(nMesh);

  // 南翼 (South Wing)
  const sMesh = new THREE.Mesh(nGeo, mat);
  sMesh.position.set(0, height / 2, depth / 2 - nWingD / 2);
  sMesh.castShadow = true;
  sMesh.receiveShadow = true;
  group.add(sMesh);

  // 西翼 (West Wing)
  const wWingW = (width - atriumW) / 2;
  const wGeo = new THREE.BoxGeometry(wWingW, height, atriumD);
  const wMesh = new THREE.Mesh(wGeo, mat);
  wMesh.position.set(-width / 2 + wWingW / 2, height / 2, 0);
  wMesh.castShadow = true;
  wMesh.receiveShadow = true;
  group.add(wMesh);

  // 東翼 (East Wing)
  const eMesh = new THREE.Mesh(wGeo, mat);
  eMesh.position.set(width / 2 - wWingW / 2, height / 2, 0);
  eMesh.castShadow = true;
  eMesh.receiveShadow = true;
  group.add(eMesh);

  // 中庭花崗岩鋪面與通透玻璃天窗基底 (y = 1.5m 托賓廣場標高)
  const atriumFloorGeo = new THREE.BoxGeometry(atriumW, 1.5, atriumD);
  const atriumFloorMesh = new THREE.Mesh(atriumFloorGeo, atriumFloorMat);
  atriumFloorMesh.position.set(0, 0.75, 0);
  group.add(atriumFloorMesh);

  // 屋頂邊緣裝飾與中央中庭護欄
  const parapetGeo = new THREE.BoxGeometry(width + 0.4, 0.9, depth + 0.4);
  const parapetMesh = new THREE.Mesh(parapetGeo, trimMat);
  parapetMesh.position.y = height + 0.45;
  group.add(parapetMesh);

  // 屋頂機電機房
  const phGeo = new THREE.BoxGeometry(14, 3.2, 14);
  const phMesh = new THREE.Mesh(phGeo, trimMat);
  phMesh.position.set(-width / 4, height + 1.6, -depth / 4);
  phMesh.castShadow = true;
  group.add(phMesh);

  // 四角航空警示燈
  const halfW = width / 2;
  const halfD = depth / 2;
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, height + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, height + 1.2, -halfD + 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, -halfW + 1, height + 1.2, halfD - 1));
  group.add(createAviationBeacon(beaconsList, beaconMat, halfW - 1, height + 1.2, halfD - 1));

  root.add(group);
}

/**
 * 5. 建造 WTC 7 (7 World Trade Center): 47 層 (~190m)，梯形平面輪廓與人行空橋
 */
function buildWTC7(root, textures, beaconMat, materialsRegistry, beaconsList, pos) {
  const group = new THREE.Group();
  group.name = 'WTC_7_TrapezoidalTower';
  group.position.set(pos.x, pos.y, pos.z);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.wtc7Day,
    roughness: 0.45,
    metalness: 0.55,
    emissive: new THREE.Color(0x000000),
    emissiveMap: null,
    emissiveIntensity: 0.0
  });
  materialsRegistry.push({ material: mat, dayMap: textures.wtc7Day, nightMap: textures.wtc7Night });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x421c17,
    roughness: 0.85,
    metalness: 0.2
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x24110e,
    roughness: 0.75,
    metalness: 0.3
  });

  const totalHeight = 190;
  const baseHeight = 22; // 下層 ConEd 變電站基座
  const southHalfW = 34; // 南立面半寬 34m (總寬 68m)
  const northHalfW = 27; // 北立面半寬 27m (總寬 54m)
  const halfD = 21;      // 進深半長 21m (總進深 42m)

  // 1. 定義梯形平面形狀 (Trapezoidal Footprint Shape)
  const shape = new THREE.Shape();
  shape.moveTo(-southHalfW, halfD);  // 西南角
  shape.lineTo(southHalfW, halfD);   // 東南角
  shape.lineTo(northHalfW, -halfD);  // 東北角
  shape.lineTo(-northHalfW, -halfD); // 西北角
  shape.closePath();

  // (A) 下層變電站基座 (y = 0 ~ 22m)
  const baseExtrudeSettings = {
    steps: 1,
    depth: baseHeight,
    bevelEnabled: false
  };
  const baseGeo = new THREE.ExtrudeGeometry(shape, baseExtrudeSettings);
  baseGeo.rotateX(Math.PI / 2); // 轉為 Y 軸向上
  baseGeo.translate(0, baseHeight, 0);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // (B) 47 層辦公塔身 (y = 22 ~ 190m, 高 168m)
  const shaftHeight = totalHeight - baseHeight;
  const shaftExtrudeSettings = {
    steps: 1,
    depth: shaftHeight,
    bevelEnabled: false
  };
  const shaftGeo = new THREE.ExtrudeGeometry(shape, shaftExtrudeSettings);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, totalHeight, 0);
  const shaftMesh = new THREE.Mesh(shaftGeo, mat);
  shaftMesh.castShadow = true;
  shaftMesh.receiveShadow = true;
  group.add(shaftMesh);

  // (C) 屋頂女兒牆與階梯式機電遮罩 (y = 190 ~ 198m)
  const phGeo = new THREE.BoxGeometry(38, 7.5, 26);
  const phMesh = new THREE.Mesh(phGeo, trimMat);
  phMesh.position.set(0, totalHeight + 3.75, 0);
  phMesh.castShadow = true;
  group.add(phMesh);

  // (D) 屋頂小型通訊天線針塔 (標高延伸至 208m)
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0xadb5bd,
    metalness: 0.85,
    roughness: 0.25
  });
  const mastGeo = new THREE.CylinderGeometry(0.3, 0.7, 16, 8);
  const mastMesh = new THREE.Mesh(mastGeo, mastMat);
  mastMesh.position.set(0, totalHeight + 7.5 + 8, 0);
  group.add(mastMesh);

  // 屋頂四角與天線尖端航空紅燈
  group.add(createAviationBeacon(beaconsList, beaconMat, -southHalfW + 2, totalHeight + 1.2, halfD - 2));
  group.add(createAviationBeacon(beaconsList, beaconMat, southHalfW - 2, totalHeight + 1.2, halfD - 2));
  group.add(createAviationBeacon(beaconsList, beaconMat, -northHalfW + 2, totalHeight + 1.2, -halfD + 2));
  group.add(createAviationBeacon(beaconsList, beaconMat, northHalfW - 2, totalHeight + 1.2, -halfD + 2));
  group.add(createAviationBeacon(beaconsList, beaconMat, 0, totalHeight + 23.5, 0));

  // (E) 橫跨維西街 (Vesey St) 連接托賓廣場的高架人行空橋 (Promenade Pedestrian Bridge)
  // 從 7 WTC 南面 (z = halfD) 向南跨越 Vesey St 延伸至托賓廣場外緣 (約 45 米跨距)
  const bridgeLength = 46;
  const bridgeWidth = 8.5;
  const bridgeDeckHeight = 7.2; // 離地面標高 7.2m
  const bridgeDeckThickness = 1.0;

  const bridgeDeckMat = new THREE.MeshStandardMaterial({
    color: 0x4a505b,
    roughness: 0.72,
    metalness: 0.25
  });

  const bridgeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x223548,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.75
  });

  const bridgeCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2f38,
    roughness: 0.60,
    metalness: 0.40
  });

  // 空橋橋身組
  const bridgeGroup = new THREE.Group();
  bridgeGroup.name = 'WTC_7_PromenadeBridge';

  // 橋面主體 (向南延伸)
  const bCenterZ = halfD + bridgeLength / 2;
  const bDeckGeo = new THREE.BoxGeometry(bridgeWidth, bridgeDeckThickness, bridgeLength);
  const bDeckMesh = new THREE.Mesh(bDeckGeo, bridgeDeckMat);
  bDeckMesh.position.set(0, bridgeDeckHeight, bCenterZ);
  bDeckMesh.castShadow = true;
  bDeckMesh.receiveShadow = true;
  bridgeGroup.add(bDeckMesh);

  // 空橋兩側玻璃擋風窗罩 (高 2.4m)
  const bGlassGeo = new THREE.BoxGeometry(0.2, 2.4, bridgeLength);
  const leftGlass = new THREE.Mesh(bGlassGeo, bridgeGlassMat);
  leftGlass.position.set(-bridgeWidth / 2 + 0.1, bridgeDeckHeight + 1.2 + 0.5, bCenterZ);
  bridgeGroup.add(leftGlass);

  const rightGlass = new THREE.Mesh(bGlassGeo, bridgeGlassMat);
  rightGlass.position.set(bridgeWidth / 2 - 0.1, bridgeDeckHeight + 1.2 + 0.5, bCenterZ);
  bridgeGroup.add(rightGlass);

  // 空橋頂部採光遮陽頂棚
  const bRoofGeo = new THREE.BoxGeometry(bridgeWidth + 0.6, 0.4, bridgeLength);
  const bRoofMesh = new THREE.Mesh(bRoofGeo, bridgeCanopyMat);
  bRoofMesh.position.set(0, bridgeDeckHeight + 3.1, bCenterZ);
  bRoofMesh.castShadow = true;
  bridgeGroup.add(bRoofMesh);

  // 跨街支撐圓柱鋼橋墩 (3 對對稱橋墩)
  const pierGeo = new THREE.CylinderGeometry(0.7, 0.7, bridgeDeckHeight, 12);
  const pierSpacing = bridgeLength / 3;
  for (let i = 1; i <= 2; i++) {
    const pz = halfD + i * pierSpacing;
    const p1 = new THREE.Mesh(pierGeo, bridgeDeckMat);
    p1.position.set(-bridgeWidth / 2 + 0.8, bridgeDeckHeight / 2, pz);
    p1.castShadow = true;
    bridgeGroup.add(p1);

    const p2 = new THREE.Mesh(pierGeo, bridgeDeckMat);
    p2.position.set(bridgeWidth / 2 - 0.8, bridgeDeckHeight / 2, pz);
    p2.castShadow = true;
    bridgeGroup.add(p2);
  }

  group.add(bridgeGroup);
  root.add(group);
}

/**
 * 建立世貿中心附屬建築群 (WTC 3, 4, 5, 6, 7)
 *
 * @param {Object} [options={}]
 * @param {{x: number, y: number, z: number}} [options.wtc3Pos] - WTC 3 萬豪酒店座標 (預設: -42, 0, 42)
 * @param {{x: number, y: number, z: number}} [options.wtc4Pos] - WTC 4 東南側樓座標 (預設: 60, 0, -45)
 * @param {{x: number, y: number, z: number}} [options.wtc5Pos] - WTC 5 東北側樓座標 (預設: 65, 0, -115)
 * @param {{x: number, y: number, z: number}} [options.wtc6Pos] - WTC 6 海關大樓座標 (預設: -70, 0, -145)
 * @param {{x: number, y: number, z: number}} [options.wtc7Pos] - WTC 7 梯形大樓座標 (預設: -45, 0, -210)
 * @param {boolean} [options.isNight=false] - 初始夜間狀態
 * @returns {{
 *   group: THREE.Group,
 *   setNightMode: (isNight: boolean) => void,
 *   update: (delta: number, time: number) => void
 * }}
 */
export function createWTCComplex(options = {}) {
  const group = new THREE.Group();
  group.name = 'WTC_Surrounding_Complex';

  const isNightInit = !!options.isNight;

  // 建築位置配置
  const wtc3Pos = options.wtc3Pos || { x: -42, y: 0, z: 42 };
  const wtc4Pos = options.wtc4Pos || { x: 60, y: 0, z: -45 };
  const wtc5Pos = options.wtc5Pos || { x: 65, y: 0, z: -115 };
  const wtc6Pos = options.wtc6Pos || { x: -70, y: 0, z: -145 };
  const wtc7Pos = options.wtc7Pos || { x: -45, y: 0, z: -210 };

  // 1. 生成專屬程序化立面紋理 (日間與夜間)
  const textures = {
    wtc3Day: createWTC3Texture(false),
    wtc3Night: createWTC3Texture(true),
    lowRiseDay: createLowRiseTexture(false, 40506),
    lowRiseNight: createLowRiseTexture(true, 40506),
    wtc7Day: createWTC7Texture(false),
    wtc7Night: createWTC7Texture(true)
  };

  // 2. 航空障礙紅燈共用材質
  const beaconMat = new THREE.MeshStandardMaterial({
    color: isNightInit ? 0xff3333 : 0x440000,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: isNightInit ? 2.5 : 0.0,
    roughness: 0.25,
    metalness: 0.3
  });

  const materialsRegistry = [];
  const beaconsList = [];

  // 3. 建造五座核心附屬大樓
  buildWTC3(group, textures, beaconMat, materialsRegistry, beaconsList, wtc3Pos);
  buildWTC4(group, textures, beaconMat, materialsRegistry, beaconsList, wtc4Pos);
  buildWTC5(group, textures, beaconMat, materialsRegistry, beaconsList, wtc5Pos);
  buildWTC6(group, textures, beaconMat, materialsRegistry, beaconsList, wtc6Pos);
  buildWTC7(group, textures, beaconMat, materialsRegistry, beaconsList, wtc7Pos);

  let currentIsNight = isNightInit;

  // 4. 定義日夜切換處理
  const setNightMode = (isNight) => {
    currentIsNight = !!isNight;

    materialsRegistry.forEach(({ material, dayMap, nightMap }) => {
      material.map = isNight ? nightMap : dayMap;
      material.emissiveMap = isNight ? nightMap : null;
      material.emissive.set(isNight ? 0xffffff : 0x000000);
      material.emissiveIntensity = isNight ? 0.95 : 0.0;
      material.needsUpdate = true;
    });

    beaconMat.emissiveIntensity = isNight ? 2.5 : 0.0;
    beaconMat.color.setHex(isNight ? 0xff3333 : 0x440000);
    beaconMat.needsUpdate = true;
  };

  if (isNightInit) {
    setNightMode(true);
  }

  // 5. 每幀微動態 (航空障礙警示燈規律慢速閃爍)
  const update = (delta, time) => {
    if (currentIsNight && beaconMat) {
      // 緩慢呼吸與跳閃律動 (1.8s 週期)
      const pulse = 0.5 + 0.5 * Math.sin((time || performance.now() * 0.001) * 3.5);
      beaconMat.emissiveIntensity = 1.4 + pulse * 1.5;
    }
  };

  return {
    group,
    setNightMode,
    update
  };
}
