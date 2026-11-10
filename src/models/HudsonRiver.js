/**
 * HudsonRiver.js
 * 哈德遜河（Hudson River）水域、動態流體水波倒影與紐約港巡航渡輪（Cruising Ferry）
 *
 * 歷史與地理背景：
 * - 位於曼哈頓下城砲台公園城（Battery Park City）海堤以西的寬廣哈德遜河口水域。
 * - 東側依傍世界金融中心（World Financial Center）花崗岩海堤步道與冬季花園中庭，
 *   西側遙望紐澤西州澤西市（Jersey City）。
 * - 紐約港往返哈德遜河的水上客運渡輪（NY Waterway / Staten Island Ferry 經典渡輪），
 *   在河道上平緩巡航，串聯下城與對岸水運交通。
 *
 * 系統架構特色：
 * 1. 哈德遜河水面（Hudson River Surface）：
 *    - 廣闊跨度：x = -294m 至 -1650m，z = -1450m 至 +1450m，標高 y = -1.2m。
 *    - 深藍高光鏡面水體（0x0b1d30），低粗糙度（roughness: 0.15）與高金屬度（metalness: 0.85），
 *      完美倒映藍天白雲、曼哈頓摩天群樓與世貿雙塔紀念天際光柱。
 *    - 雙向無縫無窮連續循環 CanvasTexture 法線/Bump 貼圖，透過 GPU UV 偏移（offset.x / offset.y）滾動，
 *      每幀 0 CPU 記憶體分配與 0 垃圾回收開銷，維持極致 60+ FPS。
 *    - 砲台公園城水岸海堤邊緣水沫接觸浪帶。
 *
 * 2. 紐約港雙層客運渡輪（Cruising Ferry）：
 *    - 尺度：長約 36m、寬約 9.6m、總高約 11.2m。
 *    - 結構層次：
 *      * 下層深海軍藍船體與吃水線紅色防汙漆、船艏破浪傾角、防撞耐磨橡膠護條。
 *      * 主客艙：亮白上層建築、暖黃金光 passenger 側窗帶、前甲板繫泊柱與起錨機。
 *      * 上層漫步甲板（Promenade Deck）：全周安全護欄、室外長椅、救生圈、救生筏圓筒。
 *      * 駕駛台艦橋（Pilot Wheelhouse）：傾斜風擋玻璃、旋轉雷達掃描儀、氣笛、探照燈。
 *      * 雙排氣煙囪（Dual Exhaust Smokestacks）：後傾雙煙囪、經典海軍藍與金橘條紋塗裝。
 *    - 國際海上避碰規則（COLREGS）航行燈光：
 *      * 左舷紅燈（Port Red Light）
 *      * 右舷綠燈（Starboard Green Light）
 *      * 桅頂前向白色汽船燈（Masthead Steaming Light）
 *      * 船尾白色航行燈（Stern Light）
 *      * 客艙內部溫暖金黃透光（Night Cabin Glow）
 *    - 水波動態航行物理：
 *      * 封閉式膠囊航道巡航（North-South Hudson Corridor, x ≈ -465m ~ -515m, z = -445m ~ +445m）。
 *      * 抵達南北端點時平滑 180 度圓弧掉頭（Smooth Turnaround）。
 *      * 水波浮沉動態（Heave 垂直升降、Pitch 縱搖、Roll 橫搖與轉彎自然內傾角）。
 *      * 船尾動態 V 型水花碎浪尾跡（Stern Wake）。
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
 * 生成哈德遜河無縫雙向多頻水紋凹凸貼圖 (Seamless Procedural River Waves)
 * @param {number} width 
 * @param {number} height 
 * @returns {THREE.CanvasTexture}
 */
function createRiverWaterBumpTexture(width = 512, height = 512) {
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // 使用精確的週期諧波疊加，確保在 wrapS/wrapT RepeatWrapping 下 100% 無縫拼貼
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * Math.PI * 2;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * Math.PI * 2;

      // 1. 低頻廣闊河面湧浪 (Broad river swells)
      const w1 = Math.sin(nx * 3.0 + ny * 2.0);
      const w2 = Math.cos(nx * 5.0 - ny * 4.0) * 0.55;

      // 2. 中頻風向行進微浪 (Wind-driven chop)
      const w3 = Math.sin((nx + ny) * 8.0) * 0.35;
      const w4 = Math.cos((nx - ny) * 11.0) * 0.22;

      // 3. 高頻毛細漣漪 (Capillary ripples)
      const w5 = Math.sin(nx * 14.0 + ny * 9.0) * 0.15;
      const w6 = Math.cos(nx * 22.0 - ny * 18.0) * 0.08;

      const combined = (w1 + w2 + w3 + w4 + w5 + w6) / 2.35; // 正規化至約 [-1, 1]
      const heightValue = Math.floor(Math.min(255, Math.max(0, (combined * 0.5 + 0.5) * 255)));

      const idx = (y * width + x) * 4;
      data[idx] = heightValue;
      data[idx + 1] = heightValue;
      data[idx + 2] = heightValue;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(48, 96); // 寬闊河道最佳波紋密度
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

/**
 * 建立船尾動態碎浪尾跡貼圖 (Stern Wake Foam Texture)
 */
function createWakeFoamTexture(width = 256, height = 512) {
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // 繪製 V 型發散泡沫帶
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.2, 'rgba(220, 240, 255, 0.65)');
  grad.addColorStop(0.7, 'rgba(180, 215, 245, 0.35)');
  grad.addColorStop(1.0, 'rgba(150, 190, 230, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(width * 0.5, 0);
  ctx.lineTo(width * 0.05, height);
  ctx.lineTo(width * 0.95, height);
  ctx.closePath();
  ctx.fill();

  // 添加中心螺旋槳強勁白浪線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(width * 0.5, 0);
  ctx.lineTo(width * 0.5, height * 0.75);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 建立哈德遜河水域與動態遊弋渡輪總成
 * @param {Object} [options={}]
 * @param {boolean} [options.isNight=false] - 初始是否為夜景
 * @param {number} [options.ferrySpeed=13.5] - 渡輪巡航時速 (m/s)
 * @returns {{ group: THREE.Group, setNightMode: (isNight: boolean) => void, update: (delta: number, time: number) => void }}
 */
export function createHudsonRiver(options = {}) {
  const group = new THREE.Group();
  group.name = 'HudsonRiverWaterway';

  const isNightInit = !!options.isNight;
  const ferrySpeed = options.ferrySpeed !== undefined ? options.ferrySpeed : 13.5;

  // ========================================================
  // 1. 哈德遜河水面幾何與物理材質 (Hudson River Surface)
  // ========================================================
  const riverElevation = -1.2; // 低於海堤與步道 (y = 0 ~ 1.8)
  const riverXMin = -1650;
  const riverXMax = -294; // 貼合砲台公園城花崗岩海堤 (x ≈ -294.5)
  const riverWidth = riverXMax - riverXMin; // 1356m
  const riverCenterX = (riverXMin + riverXMax) * 0.5; // -972m

  const riverZLength = 2900; // z = -1450 至 +1450
  const riverCenterZ = 0;

  const waterBumpTexture = createRiverWaterBumpTexture(512, 512);

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: isNightInit ? 0x06111f : 0x0b1d30,
    roughness: isNightInit ? 0.12 : 0.15,
    metalness: isNightInit ? 0.88 : 0.85,
    bumpMap: waterBumpTexture,
    bumpScale: 0.75
  });

  const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverZLength, 32, 64);
  riverGeometry.rotateX(-Math.PI * 0.5);

  const riverMesh = new THREE.Mesh(riverGeometry, waterMaterial);
  riverMesh.position.set(riverCenterX, riverElevation, riverCenterZ);
  riverMesh.receiveShadow = true;
  group.add(riverMesh);

  // 砲台公園城水岸海堤浪沫接觸帶 (Shoreline Seawall Foam Strip)
  const foamGeometry = new THREE.PlaneGeometry(3.5, riverZLength);
  foamGeometry.rotateX(-Math.PI * 0.5);
  const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8ddf0,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });
  const shorelineFoam = new THREE.Mesh(foamGeometry, foamMaterial);
  shorelineFoam.position.set(-295.6, riverElevation + 0.02, 0);
  group.add(shorelineFoam);

  // ========================================================
  // 2. 紐約港客運雙層渡輪模型 (Cruising Passenger Ferry)
  // ========================================================
  const ferryRootGroup = new THREE.Group();
  ferryRootGroup.name = 'NYHarborFerry';

  // 內部模型組，專用於水波浮沉 (Heave, Pitch, Roll) 動態，不影響父級的航向路徑旋轉
  const ferryMotionGroup = new THREE.Group();
  ferryRootGroup.add(ferryMotionGroup);

  // --- 材質庫 ---
  // 下層船體深海軍藍
  const hullNavyMat = new THREE.MeshStandardMaterial({
    color: 0x142236,
    roughness: 0.42,
    metalness: 0.28
  });

  // 吃水線暗紅防汙漆帶 (Boot-topping stripe)
  const waterlineRedMat = new THREE.MeshStandardMaterial({
    color: 0x822121,
    roughness: 0.55,
    metalness: 0.15
  });

  // 甲板面材 (非滑海事灰)
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x7c838c,
    roughness: 0.72,
    metalness: 0.12
  });

  // 上層建築白色船身
  const cabinWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f6f8,
    roughness: 0.32,
    metalness: 0.18
  });

  // 紐約經典橘黃裝飾腰線 (NY Orange stripe)
  const stripeOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xd9751e,
    roughness: 0.38,
    metalness: 0.22
  });

  // 客艙亮燈客窗 (夜間散發溫暖金黃透光)
  const cabinWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: 0xffaa33,
    emissiveIntensity: isNightInit ? 1.25 : 0.25,
    roughness: 0.15,
    metalness: 0.40
  });

  // 駕駛台天幕景觀藍綠低反光玻璃
  const bridgeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x6ca3c2,
    roughness: 0.12,
    metalness: 0.85,
    transparent: true,
    opacity: 0.78
  });

  // 金屬安全護欄與桅杆
  const metalRailingMat = new THREE.MeshStandardMaterial({
    color: 0xd2d7de,
    roughness: 0.28,
    metalness: 0.75
  });

  // 雙煙囪深海軍藍本體
  const funnelNavyMat = new THREE.MeshStandardMaterial({
    color: 0x18263a,
    roughness: 0.38,
    metalness: 0.32
  });

  // 煙囪頂端抗煙黑圈
  const funnelSootMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.65,
    metalness: 0.2
  });

  // 橡膠防碰碰墊 (Heavy-duty rub-rail)
  const rubberBumperMat = new THREE.MeshStandardMaterial({
    color: 0x121418,
    roughness: 0.82,
    metalness: 0.05
  });

  // 救生圈鮮橘色
  const lifeRingMat = new THREE.MeshStandardMaterial({
    color: 0xe65100,
    roughness: 0.45,
    metalness: 0.1
  });

  // --- 航行信號燈材質 ---
  const navPortMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e }); // 左舷紅燈
  const navStarboardMat = new THREE.MeshBasicMaterial({ color: 0x22ff44 }); // 右舷綠燈
  const navWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // 桅頂/艉白燈

  // --------------------------------------------------------
  // A. 船體 (Lower Hull & Main Deck Structure)
  // 渡輪主體長 36m、寬 9.6m、吃水 1.2m
  // 渡輪船艏朝向 -Z 方向
  // --------------------------------------------------------
  const hullGroup = new THREE.Group();

  // (1) 船底中央主體
  const mainHullGeo = new THREE.BoxGeometry(9.6, 2.2, 22.0);
  const mainHull = new THREE.Mesh(mainHullGeo, hullNavyMat);
  mainHull.position.set(0, -0.1, 0);
  mainHull.castShadow = true;
  hullGroup.add(mainHull);

  // (2) 破浪前艏 (Bow Wedge): 兩段漸縮楔形
  const bowMidGeo = new THREE.BoxGeometry(8.2, 2.2, 7.0);
  const bowMid = new THREE.Mesh(bowMidGeo, hullNavyMat);
  bowMid.position.set(0, -0.1, -14.2);
  bowMid.castShadow = true;
  hullGroup.add(bowMid);

  const bowProwGeo = new THREE.BoxGeometry(4.4, 2.3, 5.0);
  const bowProw = new THREE.Mesh(bowProwGeo, hullNavyMat);
  bowProw.position.set(0, -0.05, -19.0);
  bowProw.castShadow = true;
  hullGroup.add(bowProw);

  // (3) 船艉 (Stern Transom)
  const sternGeo = new THREE.BoxGeometry(8.6, 2.2, 6.0);
  const stern = new THREE.Mesh(sternGeo, hullNavyMat);
  stern.position.set(0, -0.1, 13.8);
  stern.castShadow = true;
  hullGroup.add(stern);

  // (4) 吃水線紅色防汙漆條帶 (Red Boot-topping Perimeter)
  const bootGeo = new THREE.BoxGeometry(9.72, 0.42, 35.6);
  const bootStripe = new THREE.Mesh(bootGeo, waterlineRedMat);
  bootStripe.position.set(0, -0.75, -1.0);
  hullGroup.add(bootStripe);

  // (5) 外周防撞護舷膠條 (Rubbing Strakes)
  const bumperGeo = new THREE.BoxGeometry(9.84, 0.35, 36.2);
  const bumper = new THREE.Mesh(bumperGeo, rubberBumperMat);
  bumper.position.set(0, 0.95, -1.0);
  hullGroup.add(bumper);

  ferryMotionGroup.add(hullGroup);

  // --------------------------------------------------------
  // B. 主層客艙 (Main Deck Enclosed Cabin)
  // --------------------------------------------------------
  const mainDeckGroup = new THREE.Group();

  // 主甲板鋪面基板
  const mainDeckFloorGeo = new THREE.BoxGeometry(9.4, 0.3, 35.0);
  const mainDeckFloor = new THREE.Mesh(mainDeckFloorGeo, deckMat);
  mainDeckFloor.position.set(0, 1.15, -1.0);
  mainDeckFloor.receiveShadow = true;
  mainDeckGroup.add(mainDeckFloor);

  // 主客艙主體白色艙房 (長 26m, 寬 7.8m, 高 2.7m)
  const cabinGeo = new THREE.BoxGeometry(7.8, 2.7, 26.0);
  const cabin = new THREE.Mesh(cabinGeo, cabinWhiteMat);
  cabin.position.set(0, 2.65, 0.5);
  cabin.castShadow = true;
  mainDeckGroup.add(cabin);

  // 經典亮橘色線條帶 (Mid-cabin stripe)
  const stripeGeo = new THREE.BoxGeometry(7.86, 0.32, 26.04);
  const cabinStripe = new THREE.Mesh(stripeGeo, stripeOrangeMat);
  cabinStripe.position.set(0, 2.3, 0.5);
  mainDeckGroup.add(cabinStripe);

  // 兩側連續景觀客窗帶 (Port & Starboard Windows)
  const windowCount = 10;
  const winW = 1.35;
  const winH = 0.95;
  const winGeo = new THREE.BoxGeometry(0.12, winH, winW);

  for (let i = 0; i < windowCount; i++) {
    const zPos = -10.5 + i * 2.35;
    // 左舷窗戶
    const portWin = new THREE.Mesh(winGeo, cabinWindowMat);
    portWin.position.set(-3.92, 2.85, zPos);
    mainDeckGroup.add(portWin);

    // 右舷窗戶
    const starWin = new THREE.Mesh(winGeo, cabinWindowMat);
    starWin.position.set(3.92, 2.85, zPos);
    mainDeckGroup.add(starWin);
  }

  // 艏部前向客廳觀景窗 (Bow front windows)
  const bowWinGeo = new THREE.BoxGeometry(1.4, winH, 0.12);
  for (let j = -2; j <= 2; j++) {
    if (j === 0) continue; // 留出中央安全結構
    const bowWin = new THREE.Mesh(bowWinGeo, cabinWindowMat);
    bowWin.position.set(j * 1.5, 2.85, -12.55);
    mainDeckGroup.add(bowWin);
  }

  // 前後甲板繫泊柱 (Mooring Bitts / Bollards)
  const bittGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 8);
  const bittPositions = [
    [-3.2, 1.5, -16.5],
    [3.2, 1.5, -16.5],
    [-3.6, 1.5, 15.5],
    [3.6, 1.5, 15.5]
  ];
  bittPositions.forEach(([bx, by, bz]) => {
    const bitt = new THREE.Mesh(bittGeo, metalRailingMat);
    bitt.position.set(bx, by, bz);
    mainDeckGroup.add(bitt);
  });

  ferryMotionGroup.add(mainDeckGroup);

  // --------------------------------------------------------
  // C. 上層漫步甲板 (Upper Promenade Deck)
  // --------------------------------------------------------
  const upperDeckGroup = new THREE.Group();

  // 上層甲板地板 (長 28m, 寬 8.6m)
  const upperFloorGeo = new THREE.BoxGeometry(8.6, 0.25, 28.0);
  const upperFloor = new THREE.Mesh(upperFloorGeo, deckMat);
  upperFloor.position.set(0, 4.12, 0.5);
  upperFloor.receiveShadow = true;
  upperDeckGroup.add(upperFloor);

  // 上層小客艙 / 旅客沙龍 (Upper Salon: 長 16m, 寬 6.2m, 高 2.5m)
  const upperCabinGeo = new THREE.BoxGeometry(6.2, 2.5, 16.0);
  const upperCabin = new THREE.Mesh(upperCabinGeo, cabinWhiteMat);
  upperCabin.position.set(0, 5.45, -0.5);
  upperCabin.castShadow = true;
  upperDeckGroup.add(upperCabin);

  // 上層客艙兩側窗戶
  const upperWinCount = 6;
  for (let i = 0; i < upperWinCount; i++) {
    const zPos = -6.8 + i * 2.3;
    const portWin = new THREE.Mesh(winGeo, cabinWindowMat);
    portWin.position.set(-3.12, 5.65, zPos);
    upperDeckGroup.add(portWin);

    const starWin = new THREE.Mesh(winGeo, cabinWindowMat);
    starWin.position.set(3.12, 5.65, zPos);
    upperDeckGroup.add(starWin);
  }

  // 上層周圍安全護欄 (Promenade Railings)
  const railBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 27.6, 6);
  // 左舷護欄
  const portRail = new THREE.Mesh(railBarGeo, metalRailingMat);
  portRail.rotation.x = Math.PI * 0.5;
  portRail.position.set(-4.15, 5.0, 0.5);
  upperDeckGroup.add(portRail);

  // 右舷護欄
  const starRail = new THREE.Mesh(railBarGeo, metalRailingMat);
  starRail.rotation.x = Math.PI * 0.5;
  starRail.position.set(4.15, 5.0, 0.5);
  upperDeckGroup.add(starRail);

  // 艉端護欄
  const sternRailBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.3, 6);
  const sternRail = new THREE.Mesh(sternRailBarGeo, metalRailingMat);
  sternRail.rotation.z = Math.PI * 0.5;
  sternRail.position.set(0, 5.0, 14.3);
  upperDeckGroup.add(sternRail);

  // 護欄立柱 (Posts)
  const postGeo = new THREE.BoxGeometry(0.08, 0.9, 0.08);
  for (let p = 0; p <= 12; p++) {
    const zPos = -13.0 + p * 2.25;
    const pPost = new THREE.Mesh(postGeo, metalRailingMat);
    pPost.position.set(-4.15, 4.65, zPos);
    upperDeckGroup.add(pPost);

    const sPost = new THREE.Mesh(postGeo, metalRailingMat);
    sPost.position.set(4.15, 4.65, zPos);
    upperDeckGroup.add(sPost);
  }

  // 圓柱形救生筏儲存桶 (Inflatable Life Raft Canisters)
  const raftGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.6, 8);
  raftGeo.rotateZ(Math.PI * 0.5);
  const raftMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const raftPositions = [
    [-3.5, 4.6, 6.5],
    [-3.5, 4.6, 9.0],
    [3.5, 4.6, 6.5],
    [3.5, 4.6, 9.0]
  ];
  raftPositions.forEach(([rx, ry, rz]) => {
    const raft = new THREE.Mesh(raftGeo, raftMat);
    raft.position.set(rx, ry, rz);
    upperDeckGroup.add(raft);
  });

  // 鮮橘色救生圈 (Lifebuoys)
  const ringGeo = new THREE.TorusGeometry(0.36, 0.1, 8, 16);
  const ringL = new THREE.Mesh(ringGeo, lifeRingMat);
  ringL.position.set(-3.14, 5.5, 2.0);
  ringL.rotation.y = Math.PI * 0.5;
  upperDeckGroup.add(ringL);

  const ringR = new THREE.Mesh(ringGeo, lifeRingMat);
  ringR.position.set(3.14, 5.5, 2.0);
  ringR.rotation.y = Math.PI * 0.5;
  upperDeckGroup.add(ringR);

  ferryMotionGroup.add(upperDeckGroup);

  // --------------------------------------------------------
  // D. 駕駛台艦橋 (Pilot Wheelhouse & Bridge)
  // --------------------------------------------------------
  const bridgeGroup = new THREE.Group();

  // 駕駛室基底與主體
  const bridgeCabinGeo = new THREE.BoxGeometry(5.0, 2.2, 4.4);
  const bridgeCabin = new THREE.Mesh(bridgeCabinGeo, cabinWhiteMat);
  bridgeCabin.position.set(0, 7.8, -5.2);
  bridgeCabin.castShadow = true;
  bridgeGroup.add(bridgeCabin);

  // 左右側翼橋 (Bridge Wings)
  const wingGeo = new THREE.BoxGeometry(1.1, 0.2, 1.8);
  const portWing = new THREE.Mesh(wingGeo, deckMat);
  portWing.position.set(-3.0, 7.2, -5.2);
  bridgeGroup.add(portWing);

  const starWing = new THREE.Mesh(wingGeo, deckMat);
  starWing.position.set(3.0, 7.2, -5.2);
  bridgeGroup.add(starWing);

  // 現代傾斜前視景觀風擋窗 (Raked Bridge Windows)
  const bridgeFrontWinGeo = new THREE.BoxGeometry(4.4, 1.0, 0.12);
  const bridgeFrontWin = new THREE.Mesh(bridgeFrontWinGeo, bridgeGlassMat);
  bridgeFrontWin.position.set(0, 8.2, -7.42);
  bridgeGroup.add(bridgeFrontWin);

  // 側向風擋窗
  const bridgeSideWinGeo = new THREE.BoxGeometry(0.12, 1.0, 2.6);
  const portBridgeWin = new THREE.Mesh(bridgeSideWinGeo, bridgeGlassMat);
  portBridgeWin.position.set(-2.52, 8.2, -5.4);
  bridgeGroup.add(portBridgeWin);

  const starBridgeWin = new THREE.Mesh(bridgeSideWinGeo, bridgeGlassMat);
  starBridgeWin.position.set(2.52, 8.2, -5.4);
  bridgeGroup.add(starBridgeWin);

  // 艦橋頂部屋頂天線桅杆 (Mast & Antennas)
  const mastPoleGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.8, 8);
  const mastPole = new THREE.Mesh(mastPoleGeo, metalRailingMat);
  mastPole.position.set(0, 10.8, -4.6);
  bridgeGroup.add(mastPole);

  const yardarmGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6);
  const yardarm = new THREE.Mesh(yardarmGeo, metalRailingMat);
  yardarm.rotation.z = Math.PI * 0.5;
  yardarm.position.set(0, 11.2, -4.6);
  bridgeGroup.add(yardarm);

  // 旋轉雷達掃描儀天線 (Rotating Radar Antenna)
  const radarPedestalGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8);
  const radarPedestal = new THREE.Mesh(radarPedestalGeo, metalRailingMat);
  radarPedestal.position.set(0, 9.15, -6.0);
  bridgeGroup.add(radarPedestal);

  const radarBarGeo = new THREE.BoxGeometry(1.6, 0.12, 0.22);
  const radarMesh = new THREE.Mesh(radarBarGeo, cabinWhiteMat);
  radarMesh.position.set(0, 9.45, -6.0);
  bridgeGroup.add(radarMesh);

  // 雙管高音氣笛 (Dual Air Horns)
  const hornGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.7, 6);
  hornGeo.rotateX(Math.PI * 0.5);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(-0.4, 9.05, -7.0);
  bridgeGroup.add(hornL);
  const hornR = new THREE.Mesh(hornGeo, hornMat);
  hornR.position.set(0.4, 9.05, -7.0);
  bridgeGroup.add(hornR);

  ferryMotionGroup.add(bridgeGroup);

  // --------------------------------------------------------
  // E. 雙排氣煙囪 (Dual Exhaust Smokestacks / Funnels)
  // 位於中後段 (x = -1.6, +1.6, z = 4.0)，微向後傾斜 8 度
  // --------------------------------------------------------
  const funnelGroup = new THREE.Group();
  const funnelH = 3.2;
  const funnelGeo = new THREE.CylinderGeometry(0.60, 0.72, funnelH, 12);
  funnelGeo.rotateX(0.14); // 向後微仰

  const funnelBandGeo = new THREE.CylinderGeometry(0.65, 0.69, 0.7, 12);
  funnelBandGeo.rotateX(0.14);

  const funnelRimGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.35, 12);
  funnelRimGeo.rotateX(0.14);

  const funnelPositionsX = [-1.65, 1.65];
  funnelPositionsX.forEach((fx) => {
    // 煙囪主身 (深海軍藍)
    const funnel = new THREE.Mesh(funnelGeo, funnelNavyMat);
    funnel.position.set(fx, 7.8, 3.8);
    funnel.castShadow = true;
    funnelGroup.add(funnel);

    // 橘金腰線環
    const band = new THREE.Mesh(funnelBandGeo, stripeOrangeMat);
    band.position.set(fx, 7.9, 3.8);
    funnelGroup.add(band);

    // 煙囪頂端抗污黑環
    const rim = new THREE.Mesh(funnelRimGeo, funnelSootMat);
    rim.position.set(fx, 9.25, 4.0);
    funnelGroup.add(rim);
  });

  ferryMotionGroup.add(funnelGroup);

  // --------------------------------------------------------
  // F. 航行燈系統 (Navigation Lights & Night Illuminations)
  // 符合國際海上避碰法規 COLREGS
  // --------------------------------------------------------
  const navLightsGroup = new THREE.Group();
  const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);

  // 1. 左舷紅燈 (Port Red Light, -X side)
  const portBulb = new THREE.Mesh(bulbGeo, navPortMat);
  portBulb.position.set(-3.45, 7.6, -5.2);
  navLightsGroup.add(portBulb);

  const portLight = new THREE.PointLight(0xff2222, isNightInit ? 1.4 : 0.2, 18, 1.2);
  portLight.position.copy(portBulb.position);
  navLightsGroup.add(portLight);

  // 2. 右舷綠燈 (Starboard Green Light, +X side)
  const starBulb = new THREE.Mesh(bulbGeo, navStarboardMat);
  starBulb.position.set(3.45, 7.6, -5.2);
  navLightsGroup.add(starBulb);

  const starLight = new THREE.PointLight(0x22ff44, isNightInit ? 1.4 : 0.2, 18, 1.2);
  starLight.position.copy(starBulb.position);
  navLightsGroup.add(starLight);

  // 3. 桅頂前向白光汽船燈 (Masthead Light)
  const mastBulb = new THREE.Mesh(bulbGeo, navWhiteMat);
  mastBulb.position.set(0, 12.6, -4.6);
  navLightsGroup.add(mastBulb);

  const mastLight = new THREE.PointLight(0xffffff, isNightInit ? 2.0 : 0.3, 30, 1.0);
  mastLight.position.copy(mastBulb.position);
  navLightsGroup.add(mastLight);

  // 4. 船尾白色航行燈 (Stern Light)
  const sternBulb = new THREE.Mesh(bulbGeo, navWhiteMat);
  sternBulb.position.set(0, 5.2, 14.45);
  navLightsGroup.add(sternBulb);

  // 5. 客艙內部透光環境光源 (Warm Cabin PointLight)
  const cabinLight = new THREE.PointLight(0xffab34, isNightInit ? 2.8 : 0.4, 45, 1.2);
  cabinLight.position.set(0, 3.2, 0);
  navLightsGroup.add(cabinLight);

  ferryMotionGroup.add(navLightsGroup);

  // --------------------------------------------------------
  // G. 船尾碎浪航跡 (Stern Dynamic Foam Wake)
  // 緊隨渡輪身後的水面發散 V 型泡沫網格
  // --------------------------------------------------------
  const wakeTexture = createWakeFoamTexture(256, 512);
  const wakeMat = new THREE.MeshBasicMaterial({
    map: wakeTexture,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // 梯形水面網格 (從船艉 z = 16m 延伸至 56m，寬度從 9m 展開至 28m)
  const wakeGeo = new THREE.PlaneGeometry(28, 40, 1, 4);
  wakeGeo.rotateX(-Math.PI * 0.5);
  const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
  wakeMesh.position.set(0, 0.02, 36.0); // 位於渡輪自身座標水線正上方
  ferryMotionGroup.add(wakeMesh);

  group.add(ferryRootGroup);

  // ========================================================
  // 3. 封閉式膠囊航道巡航軌跡演算法 (Capsule Racetrack Navigation)
  // ========================================================
  // 航道規劃：
  // - 北行直線 (Leg 1): 沿 x = -465m，自 z = +420m 航向 z = -420m (長 840m)
  // - 北端調頭 U-Turn (Turn 1): 圓心 (-490, -420)，半徑 25m，自 x = -465m 轉向 x = -515m (長 PI * 25 ≈ 78.54m)
  // - 南行直線 (Leg 2): 沿 x = -515m，自 z = -420m 航向 z = +420m (長 840m)
  // - 南端調頭 U-Turn (Turn 2): 圓心 (-490, +420)，半徑 25m，自 x = -515m 轉向 x = -465m (長 PI * 25 ≈ 78.54m)
  const zMax = 420;
  const zMin = -420;
  const straightLength = zMax - zMin; // 840m
  const turnRadius = 25; // 25m
  const turnCenterNorth = { x: -490, z: zMin };
  const turnCenterSouth = { x: -490, z: zMax };
  const turnArcLength = Math.PI * turnRadius; // ≈ 78.54m
  const totalTrackLength = straightLength * 2 + turnArcLength * 2; // ≈ 1837.08m

  let internalDistance = 0;
  let currentIsNight = isNightInit;

  // 暫存運算變數以杜絕每幀 GC
  const currentPos = { x: -465, z: 0 };
  const tangent = { x: 0, z: -1 };
  let currentTurnBank = 0;

  /**
   * 根據沿軌道行進的距離 s (0 <= s < totalTrackLength) 計算位置、切線向量與轉向內傾
   */
  function evaluateTrajectory(s) {
    // 區段 1: 北行直線 (Leg 1, 0 <= s < straightLength)
    if (s < straightLength) {
      const u = s / straightLength;
      currentPos.x = -465;
      currentPos.z = zMax - u * straightLength; // +420 -> -420
      tangent.x = 0;
      tangent.z = -1; // 航向北方 (-Z)
      currentTurnBank = 0;
      return;
    }

    // 區段 2: 北端平滑圓弧調頭 (Turn 1, straightLength <= s < straightLength + turnArcLength)
    const sTurn1 = s - straightLength;
    if (sTurn1 < turnArcLength) {
      const phi = (sTurn1 / turnArcLength) * Math.PI; // 0 -> PI
      currentPos.x = turnCenterNorth.x + turnRadius * Math.cos(phi);
      currentPos.z = turnCenterNorth.z - turnRadius * Math.sin(phi);

      // 一階導數求切線
      tangent.x = -turnRadius * Math.sin(phi);
      tangent.z = -turnRadius * Math.cos(phi);
      const len = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z) || 1;
      tangent.x /= len;
      tangent.z /= len;

      // 向左/左舷內傾 (約 1.8 度 = 0.03 rad)
      currentTurnBank = 0.03 * Math.sin(phi);
      return;
    }

    // 區段 3: 南行直線 (Leg 2, straightLength + turnArcLength <= s < 2 * straightLength + turnArcLength)
    const sLeg2 = s - (straightLength + turnArcLength);
    if (sLeg2 < straightLength) {
      const u = sLeg2 / straightLength;
      currentPos.x = -515;
      currentPos.z = zMin + u * straightLength; // -420 -> +420
      tangent.x = 0;
      tangent.z = 1; // 航向南方 (+Z)
      currentTurnBank = 0;
      return;
    }

    // 區段 4: 南端平滑圓弧調頭 (Turn 2)
    const sTurn2 = s - (2 * straightLength + turnArcLength);
    const phi = (sTurn2 / turnArcLength) * Math.PI; // 0 -> PI
    currentPos.x = turnCenterSouth.x - turnRadius * Math.cos(phi);
    currentPos.z = turnCenterSouth.z + turnRadius * Math.sin(phi);

    tangent.x = turnRadius * Math.sin(phi);
    tangent.z = turnRadius * Math.cos(phi);
    const len = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z) || 1;
    tangent.x /= len;
    tangent.z /= len;

    currentTurnBank = 0.03 * Math.sin(phi);
  }

  // ========================================================
  // 4. 日夜模式動態切換回呼
  // ========================================================
  const setNightMode = (isNight) => {
    currentIsNight = !!isNight;

    // 水面光照與倒影色澤微調
    waterMaterial.color.setHex(isNight ? 0x06111f : 0x0b1d30);
    waterMaterial.roughness = isNight ? 0.12 : 0.15;
    waterMaterial.metalness = isNight ? 0.88 : 0.85;
    waterMaterial.needsUpdate = true;

    // 客艙透光自發光強度
    cabinWindowMat.emissiveIntensity = isNight ? 1.25 : 0.25;
    cabinWindowMat.needsUpdate = true;

    // 航行燈與客艙內部點光源
    portLight.intensity = isNight ? 1.5 : 0.2;
    starLight.intensity = isNight ? 1.5 : 0.2;
    mastLight.intensity = isNight ? 2.2 : 0.3;
    cabinLight.intensity = isNight ? 2.8 : 0.4;
  };

  if (isNightInit) {
    setNightMode(true);
  }

  // ========================================================
  // 5. 每幀物理與渲染微動態更新
  // ========================================================
  /**
   * 動態更新水面紋理與渡輪航行
   * @param {number} delta - 幀時差 (秒)
   * @param {number} time - 累計總時間 (秒)
   */
  const update = (delta, time) => {
    const dt = Math.min(delta || 0.016, 0.1);
    const t = time !== undefined ? time : performance.now() * 0.001;

    // (A) 哈德遜河水面 GPU UV 滾動微動態 (0 CPU 負擔)
    if (waterBumpTexture) {
      waterBumpTexture.offset.x = (waterBumpTexture.offset.x + dt * 0.012) % 1.0;
      waterBumpTexture.offset.y = (waterBumpTexture.offset.y + dt * 0.018) % 1.0;
    }

    // (B) 渡輪軌道推進與平滑航向導向
    internalDistance = (internalDistance + ferrySpeed * dt) % totalTrackLength;
    evaluateTrajectory(internalDistance);

    // 更新渡輪世界坐標位置 (y 基準位於水面)
    ferryRootGroup.position.set(currentPos.x, riverElevation, currentPos.z);

    // 計算前向切線航向角 (渡輪預設前向為 -Z，求 Math.atan2(-tx, -tz))
    const heading = Math.atan2(-tangent.x, -tangent.z);
    ferryRootGroup.rotation.y = heading;

    // (C) 水波浮沉動態 (Water displacement bobbing)
    // 垂直升降波 (Heave: ±0.08m)
    const heaveY = 0.08 * Math.sin(t * 2.2) + 0.03 * Math.cos(t * 3.5);
    // 航行縱搖 (Pitch: 迎浪抬艏與俯仰 ±0.014 rad)
    const pitch = 0.014 * Math.sin(t * 1.8);
    // 橫搖動態 (Roll: 兩舷微幅側搖 ±0.018 rad + 轉向內傾角)
    const roll = 0.018 * Math.cos(t * 1.4) + currentTurnBank;

    ferryMotionGroup.position.y = heaveY;
    ferryMotionGroup.rotation.x = pitch;
    ferryMotionGroup.rotation.z = roll;

    // (D) 雷達天線平滑旋轉
    if (radarMesh) {
      radarMesh.rotation.y = t * 3.8;
    }

    // (E) 船尾浪花透明度呼吸起伏
    if (wakeMat) {
      wakeMat.opacity = 0.32 + 0.12 * Math.sin(t * 3.2);
    }
  };

  // 初始化首次姿態
  update(0, 0);

  return {
    group,
    setNightMode,
    update
  };
}

export default {
  createHudsonRiver
};
