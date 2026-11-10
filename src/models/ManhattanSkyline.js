/**
 * ManhattanSkyline.js
 * 紐約曼哈頓下城背景天際線群 (Lower Manhattan Background Skyline & Financial District)
 *
 * 涵蓋區域：
 * 1. 東側金融區 (East Financial District / Broadway / Church St 以東至東河岸)：
 *    - 空間範圍：x = 120m 至 650m，z = -450m 至 450m。
 *    - 包含經典地標：
 *      - 伍爾沃斯大樓 (Woolworth Building, 241m, 哥德復興尖頂與銅綠屋頂)。
 *      - 第一大通曼哈頓廣場 (1 Chase Manhattan Plaza, 248m, 國際主義現代方盒鋁合金玻璃巨構)。
 *      - 松樹街 70 號 (70 Pine Street / Cities Service, 235m, 裝飾藝術纖細退台與燈籠尖塔)。
 *      - 交易所廣場 20 號 (20 Exchange Place, 226m, 裝飾藝術石材階梯金字塔頂)。
 *      - 華爾街 40 號 (40 Wall Street / The Manhattan Company, 220m, 裝飾藝術多層階梯銅綠金字塔頂)。
 *      - 華爾街 1 號 (1 Wall Street / Irving Trust, 199m, 裝飾藝術凹槽石材退台)。
 *      - 自由廣場一號 (One Liberty Plaza, 165m, SOM 經典深色結構鋼框架大跨度黑盒)。
 *      - 百老匯 140 號 (140 Broadway / Marine Midland, 155m, 啞光黑鋼與青銅玻璃)。
 *      - 公平大樓 (Equitable Building / 120 Broadway, 164m, 新古典主義雙子退台石材巨廈)。
 *      - 曼哈頓市政大樓 (Municipal Building, 178m, 古典科林斯圓柱神殿式尖塔)。
 * 2. 南側砲台公園方向 (South toward Battery Park / Wall St 至紐約港灣邊緣)：
 *    - 空間範圍：x = -100m 至 350m，z = 180m 至 650m。
 *    - 包含經典地標：
 *      - 下城體育俱樂部 (Downtown Athletic Club, 162m, 階梯退台磚石大樓)。
 *      - 標準石油大樓 (Standard Oil Building / 26 Broadway, 158m, 滾石柱廊斜向金字塔頂)。
 *      - 沿百老匯南下與格林威治街錯落有致的辦公群樓，向海港漸進過渡。
 *
 * 渲染與效能架構：
 * - 建築群主體依材質分類批次合併為極少數幾何體 (Combined Geometry via BufferGeometryUtils.mergeGeometries)。
 * - 高於 150 米之摩天大樓頂部航空障礙警示紅燈採用單一 InstancedMesh 批次渲染。
 * - 全場景天際線 Draw Calls 嚴格控制在 5 個以內，以零額外 GPU 負擔鎖定 60 FPS 幀率。
 * - 支援日間（花崗岩、石灰石、陽極氧化鋼、反射玻璃）與夜間（隨機亮起 35%-45% 暖金/琥珀色窗格燈火）切換。
 * - 夜間模式下超過 150m 高塔頂端的紅色航空障礙燈產生緩慢正弦律動慢閃。
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

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
 * 建立石灰石/花崗岩古典及裝飾藝術建築程序化立面貼圖
 */
function createMasonryTexture(isNight = false, seed = 40101) {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  // 底色：日間暖色石灰石/砂岩，夜間深炭灰色夜空石材
  ctx.fillStyle = isNight ? '#13151b' : '#c4b8a7';
  ctx.fillRect(0, 0, width, height);

  const floors = 32;
  const columns = 32;
  const floorH = height / floors;
  const colW = width / columns;

  const nightLightColors = [
    '#ffd068', '#ffe494', '#fff5dc', '#ffd67a', '#fbebc4', '#e2effa'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;

    // 水平石材樓層飾條 (Spandrel)
    ctx.fillStyle = isNight ? '#191c24' : '#a99e8e';
    ctx.fillRect(0, y, width, floorH * 0.32);

    // 水平接縫刻痕陰影線
    ctx.fillStyle = isNight ? '#0b0c10' : '#8c8070';
    ctx.fillRect(0, y + floorH * 0.30, width, floorH * 0.035);

    const winY = y + floorH * 0.34;
    const winH = floorH * 0.62;

    for (let c = 0; c < columns; c++) {
      const x = c * colW + colW * 0.16;
      const w = colW * 0.68;

      if (isNight) {
        // 約 38% 亮燈率 (暖金、琥珀與日光色)
        if (prng() < 0.38) {
          ctx.fillStyle = nightLightColors[Math.floor(prng() * nightLightColors.length)];
          ctx.fillRect(x, winY, w, winH);

          // 窗簾/百葉窗陰影層次
          if (prng() < 0.4) {
            ctx.fillStyle = 'rgba(10, 12, 16, 0.42)';
            ctx.fillRect(x, winY, w, winH * (0.2 + prng() * 0.5));
          }
        } else {
          // 未亮燈暗窗深黑微泛光
          ctx.fillStyle = '#0a0b10';
          ctx.fillRect(x, winY, w, winH);
        }
      } else {
        // 日間：深色反光玻璃與天空微反射
        const glassBase = 46 + Math.floor(prng() * 15);
        ctx.fillStyle = `rgb(${glassBase - 6}, ${glassBase}, ${glassBase + 12})`;
        ctx.fillRect(x, winY, w, winH);

        // 部分百葉窗拉下反光
        if (prng() < 0.26) {
          ctx.fillStyle = '#dcd5c9';
          ctx.fillRect(x, winY, w, winH * (0.25 + prng() * 0.5));
        }
      }
    }
  }

  // 垂直立體壁柱 (Pilasters)
  for (let c = 0; c < columns; c++) {
    const px = c * colW;
    ctx.fillStyle = isNight ? 'rgba(30, 34, 44, 0.6)' : 'rgba(160, 150, 136, 0.55)';
    ctx.fillRect(px, 0, colW * 0.14, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 建立現代國際主義鋼骨與玻璃幕牆程序化貼圖
 */
function createGlassSteelTexture(isNight = false, seed = 50202) {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  // 底色：深灰黑陽極氧化鋼構
  ctx.fillStyle = isNight ? '#0a0c10' : '#22252c';
  ctx.fillRect(0, 0, width, height);

  const floors = 32;
  const columns = 24;
  const floorH = height / floors;
  const colW = width / columns;

  const modernNightColors = [
    '#e8f3fc', '#ffffff', '#ffd778', '#ffeaa2', '#dcf0fa', '#ffc64d'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;

    // 鋼構樓板橫樑 (Steel Spandrel Beam)
    ctx.fillStyle = isNight ? '#101319' : '#181b22';
    ctx.fillRect(0, y, width, floorH * 0.22);

    const winY = y + floorH * 0.24;
    const winH = floorH * 0.72;

    for (let c = 0; c < columns; c++) {
      const x = c * colW + colW * 0.08;
      const w = colW * 0.84;

      if (isNight) {
        // 約 42% 亮燈率 (白金、冷白日光燈與暖白商務辦公)
        if (prng() < 0.42) {
          ctx.fillStyle = modernNightColors[Math.floor(prng() * modernNightColors.length)];
          ctx.fillRect(x, winY, w, winH);

          if (prng() < 0.35) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x, winY, w, winH * 0.45);
          }
        } else {
          ctx.fillStyle = '#06070a';
          ctx.fillRect(x, winY, w, winH);
        }
      } else {
        // 日間：藍灰微深鍍膜玻璃幕牆
        const g = 60 + Math.floor(prng() * 18);
        ctx.fillStyle = `rgb(${g - 14}, ${g}, ${g + 20})`;
        ctx.fillRect(x, winY, w, winH);

        // 隨機反光與水平捲簾
        if (prng() < 0.22) {
          ctx.fillStyle = 'rgba(235, 240, 248, 0.7)';
          ctx.fillRect(x, winY, w, winH * (0.2 + prng() * 0.45));
        }
      }
    }
  }

  // 垂直金屬窗欞 (Vertical Steel Mullions)
  for (let c = 0; c <= columns; c++) {
    const mx = c * colW - 1;
    ctx.fillStyle = isNight ? '#141820' : '#333842';
    ctx.fillRect(mx, 0, 2, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 建立哥德尖頂與裝飾藝術綠色銅綠氧化 (Verdigris Copper) 屋頂貼圖
 */
function createCopperRoofTexture(isNight = false, seed = 60303) {
  const width = 256;
  const height = 256;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  // 氧化銅綠基底
  ctx.fillStyle = isNight ? '#1a2c26' : '#4a7d70';
  ctx.fillRect(0, 0, width, height);

  // 銅板立式咬接縫條紋 (Standing seams)
  const seamCount = 16;
  const seamW = width / seamCount;

  for (let i = 0; i < seamCount; i++) {
    const x = i * seamW;
    // 斑駁色差
    ctx.fillStyle = isNight ? '#20362f' : '#578f81';
    ctx.fillRect(x, 0, seamW * 0.85, height);

    // 咬接凸條立體陰影與高光
    ctx.fillStyle = isNight ? '#101d19' : '#33584e';
    ctx.fillRect(x + seamW * 0.85, 0, seamW * 0.15, height);
  }

  // 雜色質地斑駁顆粒
  for (let p = 0; p < 350; p++) {
    const px = prng() * width;
    const py = prng() * height;
    const pr = 1 + prng() * 2.5;
    ctx.fillStyle = isNight ? 'rgba(38, 65, 56, 0.45)' : 'rgba(110, 175, 158, 0.35)';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 建立大樓平頂深色瀝青/礫石防水層與機房通風口貼圖
 */
function createDarkRoofTexture(isNight = false) {
  const width = 256;
  const height = 256;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 深色瀝青礫石面
  ctx.fillStyle = isNight ? '#0d0f13' : '#2b2e36';
  ctx.fillRect(0, 0, width, height);

  // 機房通風隔柵格線
  ctx.strokeStyle = isNight ? '#14171d' : '#3a3e49';
  ctx.lineWidth = 2;
  for (let y = 16; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(width - 16, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 建立依建築尺寸自適應 UV 貼圖紋理的 BoxGeometry
 */
function createTiledBox(width, height, depth, tileW = 12, tileH = 12) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const uvs = geo.attributes.uv;
  const uRepeatX = depth / tileW;
  const uRepeatZ = width / tileW;
  const vRepeat = height / tileH;

  for (let i = 0; i < uvs.count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i);
    if (i < 8) {
      uvs.setXY(i, u * uRepeatX, v * vRepeat);
    } else if (i < 16) {
      uvs.setXY(i, u * (width / tileW), v * (depth / tileW));
    } else {
      uvs.setXY(i, u * uRepeatZ, v * vRepeat);
    }
  }
  return geo;
}

/**
 * 建立曼哈頓下城周邊天際線摩天樓群
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.isNight=false] - 初始夜間狀態
 * @returns {{
 *   group: THREE.Group,
 *   setNightMode: (isNight: boolean) => void,
 *   update: (delta: number, time: number) => void
 * }}
 */
export function createManhattanSkyline(options = {}) {
  const group = new THREE.Group();
  group.name = 'Manhattan_Skyline_Background';

  const isNightInit = !!options.isNight;

  // 1. 生成專屬程序化立面紋理 (日間與夜間)
  const textures = {
    masonryDay: createMasonryTexture(false),
    masonryNight: createMasonryTexture(true),
    glassDay: createGlassSteelTexture(false),
    glassNight: createGlassSteelTexture(true),
    copperDay: createCopperRoofTexture(false),
    copperNight: createCopperRoofTexture(true),
    roofDay: createDarkRoofTexture(false),
    roofNight: createDarkRoofTexture(true)
  };

  // 2. 幾何收集器（按材質分類以合併為少數 Mesh）
  const masonryGeos = [];
  const glassGeos = [];
  const copperGeos = [];
  const roofGeos = [];
  const beaconPositions = [];

  // 3. 建築群資料集定義
  const buildings = [];

  function addBuilding(b) {
    for (const existing of buildings) {
      if (
        Math.abs(existing.x - b.x) < (existing.w + b.w) / 2 + 5 &&
        Math.abs(existing.z - b.z) < (existing.d + b.d) / 2 + 5
      ) {
        return false;
      }
    }
    buildings.push(b);
    return true;
  }

  // --- (A) 東側與南側歷史著名地標輪廓剪影 (Signature Historic Landmarks) ---
  // 1. 伍爾沃斯大樓 (Woolworth Building, 233 Broadway) - 哥德復興尖頂地標
  addBuilding({
    name: 'Woolworth Building',
    x: 170,
    z: -215,
    w: 32,
    d: 32,
    height: 241,
    style: 'gothic_spire',
    region: 'east'
  });

  // 2. 第一大通曼哈頓廣場 (1 Chase Manhattan Plaza) - 60 層現代方盒鋁合金玻璃巨塔
  addBuilding({
    name: 'One Chase Manhattan',
    x: 310,
    z: 100,
    w: 46,
    d: 26,
    height: 248,
    style: 'modern_tower',
    region: 'east'
  });

  // 3. 松樹街 70 號 (70 Pine Street / Cities Service) - 纖細裝飾藝術金字塔尖塔
  addBuilding({
    name: '70 Pine Street',
    x: 370,
    z: 165,
    w: 30,
    d: 28,
    height: 235,
    style: 'art_deco_spire',
    region: 'east'
  });

  // 4. 交易所廣場 20 號 (20 Exchange Place) - 裝飾藝術多層階梯石材大廈
  addBuilding({
    name: '20 Exchange Place',
    x: 295,
    z: 315,
    w: 32,
    d: 30,
    height: 226,
    style: 'art_deco_spire',
    region: 'east'
  });

  // 5. 華爾街 40 號 (40 Wall Street / The Manhattan Company) - 裝飾藝術階梯銅綠金字塔頂
  addBuilding({
    name: '40 Wall Street',
    x: 285,
    z: 215,
    w: 34,
    d: 30,
    height: 220,
    style: 'art_deco_spire',
    region: 'east'
  });

  // 6. 華爾街 1 號 (1 Wall Street / Irving Trust) - 裝飾藝術凹槽石材退台
  addBuilding({
    name: '1 Wall Street',
    x: 210,
    z: 240,
    w: 34,
    d: 28,
    height: 199,
    style: 'art_deco_stepped',
    region: 'east'
  });

  // 7. 自由廣場一號 (One Liberty Plaza, 165 Broadway) - SOM 啞光深黑鋼構辦公大廈
  addBuilding({
    name: 'One Liberty Plaza',
    x: 155,
    z: 55,
    w: 38,
    d: 34,
    height: 165,
    style: 'modern_tower',
    region: 'east'
  });

  // 8. 百老匯 140 號 (140 Broadway / Marine Midland) - 梯形極簡深色幕牆
  addBuilding({
    name: '140 Broadway',
    x: 215,
    z: 65,
    w: 30,
    d: 28,
    height: 155,
    style: 'modern_tower',
    region: 'east'
  });

  // 9. 公平大樓 (Equitable Building, 120 Broadway) - 新古典雙塔退台石材大廈
  addBuilding({
    name: 'Equitable Building',
    x: 175,
    z: 120,
    w: 34,
    d: 36,
    height: 164,
    style: 'classical_mansard',
    region: 'east'
  });

  // 10. 曼哈頓市政大樓 (Municipal Building / Centre St) - 古典圓柱神殿神塔
  addBuilding({
    name: 'Municipal Building',
    x: 285,
    z: -290,
    w: 38,
    d: 28,
    height: 178,
    style: 'classical_mansard',
    region: 'east'
  });

  // 11. 下城體育俱樂部 (Downtown Athletic Club, 19 West St) - 南側階梯退台磚石大樓
  addBuilding({
    name: 'Downtown Athletic Club',
    x: -70,
    z: 315,
    w: 26,
    d: 24,
    height: 162,
    style: 'art_deco_stepped',
    region: 'south'
  });

  // 12. 標準石油大樓 (Standard Oil Building, 26 Broadway) - 滾石公園古典斜角金字塔頂大廈
  addBuilding({
    name: 'Standard Oil Building',
    x: 165,
    z: 435,
    w: 36,
    d: 32,
    height: 158,
    style: 'classical_mansard',
    region: 'south'
  });

  // --- (B) 程序化街道街區網格佈局 (東側與南側街區) ---
  const eastGridZ = [-390, -290, -190, -90, 0, 110, 210, 310, 400];
  const eastGridX = [170, 260, 350, 440, 530, 620];

  const southGridZ = [210, 290, 370, 450, 530, 610];
  const southGridX = [-75, -20, 35, 95];

  const prng = createPRNG(19730911);
  const styles = [
    'art_deco_stepped',
    'modern_tower',
    'modern_slab',
    'classical_mansard',
    'lowrise_masonry'
  ];

  // 生成東側金融區網格大樓
  for (const z of eastGridZ) {
    for (const x of eastGridX) {
      if (x < 120 || x > 650 || z < -450 || z > 450) continue;
      const jx = x + (prng() - 0.5) * 14;
      const jz = z + (prng() - 0.5) * 14;
      const w = 26 + Math.floor(prng() * 16);
      const d = 24 + Math.floor(prng() * 16);

      // 高度依距華爾街核心 (x: 260, z: 140) 距離遞減，並加入隨機浮動
      const distToCore = Math.hypot(jx - 260, jz - 140);
      let baseH = 210 - distToCore * 0.28;
      baseH += (prng() - 0.5) * 45;
      const height = Math.max(65, Math.min(230, Math.round(baseH)));

      let style = styles[Math.floor(prng() * styles.length)];
      if (height > 175 && prng() < 0.4) {
        style = 'art_deco_spire';
      } else if (height < 90 && prng() < 0.6) {
        style = 'lowrise_masonry';
      }

      addBuilding({
        name: `East_Bld_${buildings.length}`,
        x: Math.round(jx),
        z: Math.round(jz),
        w,
        d,
        height,
        style,
        region: 'east'
      });
    }
  }

  // 生成南側砲台公園方向網格大樓
  for (const z of southGridZ) {
    for (const x of southGridX) {
      if (x < -100 || x > 350 || z < 180 || z > 650) continue;
      const jx = x + (prng() - 0.5) * 10;
      const jz = z + (prng() - 0.5) * 10;
      const w = 22 + Math.floor(prng() * 14);
      const d = 20 + Math.floor(prng() * 14);

      const distToCore = Math.hypot(jx - 150, jz - 250);
      let baseH = 175 - distToCore * 0.22;
      baseH += (prng() - 0.5) * 40;
      const height = Math.max(60, Math.min(195, Math.round(baseH)));

      let style = styles[Math.floor(prng() * styles.length)];
      if (height > 160 && prng() < 0.35) {
        style = 'art_deco_spire';
      } else if (height < 85) {
        style = 'lowrise_masonry';
      }

      addBuilding({
        name: `South_Bld_${buildings.length}`,
        x: Math.round(jx),
        z: Math.round(jz),
        w,
        d,
        height,
        style,
        region: 'south'
      });
    }
  }

  // --- (C) 建構各建築之 3D 幾何實體 ---
  for (const b of buildings) {
    const { x, z, w, d, height, style } = b;

    switch (style) {
      case 'gothic_spire': {
        // 伍爾沃斯風格哥德復興尖頂大樓
        const h1 = height * 0.58;
        const b1 = createTiledBox(w, h1, d);
        b1.translate(x, h1 / 2, z);
        masonryGeos.push(b1);

        const h2 = height * 0.22;
        const w2 = w * 0.68;
        const d2 = d * 0.68;
        const b2 = createTiledBox(w2, h2, d2);
        b2.translate(x, h1 + h2 / 2, z);
        masonryGeos.push(b2);

        // 4 個轉角哥德尖塔柱
        const cornerOffX = (w * 0.44);
        const cornerOffZ = (d * 0.44);
        const turretGeo = new THREE.BoxGeometry(2.4, 12, 2.4);
        for (const dx of [-cornerOffX, cornerOffX]) {
          for (const dz of [-cornerOffZ, cornerOffZ]) {
            const tg = turretGeo.clone();
            tg.translate(x + dx, h1 + 6, z + dz);
            copperGeos.push(tg);
          }
        }

        const hRoof = height * 0.14;
        const pyr = new THREE.ConeGeometry(w2 * 0.68, hRoof, 4);
        pyr.rotateY(Math.PI / 4);
        pyr.translate(x, h1 + h2 + hRoof / 2, z);
        copperGeos.push(pyr);

        const hSpire = height * 0.06;
        const spire = new THREE.CylinderGeometry(0.3, 0.9, hSpire, 8);
        spire.translate(x, h1 + h2 + hRoof + hSpire / 2, z);
        copperGeos.push(spire);

        if (height > 150) {
          beaconPositions.push({ x, y: height, z });
        }
        break;
      }

      case 'art_deco_spire': {
        // 40 Wall St / 70 Pine 風格裝飾藝術金字塔與針尖
        const h1 = height * 0.48;
        const b1 = createTiledBox(w, h1, d);
        b1.translate(x, h1 / 2, z);
        masonryGeos.push(b1);

        const h2 = height * 0.26;
        const w2 = w * 0.72;
        const d2 = d * 0.72;
        const b2 = createTiledBox(w2, h2, d2);
        b2.translate(x, h1 + h2 / 2, z);
        masonryGeos.push(b2);

        const h3 = height * 0.14;
        const w3 = w * 0.50;
        const d3 = d * 0.50;
        const b3 = createTiledBox(w3, h3, d3);
        b3.translate(x, h1 + h2 + h3 / 2, z);
        masonryGeos.push(b3);

        const hRoof = height * 0.08;
        const pyr = new THREE.ConeGeometry(w3 * 0.72, hRoof, 4);
        pyr.rotateY(Math.PI / 4);
        pyr.translate(x, h1 + h2 + h3 + hRoof / 2, z);
        copperGeos.push(pyr);

        const hSpire = height * 0.04;
        const spire = new THREE.CylinderGeometry(0.25, 0.7, hSpire, 8);
        spire.translate(x, h1 + h2 + h3 + hRoof + hSpire / 2, z);
        copperGeos.push(spire);

        if (height > 150) {
          beaconPositions.push({ x, y: height, z });
        }
        break;
      }

      case 'art_deco_stepped': {
        // 階梯式退台石材大樓 (1 Wall St, Downtown Athletic Club)
        const h1 = height * 0.52;
        const b1 = createTiledBox(w, h1, d);
        b1.translate(x, h1 / 2, z);
        masonryGeos.push(b1);

        const h2 = height * 0.28;
        const w2 = w * 0.76;
        const d2 = d * 0.76;
        const b2 = createTiledBox(w2, h2, d2);
        b2.translate(x, h1 + h2 / 2, z);
        masonryGeos.push(b2);

        const h3 = height * 0.20;
        const w3 = w * 0.54;
        const d3 = d * 0.54;
        const b3 = createTiledBox(w3, h3, d3);
        b3.translate(x, h1 + h2 + h3 / 2, z);
        masonryGeos.push(b3);

        // 頂樓屋面與機房
        const mech = new THREE.BoxGeometry(w3 * 0.45, 4.5, d3 * 0.45);
        mech.translate(x, height + 2.25, z);
        roofGeos.push(mech);

        if (height > 150) {
          beaconPositions.push({ x, y: height + 4.5, z });
        }
        break;
      }

      case 'modern_tower': {
        // 國際主義玻璃與鋼骨摩天大廈 (1 Chase Manhattan, One Liberty Plaza)
        const shaftH = height - 6;
        const shaft = createTiledBox(w, shaftH, d, 14, 14);
        shaft.translate(x, shaftH / 2, z);
        glassGeos.push(shaft);

        // 頂部機械設備間與擦窗機軌道層
        const mechW = w * 0.6;
        const mechD = d * 0.5;
        const mechH = 6;
        const mech = new THREE.BoxGeometry(mechW, mechH, mechD);
        mech.translate(x, shaftH + mechH / 2, z);
        roofGeos.push(mech);

        if (height > 150) {
          beaconPositions.push({ x: x - mechW * 0.4, y: height, z: z - mechD * 0.4 });
          beaconPositions.push({ x: x + mechW * 0.4, y: height, z: z + mechD * 0.4 });
        }
        break;
      }

      case 'modern_slab': {
        // 寬體現代商務辦公板樓
        const slabW = w * 1.25;
        const slabD = d * 0.75;
        const shaftH = height - 4.5;
        const shaft = createTiledBox(slabW, shaftH, slabD, 14, 14);
        shaft.translate(x, shaftH / 2, z);
        glassGeos.push(shaft);

        const mech = new THREE.BoxGeometry(slabW * 0.5, 4.5, slabD * 0.45);
        mech.translate(x, shaftH + 2.25, z);
        roofGeos.push(mech);

        if (height > 150) {
          beaconPositions.push({ x, y: height, z });
        }
        break;
      }

      case 'classical_mansard': {
        // 新古典石材巨廈與斜邊法式折線銅綠屋頂 (Equitable, Municipal, Standard Oil)
        const shaftH = height - 12;
        const shaft = createTiledBox(w, shaftH, d, 12, 12);
        shaft.translate(x, shaftH / 2, z);
        masonryGeos.push(shaft);

        // 古典線腳簷口 (Cornice line)
        const cornice = new THREE.BoxGeometry(w + 1.6, 2.2, d + 1.6);
        cornice.translate(x, shaftH + 1.1, z);
        masonryGeos.push(cornice);

        // 銅綠斜頂
        const roofH = 9.8;
        const hipRoof = new THREE.ConeGeometry(Math.hypot(w, d) * 0.45, roofH, 4);
        hipRoof.rotateY(Math.PI / 4);
        hipRoof.translate(x, shaftH + 2.2 + roofH / 2, z);
        copperGeos.push(hipRoof);

        if (height > 150) {
          beaconPositions.push({ x, y: height, z });
        }
        break;
      }

      case 'lowrise_masonry':
      default: {
        // 低層歷史磚石商辦大樓 (60m-85m)
        const shaftH = height - 2;
        const shaft = createTiledBox(w, shaftH, d, 10, 10);
        shaft.translate(x, shaftH / 2, z);
        masonryGeos.push(shaft);

        // 屋頂女兒牆護欄
        const roofCap = new THREE.BoxGeometry(w * 0.95, 2, d * 0.95);
        roofCap.translate(x, shaftH + 1, z);
        roofGeos.push(roofCap);
        break;
      }
    }
  }

  // 4. 建立高品質 Standard 材質
  const masonryMat = new THREE.MeshStandardMaterial({
    map: isNightInit ? textures.masonryNight : textures.masonryDay,
    emissive: new THREE.Color(isNightInit ? 0xffffff : 0x000000),
    emissiveMap: isNightInit ? textures.masonryNight : null,
    emissiveIntensity: isNightInit ? 0.95 : 0.0,
    roughness: 0.85,
    metalness: 0.1
  });

  const glassMat = new THREE.MeshStandardMaterial({
    map: isNightInit ? textures.glassNight : textures.glassDay,
    emissive: new THREE.Color(isNightInit ? 0xffffff : 0x000000),
    emissiveMap: isNightInit ? textures.glassNight : null,
    emissiveIntensity: isNightInit ? 1.0 : 0.0,
    roughness: 0.28,
    metalness: 0.65
  });

  const copperMat = new THREE.MeshStandardMaterial({
    map: isNightInit ? textures.copperNight : textures.copperDay,
    roughness: 0.65,
    metalness: 0.22
  });

  const darkRoofMat = new THREE.MeshStandardMaterial({
    map: isNightInit ? textures.roofNight : textures.roofDay,
    roughness: 0.92,
    metalness: 0.08
  });

  // 5. 航空障礙紅燈共用材質 (支援夜間慢速呼吸閃爍)
  const beaconMat = new THREE.MeshStandardMaterial({
    color: isNightInit ? 0xff3333 : 0x440000,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: isNightInit ? 2.5 : 0.0,
    roughness: 0.2,
    metalness: 0.3
  });

  // 6. 合併幾何體 (BufferGeometryUtils.mergeGeometries)
  if (masonryGeos.length > 0) {
    const merged = BufferGeometryUtils.mergeGeometries(masonryGeos);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, masonryMat);
    mesh.name = 'Skyline_Masonry_Merged';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  if (glassGeos.length > 0) {
    const merged = BufferGeometryUtils.mergeGeometries(glassGeos);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, glassMat);
    mesh.name = 'Skyline_Glass_Merged';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  if (copperGeos.length > 0) {
    const merged = BufferGeometryUtils.mergeGeometries(copperGeos);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, copperMat);
    mesh.name = 'Skyline_Copper_Merged';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  if (roofGeos.length > 0) {
    const merged = BufferGeometryUtils.mergeGeometries(roofGeos);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, darkRoofMat);
    mesh.name = 'Skyline_Roof_Merged';
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 7. 高塔紅色航空警示燈 (InstancedMesh 1 次繪製呼叫)
  if (beaconPositions.length > 0) {
    const beaconGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const beaconMesh = new THREE.InstancedMesh(
      beaconGeo,
      beaconMat,
      beaconPositions.length
    );
    beaconMesh.name = 'Skyline_Aviation_Beacons';

    const dummy = new THREE.Matrix4();
    beaconPositions.forEach((pos, index) => {
      dummy.setPosition(pos.x, pos.y, pos.z);
      beaconMesh.setMatrixAt(index, dummy);
    });
    beaconMesh.instanceMatrix.needsUpdate = true;
    group.add(beaconMesh);
  }

  let currentIsNight = isNightInit;

  // 8. 定義日夜切換處理
  const setNightMode = (isNight) => {
    currentIsNight = !!isNight;

    // 石材建築立面
    masonryMat.map = isNight ? textures.masonryNight : textures.masonryDay;
    masonryMat.emissiveMap = isNight ? textures.masonryNight : null;
    masonryMat.emissive.set(isNight ? 0xffffff : 0x000000);
    masonryMat.emissiveIntensity = isNight ? 0.95 : 0.0;
    masonryMat.needsUpdate = true;

    // 玻璃幕牆立面
    glassMat.map = isNight ? textures.glassNight : textures.glassDay;
    glassMat.emissiveMap = isNight ? textures.glassNight : null;
    glassMat.emissive.set(isNight ? 0xffffff : 0x000000);
    glassMat.emissiveIntensity = isNight ? 1.0 : 0.0;
    glassMat.needsUpdate = true;

    // 銅綠屋頂與平頂
    copperMat.map = isNight ? textures.copperNight : textures.copperDay;
    copperMat.needsUpdate = true;

    darkRoofMat.map = isNight ? textures.roofNight : textures.roofDay;
    darkRoofMat.needsUpdate = true;

    // 航空警示燈
    beaconMat.emissiveIntensity = isNight ? 2.5 : 0.0;
    beaconMat.color.setHex(isNight ? 0xff3333 : 0x440000);
    beaconMat.needsUpdate = true;
  };

  if (isNightInit) {
    setNightMode(true);
  }

  // 9. 每幀微動態 (夜間航空障礙燈以正弦律動慢速閃爍)
  const update = (delta, time) => {
    if (currentIsNight && beaconMat) {
      const t = time !== undefined ? time : performance.now() * 0.001;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
      beaconMat.emissiveIntensity = 1.3 + pulse * 1.8;
    }
  };

  return {
    group,
    setNightMode,
    update
  };
}
