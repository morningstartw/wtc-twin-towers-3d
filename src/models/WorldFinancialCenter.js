/**
 * WorldFinancialCenter.js
 * 紐約世界金融中心 (World Financial Center, 現 Brookfield Place) 與冬季花園 (Winter Garden Atrium)
 *
 * 建築大師西薩·佩里 (César Pelli) 後現代主義經典代表作 (1982–1988)：
 * 坐落於西街 (West Street) 西側與哈德遜河水岸之間，與世界貿易中心 (WTC) 隔西街相望。
 *
 * 四座標誌性幾何銅綠屋頂摩天樓：
 * 1. 1 WFC (One World Financial Center):
 *    - 40 層，標高 176 米，位於南側 (-190, 0, 160)。
 *    - 頂部為特色「階梯金字塔 (Stepped Pyramid)」銅綠氧化屋頂。
 * 2. 2 WFC (Two World Financial Center):
 *    - 44 層，標高 197 米，位於中南側 (-230, 0, 60)。
 *    - 頂部為特色「半球圓頂 (Round Dome)」銅綠氧化屋頂。
 * 3. 3 WFC (Three World Financial Center - American Express Tower):
 *    - 51 層，標高 225 米 (群樓最高座)，位於中北側 (-230, 0, -60)。
 *    - 頂部為特色「四角錐尖頂金字塔 (Solid Pyramid)」銅綠氧化屋頂。
 * 4. 4 WFC (Four World Financial Center):
 *    - 34 層，標高 152 米，位於北側 (-190, 0, -160)。
 *    - 頂部為特色「兩段階梯式平頂切角 (Stepped Flat / Mast)」銅綠氧化屋頂。
 *
 * 冬季花園溫室中庭 (Winter Garden Atrium):
 * - 位於 2 WFC 與 3 WFC 之間水岸中軸 (-260, 0, 0)。
 * - 跨度 48m x 62m，標高 38m 的宏偉半圓桶形拱頂 (Barrel Vault) 鋼構玻璃天幕。
 * - 內部種植 16 棵自加州移植之華盛頓蒲葵扇棕櫚樹 (Washingtonia robusta fan palms)。
 * - 夜間透出溫暖璀璨的室內拱頂金黃照明，映照哈德遜水岸。
 *
 * 砲台公園城水岸步道平台與花崗岩海堤 (Battery Park City Esplanade & Seawall):
 * - 高架步道平台、花崗岩鋪面、水岸海堤護欄 (Granite Seawall) 與古典鑄鐵街燈。
 * - 橫跨西街連接世貿中心廣場的兩座封閉式空橋 (North & South Skybridges)。
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
 * 簡易偽隨機數生成器
 */
function createPRNG(seed = 1985) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 建立世界金融中心西薩·佩里後現代暖色花崗岩與方格反射玻璃立面貼圖
 */
function createWFCTexture(isNight = false, seed = 19850101) {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  // 花崗岩基底色彩 (佩里招牌之柔和暖粉蜂巢花崗岩 / 晚間深灰夜色)
  ctx.fillStyle = isNight ? '#161920' : '#c5b49f';
  ctx.fillRect(0, 0, width, height);

  const floors = 32;
  const columns = 24;
  const floorH = height / floors;
  const colW = width / columns;

  // 夜間辦公室多樣光源色庫
  const nightLightColors = [
    '#ffe494', '#ffd166', '#fff6e0', '#e3f2fd', '#ffbe53', '#fefefe'
  ];

  for (let f = 0; f < floors; f++) {
    const y = f * floorH;

    // 水平花崗岩層間樑飾條 (Spandrel)
    ctx.fillStyle = isNight ? '#1c1f26' : '#d2c2ad';
    ctx.fillRect(0, y, width, floorH * 0.32);

    // 細緻陰影縫線
    ctx.fillStyle = isNight ? '#0b0d12' : '#9f8e7c';
    ctx.fillRect(0, y + floorH * 0.30, width, floorH * 0.04);

    // 辦公室方格採光窗帶
    const winY = y + floorH * 0.34;
    const winH = floorH * 0.62;

    for (let c = 0; c < columns; c++) {
      const x = c * colW + colW * 0.10;
      const w = colW * 0.80;

      if (isNight) {
        // 金融辦公大樓約 42% 夜間加班與保全亮燈
        if (prng() < 0.42) {
          ctx.fillStyle = nightLightColors[Math.floor(prng() * nightLightColors.length)];
          ctx.fillRect(x, winY, w, winH);

          // 隨機百葉窗/窗簾半遮陰影
          if (prng() < 0.45) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(x, winY, w, winH * (0.3 + prng() * 0.5));
          }
        } else {
          // 未開燈辦公窗 (深黑夜空微光)
          ctx.fillStyle = '#080c13';
          ctx.fillRect(x, winY, w, winH);
        }
      } else {
        // 白天深邃反射玻璃 (含微妙反光漸層)
        const tone = 0.28 + prng() * 0.08;
        ctx.fillStyle = `rgb(${Math.round(42 * tone)}, ${Math.round(58 * tone)}, ${Math.round(76 * tone)})`;
        ctx.fillRect(x, winY, w, winH);

        // 玻璃高光反光邊緣
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, winY, w * 0.2, winH);
      }

      // 垂直花崗岩柱身縫線
      ctx.fillStyle = isNight ? '#12141a' : '#aa9986';
      ctx.fillRect(c * colW, y, colW * 0.08, floorH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 建立砲台公園城花崗岩步道鋪面貼圖
 */
function createEsplanadePavingTexture() {
  const width = 512;
  const height = 512;
  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 基底花崗岩灰色
  ctx.fillStyle = '#7a7e85';
  ctx.fillRect(0, 0, width, height);

  const tileSize = 32;
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const shade = 115 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // 石磚接縫陰影
      ctx.fillStyle = '#4f535a';
      ctx.fillRect(x, y, tileSize, 1);
      ctx.fillRect(x, y, 1, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 18);
  return texture;
}

/**
 * 建立世界金融中心 (WFC 1, 2, 3, 4 + 冬季花園 + 水岸步道)
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.isNight=false] - 初始夜間狀態
 * @returns {{ group: THREE.Group, setNightMode: (isNight: boolean) => void, update: (delta: number, time: number) => void }}
 */
export function createWorldFinancialCenter(options = {}) {
  const isNightInit = !!options.isNight;
  const group = new THREE.Group();
  group.name = 'WorldFinancialCenter';

  // 1. 建立立面與鋪面貼圖
  const dayTexture = createWFCTexture(false);
  const nightTexture = createWFCTexture(true);
  const pavingTexture = createEsplanadePavingTexture();

  // 2. 核心材質系統
  // 銅綠金屬屋頂 (Patina Copper: 0x6ea78e, metalness 0.6, roughness 0.4)
  const patinaCopperMat = new THREE.MeshStandardMaterial({
    color: 0x6ea78e,
    metalness: 0.6,
    roughness: 0.4,
    bumpScale: 0.05
  });

  // 深色銅綠邊框 / 簷口材質
  const darkCopperMat = new THREE.MeshStandardMaterial({
    color: 0x487965,
    metalness: 0.65,
    roughness: 0.45
  });

  // 主體花崗岩立面材質
  const facadeMat = new THREE.MeshStandardMaterial({
    map: isNightInit ? nightTexture : dayTexture,
    emissiveMap: isNightInit ? nightTexture : null,
    emissive: new THREE.Color(isNightInit ? 0xffffff : 0x000000),
    emissiveIntensity: isNightInit ? 0.95 : 0.0,
    roughness: 0.55,
    metalness: 0.2
  });

  // 步道花崗岩材質
  const esplanadeMat = new THREE.MeshStandardMaterial({
    map: pavingTexture,
    roughness: 0.85,
    metalness: 0.1
  });

  // 海堤深灰花崗岩基石材質
  const seawallMat = new THREE.MeshStandardMaterial({
    color: 0x5a5e66,
    roughness: 0.8,
    metalness: 0.15
  });

  // 鑄鐵/深色青銅護欄材質
  const metalRailingMat = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    metalness: 0.8,
    roughness: 0.3
  });

  // 冬季花園拱頂深墨綠鋼構材質
  const atriumSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1f2e26,
    metalness: 0.7,
    roughness: 0.35
  });

  // 冬季花園玻璃天幕材質 (半透明且微反射天光)
  const atriumGlassMat = new THREE.MeshStandardMaterial({
    color: 0xa4d8ea,
    metalness: 0.2,
    roughness: 0.12,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide
  });

  // 冬季花園夜間室內發光材質
  const winterGardenGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffb74d,
    transparent: true,
    opacity: isNightInit ? 0.65 : 0.05
  });

  // 大樓頂部紅色航空障礙警告燈材質
  const beaconMat = new THREE.MeshStandardMaterial({
    color: isNightInit ? 0xff2222 : 0x550000,
    emissive: new THREE.Color(0xff1111),
    emissiveIntensity: isNightInit ? 2.5 : 0.0,
    roughness: 0.2,
    metalness: 0.1
  });

  // 棕櫚樹樹幹與樹冠葉片材質
  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x544132,
    roughness: 0.9,
    metalness: 0.05
  });

  const palmLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2e6b3e,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // 燈光與物體註冊列表
  const materialsRegistry = [{ material: facadeMat, dayMap: dayTexture, nightMap: nightTexture }];
  const beaconsList = [];

  // ==========================================
  // A. 砲台公園城水岸基座平台與花崗岩海堤 (Battery Park City Esplanade)
  // ==========================================
  const esplanadePlatformH = 1.8;
  const esplanadeW = 160; // x 方向跨度 (x = -135 到 -295)
  const esplanadeL = 460; // z 方向跨度 (z = -230 到 +230)
  const esplanadeCenterX = -215;
  const esplanadeCenterZ = 0;

  const esplanadeGeo = new THREE.BoxGeometry(esplanadeW, esplanadePlatformH, esplanadeL);
  const esplanadeMesh = new THREE.Mesh(esplanadeGeo, esplanadeMat);
  esplanadeMesh.position.set(esplanadeCenterX, esplanadePlatformH * 0.5, esplanadeCenterZ);
  esplanadeMesh.receiveShadow = true;
  group.add(esplanadeMesh);

  // 西側水岸海堤 (Seawall along Hudson River, x ≈ -295)
  const seawallX = -294.5;
  const seawallBaseH = 1.0;
  const seawallBaseW = 1.2;
  const seawallBaseGeo = new THREE.BoxGeometry(seawallBaseW, seawallBaseH, esplanadeL);
  const seawallBase = new THREE.Mesh(seawallBaseGeo, seawallMat);
  seawallBase.position.set(seawallX, esplanadePlatformH + seawallBaseH * 0.5, 0);
  seawallBase.receiveShadow = true;
  seawallBase.castShadow = true;
  group.add(seawallBase);

  // 海堤鑄鐵安全護欄 (Decorative top railing)
  const railingPostCount = 46;
  const railH = 0.5;
  const railingGroup = new THREE.Group();
  railingGroup.position.set(seawallX, esplanadePlatformH + seawallBaseH, 0);

  // 頂部橫向連續導軌
  const railBarGeo = new THREE.CylinderGeometry(0.04, 0.04, esplanadeL, 8);
  const railBar = new THREE.Mesh(railBarGeo, metalRailingMat);
  railBar.rotation.x = Math.PI * 0.5;
  railBar.position.set(0, railH, 0);
  railingGroup.add(railBar);

  const railBarMid = new THREE.Mesh(railBarGeo, metalRailingMat);
  railBarMid.rotation.x = Math.PI * 0.5;
  railBarMid.position.set(0, railH * 0.5, 0);
  railingGroup.add(railBarMid);

  // 規律垂直立柱
  const postGeo = new THREE.BoxGeometry(0.1, railH, 0.1);
  for (let i = 0; i <= railingPostCount; i++) {
    const post = new THREE.Mesh(postGeo, metalRailingMat);
    const zPos = -esplanadeL * 0.5 + (i / railingPostCount) * esplanadeL;
    post.position.set(0, railH * 0.5, zPos);
    railingGroup.add(post);
  }
  group.add(railingGroup);

  // 沿水岸古典景觀街燈
  const lampCount = 18;
  const lampPostGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8);
  const lampLanternGeo = new THREE.OctahedronGeometry(0.35, 1);
  const lampLanternMat = new THREE.MeshBasicMaterial({
    color: isNightInit ? 0xffe89e : 0xffffff,
    transparent: true,
    opacity: isNightInit ? 0.95 : 0.4
  });

  for (let i = 0; i <= lampCount; i++) {
    const zPos = -esplanadeL * 0.46 + (i / lampCount) * (esplanadeL * 0.92);
    const lampX = seawallX + 2.2;
    const lampPost = new THREE.Mesh(lampPostGeo, metalRailingMat);
    lampPost.position.set(lampX, esplanadePlatformH + 2.1, zPos);
    lampPost.castShadow = true;
    group.add(lampPost);

    const lantern = new THREE.Mesh(lampLanternGeo, lampLanternMat);
    lantern.position.set(lampX, esplanadePlatformH + 4.3, zPos);
    group.add(lantern);
  }

  // ==========================================
  // B. 輔助建造函式：階梯縮進方形塔身與避雷警示燈
  // ==========================================
  function createTowerBody(tiers, posX, posZ) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(posX, 0, posZ);

    tiers.forEach((tier) => {
      const geo = new THREE.BoxGeometry(tier.w, tier.h, tier.d);
      const mesh = new THREE.Mesh(geo, facadeMat);
      mesh.position.set(0, tier.bottomY + tier.h * 0.5, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      towerGroup.add(mesh);

      // 各級縮進頂部深銅色過渡簷口 (Cornice)
      const corniceH = 0.9;
      const corniceGeo = new THREE.BoxGeometry(tier.w + 0.8, corniceH, tier.d + 0.8);
      const cornice = new THREE.Mesh(corniceGeo, darkCopperMat);
      cornice.position.set(0, tier.bottomY + tier.h - corniceH * 0.5, 0);
      cornice.castShadow = true;
      towerGroup.add(cornice);
    });

    group.add(towerGroup);
    return towerGroup;
  }

  function addAviationBeacon(parentGroup, x, y, z) {
    const beaconGeo = new THREE.SphereGeometry(0.7, 8, 8);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(x, y, z);
    parentGroup.add(beacon);
    beaconsList.push(beacon);

    const poleH = 2.5;
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, poleH, 6);
    const pole = new THREE.Mesh(poleGeo, metalRailingMat);
    pole.position.set(x, y - poleH * 0.5, z);
    parentGroup.add(pole);
  }

  // ==========================================
  // 1. One World Financial Center (1 WFC)
  // 40 層，高約 176m，坐落於南側 (-190, 0, 160)
  // 特色：階梯金字塔 (Stepped Pyramid) 銅綠屋頂
  // ==========================================
  const wfc1Pos = { x: -190, z: 160 };
  const wfc1Tiers = [
    { w: 50, d: 50, bottomY: esplanadePlatformH, h: 110 },
    { w: 42, d: 42, bottomY: esplanadePlatformH + 110, h: 36 },
    { w: 34, d: 34, bottomY: esplanadePlatformH + 146, h: 16 }
  ];
  const wfc1Group = createTowerBody(wfc1Tiers, wfc1Pos.x, wfc1Pos.z);

  // 1 WFC 階梯金字塔屋頂 (Stepped Pyramid: 5 級縮進銅綠階梯)
  const wfc1RoofBaseY = esplanadePlatformH + 162;
  const wfc1Steps = 5;
  const wfc1StepH = 2.6; // 總高約 13m -> 頂峰約 176m
  let currStepW = 32;

  for (let s = 0; s < wfc1Steps; s++) {
    const stepGeo = new THREE.BoxGeometry(currStepW, wfc1StepH, currStepW);
    const stepMesh = new THREE.Mesh(stepGeo, patinaCopperMat);
    stepMesh.position.set(0, wfc1RoofBaseY + s * wfc1StepH + wfc1StepH * 0.5, 0);
    stepMesh.castShadow = true;
    wfc1Group.add(stepMesh);
    currStepW -= 5.2;
  }

  // 1 WFC 頂部避雷紅燈標誌
  const wfc1PeakY = wfc1RoofBaseY + wfc1Steps * wfc1StepH;
  addAviationBeacon(wfc1Group, 0, wfc1PeakY + 1.2, 0);

  // ==========================================
  // 2. Two World Financial Center (2 WFC)
  // 44 層，高約 197m，坐落於中南側 (-230, 0, 60)
  // 特色：半球圓頂 (Round Dome) 銅綠屋頂
  // ==========================================
  const wfc2Pos = { x: -230, z: 60 };
  const wfc2Tiers = [
    { w: 56, d: 56, bottomY: esplanadePlatformH, h: 122 },
    { w: 48, d: 48, bottomY: esplanadePlatformH + 122, h: 38 },
    { w: 40, d: 40, bottomY: esplanadePlatformH + 160, h: 18 }
  ];
  const wfc2Group = createTowerBody(wfc2Tiers, wfc2Pos.x, wfc2Pos.z);

  // 2 WFC 圓頂基座鼓環 (Drum Ring)
  const wfc2RoofBaseY = esplanadePlatformH + 178;
  const drumH = 4.0;
  const drumRadius = 18.0;
  const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius, drumH, 32);
  const drumMesh = new THREE.Mesh(drumGeo, darkCopperMat);
  drumMesh.position.set(0, wfc2RoofBaseY + drumH * 0.5, 0);
  drumMesh.castShadow = true;
  wfc2Group.add(drumMesh);

  // 2 WFC 標誌性半球銅綠圓頂 (Hemispherical Copper Dome, 半徑約 17m)
  const domeRadius = 17.5;
  const domeGeo = new THREE.SphereGeometry(
    domeRadius,
    32,
    18,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5
  );
  const domeMesh = new THREE.Mesh(domeGeo, patinaCopperMat);
  domeMesh.position.set(0, wfc2RoofBaseY + drumH, 0);
  domeMesh.castShadow = true;
  wfc2Group.add(domeMesh);

  // 圓頂頂端古典採光採風亭與航空避雷標誌燈 (~197m)
  const lanternH = 3.5;
  const lanternGeo = new THREE.CylinderGeometry(2.0, 2.4, lanternH, 16);
  const lanternMesh = new THREE.Mesh(lanternGeo, darkCopperMat);
  lanternMesh.position.set(0, wfc2RoofBaseY + drumH + domeRadius + lanternH * 0.5, 0);
  wfc2Group.add(lanternMesh);

  addAviationBeacon(wfc2Group, 0, wfc2RoofBaseY + drumH + domeRadius + lanternH + 1.2, 0);

  // ==========================================
  // 3. Three World Financial Center (3 WFC - AMEX Tower)
  // 51 層，高約 225m (全群最高標誌座)，坐落於中北側 (-230, 0, -60)
  // 特色：四角錐尖頂金字塔 (Solid Pyramid) 銅綠屋頂
  // ==========================================
  const wfc3Pos = { x: -230, z: -60 };
  const wfc3Tiers = [
    { w: 58, d: 58, bottomY: esplanadePlatformH, h: 136 },
    { w: 50, d: 50, bottomY: esplanadePlatformH + 136, h: 42 },
    { w: 42, d: 42, bottomY: esplanadePlatformH + 178, h: 22 }
  ];
  const wfc3Group = createTowerBody(wfc3Tiers, wfc3Pos.x, wfc3Pos.z);

  // 3 WFC 四角錐尖頂金字塔 (Solid Pointed Pyramid)
  const wfc3RoofBaseY = esplanadePlatformH + 200;
  const pyramidH = 23.5; // 金字塔高 23.5m -> 頂端達約 225m
  const pyramidBaseW = 40;
  // 錐體頂點與底面四邊形轉換：ConeGeometry(radius, height, 4) 旋轉 45 度成四角錐
  const pyramidRadius = (pyramidBaseW * 0.5) * Math.SQRT2;
  const pyramidGeo = new THREE.ConeGeometry(pyramidRadius, pyramidH, 4);
  const pyramidMesh = new THREE.Mesh(pyramidGeo, patinaCopperMat);
  pyramidMesh.rotation.y = Math.PI * 0.25;
  pyramidMesh.position.set(0, wfc3RoofBaseY + pyramidH * 0.5, 0);
  pyramidMesh.castShadow = true;
  wfc3Group.add(pyramidMesh);

  // 3 WFC 尖塔頂尖高聳避雷針天線與標誌紅燈
  const wfc3MastH = 4.5;
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.35, wfc3MastH, 8);
  const mastMesh = new THREE.Mesh(mastGeo, darkCopperMat);
  mastMesh.position.set(0, wfc3RoofBaseY + pyramidH + wfc3MastH * 0.5, 0);
  wfc3Group.add(mastMesh);

  addAviationBeacon(wfc3Group, 0, wfc3RoofBaseY + pyramidH + wfc3MastH + 0.6, 0);

  // ==========================================
  // 4. Four World Financial Center (4 WFC)
  // 34 層，高約 152m，坐落於北側 (-190, 0, -160)
  // 特色：兩段階梯式平頂切角 (Stepped Flat / Mast) 銅綠屋頂
  // ==========================================
  const wfc4Pos = { x: -190, z: -160 };
  const wfc4Tiers = [
    { w: 48, d: 48, bottomY: esplanadePlatformH, h: 96 },
    { w: 40, d: 40, bottomY: esplanadePlatformH + 96, h: 34 }
  ];
  const wfc4Group = createTowerBody(wfc4Tiers, wfc4Pos.x, wfc4Pos.z);

  // 4 WFC 兩段階梯式平頂切角屋頂
  const wfc4RoofBaseY = esplanadePlatformH + 130;
  const wfc4Step1Geo = new THREE.BoxGeometry(36, 8, 36);
  const wfc4Step1 = new THREE.Mesh(wfc4Step1Geo, patinaCopperMat);
  wfc4Step1.position.set(0, wfc4RoofBaseY + 4, 0);
  wfc4Step1.castShadow = true;
  wfc4Group.add(wfc4Step1);

  const wfc4Step2Geo = new THREE.BoxGeometry(26, 8, 26);
  const wfc4Step2 = new THREE.Mesh(wfc4Step2Geo, patinaCopperMat);
  wfc4Step2.position.set(0, wfc4RoofBaseY + 12, 0);
  wfc4Step2.castShadow = true;
  wfc4Group.add(wfc4Step2);

  const wfc4TopFlatGeo = new THREE.BoxGeometry(16, 4, 16);
  const wfc4TopFlat = new THREE.Mesh(wfc4TopFlatGeo, darkCopperMat);
  wfc4TopFlat.position.set(0, wfc4RoofBaseY + 18, 0);
  wfc4TopFlat.castShadow = true;
  wfc4Group.add(wfc4TopFlat);

  addAviationBeacon(wfc4Group, 0, wfc4RoofBaseY + 20 + 1.2, 0);

  // ==========================================
  // 5. 冬季花園溫室大廳 (Winter Garden Atrium)
  // 坐落於 2 WFC 與 3 WFC 之間，面朝哈德遜河水岸 (-260, 0, 0)
  // 宏偉半圓桶形拱頂 (Barrel Vault)，跨度約 48m x 62m，標高 38m
  // ==========================================
  const wgGroup = new THREE.Group();
  wgGroup.name = 'WinterGardenAtrium';
  const wgCenter = { x: -260, y: esplanadePlatformH, z: 0 };
  wgGroup.position.set(wgCenter.x, wgCenter.y, wgCenter.z);

  const wgLength = 62; // x 軸方向伸展長度 (從東側廣場延伸至西側水岸)
  const wgWidth = 46;  // z 軸方向跨度 (北南寬度)
  const wgWallH = 15;  // 垂直鋼構玻璃側牆高度
  const wgArchR = wgWidth * 0.5; // 拱頂半徑 = 23m -> 總標高 15 + 23 = 38m

  // 冬季花園大理石鋪面基底
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xdfd4c4,
    roughness: 0.35,
    metalness: 0.2
  });
  const wgFloorGeo = new THREE.BoxGeometry(wgLength, 0.4, wgWidth);
  const wgFloor = new THREE.Mesh(wgFloorGeo, floorMat);
  wgFloor.position.set(0, 0.2, 0);
  wgFloor.receiveShadow = true;
  wgGroup.add(wgFloor);

  // 冬季花園夜間暖金室內泛光板
  const wgGlowGeo = new THREE.BoxGeometry(wgLength - 4, 0.2, wgWidth - 4);
  const wgGlowMesh = new THREE.Mesh(wgGlowGeo, winterGardenGlowMat);
  wgGlowMesh.position.set(0, 0.45, 0);
  wgGroup.add(wgGlowMesh);

  // 垂直玻璃幕牆 (南面與北面側牆)
  const sideWallGeo = new THREE.BoxGeometry(wgLength, wgWallH, 0.4);
  const northGlassWall = new THREE.Mesh(sideWallGeo, atriumGlassMat);
  northGlassWall.position.set(0, wgWallH * 0.5, -wgArchR);
  wgGroup.add(northGlassWall);

  const southGlassWall = new THREE.Mesh(sideWallGeo, atriumGlassMat);
  southGlassWall.position.set(0, wgWallH * 0.5, wgArchR);
  wgGroup.add(southGlassWall);

  // 宏偉桶形拱頂玻璃天幕 (Barrel Vault: Half Cylinder)
  // 半徑 wgArchR, 長度 wgLength, 開口半圓 thetaStart = 0, thetaLength = Math.PI
  const vaultGeo = new THREE.CylinderGeometry(
    wgArchR,
    wgArchR,
    wgLength,
    32,
    8,
    true,
    0,
    Math.PI
  );
  // 旋轉圓柱軸線平行於 X 軸，並讓圓拱向上弧起
  vaultGeo.rotateZ(Math.PI * 0.5);
  vaultGeo.rotateX(Math.PI);
  const vaultMesh = new THREE.Mesh(vaultGeo, atriumGlassMat);
  vaultMesh.position.set(0, wgWallH, 0);
  wgGroup.add(vaultMesh);

  // 鋼構拱肋環線 (Steel Rib Trusses along X axis)
  const ribCount = 10;
  const ribRadius = 0.35;
  for (let i = 0; i <= ribCount; i++) {
    const xPos = -wgLength * 0.5 + (i / ribCount) * wgLength;
    const ribGeo = new THREE.TorusGeometry(wgArchR, ribRadius, 8, 32, Math.PI);
    ribGeo.rotateY(Math.PI * 0.5);
    const ribMesh = new THREE.Mesh(ribGeo, atriumSteelMat);
    ribMesh.position.set(xPos, wgWallH, 0);
    wgGroup.add(ribMesh);
  }

  // 脊樑骨主樑鋼構 (Longitudinal Spine Truss)
  const spineGeo = new THREE.CylinderGeometry(0.4, 0.4, wgLength, 8);
  spineGeo.rotateZ(Math.PI * 0.5);
  const spineMesh = new THREE.Mesh(spineGeo, atriumSteelMat);
  spineMesh.position.set(0, wgWallH + wgArchR, 0);
  wgGroup.add(spineMesh);

  // 西側水岸正面端牆：宏偉半圓巨拱落地玻璃幕牆 (Facing Hudson River)
  const westArchWallGeo = new THREE.CircleGeometry(wgArchR, 32, 0, Math.PI);
  westArchWallGeo.rotateY(-Math.PI * 0.5);
  const westArchWall = new THREE.Mesh(westArchWallGeo, atriumGlassMat);
  westArchWall.position.set(-wgLength * 0.5, wgWallH, 0);
  wgGroup.add(westArchWall);

  const westLowerWallGeo = new THREE.PlaneGeometry(wgWidth, wgWallH);
  westLowerWallGeo.rotateY(-Math.PI * 0.5);
  const westLowerWall = new THREE.Mesh(westLowerWallGeo, atriumGlassMat);
  westLowerWall.position.set(-wgLength * 0.5, wgWallH * 0.5, 0);
  wgGroup.add(westLowerWall);

  // 東側通往世貿方向端牆玻璃
  const eastArchWall = new THREE.Mesh(westArchWallGeo, atriumGlassMat);
  eastArchWall.rotation.y = Math.PI * 0.5;
  eastArchWall.position.set(wgLength * 0.5, wgWallH, 0);
  wgGroup.add(eastArchWall);

  const eastLowerWall = new THREE.Mesh(westLowerWallGeo, atriumGlassMat);
  eastLowerWall.rotation.y = Math.PI * 0.5;
  eastLowerWall.position.set(wgLength * 0.5, wgWallH * 0.5, 0);
  wgGroup.add(eastLowerWall);

  // 冬季花園內部宏偉大理石階梯 (Grand Marble Staircase)
  const stairSteps = 8;
  const stairW = 28;
  for (let s = 0; s < stairSteps; s++) {
    const stepDepth = 2.2;
    const stepHeight = 0.55;
    const stepGeo = new THREE.BoxGeometry(stepDepth, (stairSteps - s) * stepHeight, stairW);
    const stepMesh = new THREE.Mesh(stepGeo, floorMat);
    stepMesh.position.set(wgLength * 0.35 - s * stepDepth, ((stairSteps - s) * stepHeight) * 0.5, 0);
    stepMesh.receiveShadow = true;
    wgGroup.add(stepMesh);
  }

  // 冬季花園 16 棵著名加州蒲葵扇棕櫚樹 (16 Fan Palms in two rows of 8)
  const palmTrunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 11, 8);
  const palmFrondGeo = new THREE.ConeGeometry(3.6, 1.4, 7);
  palmFrondGeo.rotateX(Math.PI);

  const palmRows = [-9, 9]; // 南北兩側
  const palmCountPerRow = 8;
  for (const zOffset of palmRows) {
    for (let p = 0; p < palmCountPerRow; p++) {
      const xOffset = -wgLength * 0.32 + (p / (palmCountPerRow - 1)) * (wgLength * 0.58);
      const palmGroup = new THREE.Group();
      palmGroup.position.set(xOffset, 0, zOffset);

      // 樹幹
      const trunk = new THREE.Mesh(palmTrunkGeo, palmTrunkMat);
      trunk.position.set(0, 5.5, 0);
      trunk.castShadow = true;
      palmGroup.add(trunk);

      // 樹冠葉群
      const fronds = new THREE.Mesh(palmFrondGeo, palmLeafMat);
      fronds.position.set(0, 11.2, 0);
      fronds.scale.set(1.1, 0.7, 1.1);
      fronds.castShadow = true;
      palmGroup.add(fronds);

      wgGroup.add(palmGroup);
    }
  }

  // 冬季花園室內暖光燈 (PointLight，夜間增強溫暖拱頂氛圍)
  const wgLight = new THREE.PointLight(0xffb04a, isNightInit ? 2.8 : 0.4, 90, 1.5);
  wgLight.position.set(0, 18, 0);
  wgGroup.add(wgLight);

  group.add(wgGroup);

  // ==========================================
  // 6. 橫跨西街人行天橋 (Historic Pedestrian Skybridges across West St)
  // 北天橋 (連接 3 WFC 與 WTC 6 / 美國海關大樓)
  // 南天橋 (連接 2 WFC 與 WTC 3 / 萬豪酒店及廣場)
  // ==========================================
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0xc8b9a6,
    metalness: 0.3,
    roughness: 0.5
  });

  function createSkybridge(startX, startZ, endX, endZ, bridgeY = 12.5) {
    const bridgeGroup = new THREE.Group();
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    const bridgeGeo = new THREE.BoxGeometry(length, 4.2, 5.2);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(length * 0.5, 0, 0);
    bridgeMesh.castShadow = true;
    bridgeGroup.add(bridgeMesh);

    // 空橋兩側通透採光玻璃
    const bridgeGlassGeo = new THREE.BoxGeometry(length - 2, 2.0, 5.4);
    const bridgeGlass = new THREE.Mesh(bridgeGlassGeo, atriumGlassMat);
    bridgeGlass.position.set(length * 0.5, 0.4, 0);
    bridgeGroup.add(bridgeGlass);

    // 中間橋墩立柱
    const pierGeo = new THREE.CylinderGeometry(0.8, 0.8, bridgeY, 12);
    const pier = new THREE.Mesh(pierGeo, metalRailingMat);
    pier.position.set(length * 0.5, -bridgeY * 0.5, 0);
    pier.castShadow = true;
    bridgeGroup.add(pier);

    bridgeGroup.position.set(startX, bridgeY, startZ);
    bridgeGroup.rotation.y = -angle;
    group.add(bridgeGroup);
  }

  // 北天橋 (3 WFC 至西街東側 WTC 6)
  createSkybridge(-205, -60, -95, -75, 13.5);
  // 南天橋 (2 WFC 至西街東側 WTC 3/廣場)
  createSkybridge(-205, 60, -95, 45, 13.5);

  // ==========================================
  // 7. 日夜動態切換與每幀更新回呼
  // ==========================================
  let currentIsNight = isNightInit;

  const setNightMode = (isNight) => {
    currentIsNight = !!isNight;

    materialsRegistry.forEach(({ material, dayMap, nightMap }) => {
      material.map = isNight ? nightMap : dayMap;
      material.emissiveMap = isNight ? nightMap : null;
      material.emissive.set(isNight ? 0xffffff : 0x000000);
      material.emissiveIntensity = isNight ? 0.95 : 0.0;
      material.needsUpdate = true;
    });

    // 避雷警示燈亮度與顏色切換
    beaconMat.emissiveIntensity = isNight ? 2.5 : 0.0;
    beaconMat.color.setHex(isNight ? 0xff2222 : 0x550000);
    beaconMat.needsUpdate = true;

    // 冬季花園溫暖拱頂室內夜光
    winterGardenGlowMat.opacity = isNight ? 0.68 : 0.05;
    winterGardenGlowMat.needsUpdate = true;

    // 沿岸街燈夜間發光
    lampLanternMat.color.setHex(isNight ? 0xffe89e : 0xffffff);
    lampLanternMat.opacity = isNight ? 0.95 : 0.4;
    lampLanternMat.needsUpdate = true;

    if (wgLight) {
      wgLight.intensity = isNight ? 3.0 : 0.4;
    }
  };

  if (isNightInit) {
    setNightMode(true);
  }

  // 每幀微動態：避雷警示紅燈緩慢呼吸與跳閃律動
  const update = (delta, time) => {
    if (currentIsNight && beaconMat) {
      const t = time || performance.now() * 0.001;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
      beaconMat.emissiveIntensity = 1.2 + pulse * 1.6;
    }
  };

  return {
    group,
    setNightMode,
    update
  };
}
