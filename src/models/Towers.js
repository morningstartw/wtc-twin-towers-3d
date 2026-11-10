/**
 * Towers.js
 * 世界貿易中心 (WTC) 雙塔總裝模組
 *
 * 整合：
 * 1. 1 WTC (北塔 North Tower):
 *    - 標高 415 米主體 + 110 米通訊天線 (總標高達 526 米)
 *    - 天線多層同軸圓環、微波碟形天線與規律閃爍的頂端紅色航空障礙燈
 * 2. 2 WTC (南塔 South Tower):
 *    - 頂部 110 樓室外露天觀景台 (Top of the World Trade Center Observatories)
 *    - 二階式高架散步道、金屬防護圍欄、觀景望遠鏡與天台機電設施
 * 3. 雙塔外立面密柱 (FacadeColumns)、主體核心 (BuildingCore) 與 X-Ray 內部鋼骨筒 (SteelCore)
 *
 * 導出工廠函式：
 * createTwinTowers(options): {
 *   group,
 *   northTower,
 *   southTower,
 *   setNightMode,
 *   setXRayMode,
 *   update
 * }
 */

import * as THREE from 'three';
import { BuildingCore } from './BuildingCore.js';
import { FacadeColumns } from './FacadeColumns.js';
import { SteelCore } from './SteelCore.js';

/**
 * 建造 1 WTC 北塔頂部 110 米高通訊天線 (總高 526 米)
 * 包含重型基座、多層微波中繼平台、錐形鋼桁架針尖與規律跳動的紅色航標燈
 */
function createNorthTowerAntenna() {
  const group = new THREE.Group();
  group.name = 'NorthTowerAntenna';

  const mastMat = new THREE.MeshStandardMaterial({
    color: 0xd4dadf,
    metalness: 0.8,
    roughness: 0.3
  });

  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x333942,
    metalness: 0.5,
    roughness: 0.7
  });

  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf0f3f6,
    metalness: 0.6,
    roughness: 0.4
  });

  // 1. 天線基座台 (y = 415 ~ 423m)
  const baseGeo = new THREE.CylinderGeometry(4.2, 5.8, 8, 16);
  const baseMesh = new THREE.Mesh(baseGeo, platformMat);
  baseMesh.position.y = 415 + 4;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // 支撐斜拉環
  const ringGeo = new THREE.TorusGeometry(4.8, 0.35, 8, 24);
  const ringMesh = new THREE.Mesh(ringGeo, mastMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 422;
  group.add(ringMesh);

  // 2. 下段重型桁架塔身 (y = 423 ~ 455m, 高 32m)
  const sec1Geo = new THREE.CylinderGeometry(2.6, 3.8, 32, 12);
  const sec1Mesh = new THREE.Mesh(sec1Geo, mastMat);
  sec1Mesh.position.y = 423 + 16;
  sec1Mesh.castShadow = true;
  group.add(sec1Mesh);

  // 第一層環形設備平台 (y = 442m)
  const plat1Geo = new THREE.CylinderGeometry(5.2, 5.2, 0.8, 24);
  const plat1Mesh = new THREE.Mesh(plat1Geo, platformMat);
  plat1Mesh.position.y = 442;
  group.add(plat1Mesh);

  // 在第一層平台上安裝 4 面微波碟形天線 (Microwave Dishes)
  const dishGeo = new THREE.CylinderGeometry(1.2, 0.4, 0.6, 16);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.z = Math.PI / 2;
    dish.rotation.y = angle;
    dish.position.set(Math.cos(angle) * 4.8, 443.5, Math.sin(angle) * 4.8);
    group.add(dish);
  }

  // 3. 中段錐形天線身 (y = 455 ~ 485m, 高 30m)
  const sec2Geo = new THREE.CylinderGeometry(1.6, 2.6, 30, 10);
  const sec2Mesh = new THREE.Mesh(sec2Geo, mastMat);
  sec2Mesh.position.y = 455 + 15;
  sec2Mesh.castShadow = true;
  group.add(sec2Mesh);

  // 第二層環形通訊平台 (y = 472m)
  const plat2Geo = new THREE.CylinderGeometry(3.8, 3.8, 0.6, 20);
  const plat2Mesh = new THREE.Mesh(plat2Geo, platformMat);
  plat2Mesh.position.y = 472;
  group.add(plat2Mesh);

  // 4. 上段細長桁架塔 (y = 485 ~ 512m, 高 27m)
  const sec3Geo = new THREE.CylinderGeometry(0.8, 1.6, 27, 8);
  const sec3Mesh = new THREE.Mesh(sec3Geo, mastMat);
  sec3Mesh.position.y = 485 + 13.5;
  sec3Mesh.castShadow = true;
  group.add(sec3Mesh);

  // 5. 頂端尖頂鋼針 (y = 512 ~ 526m, 達到 526 米頂峰)
  const needleGeo = new THREE.ConeGeometry(0.4, 14, 8);
  const needleMesh = new THREE.Mesh(needleGeo, mastMat);
  needleMesh.position.y = 512 + 7;
  group.add(needleMesh);

  // 6. 頂部紅色航空障礙燈 (Pulsing Red Aviation Beacon Light)
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff0022,
    emissive: 0xff0022,
    emissiveIntensity: 2.5,
    roughness: 0.1,
    metalness: 0.9
  });
  const beaconGeo = new THREE.SphereGeometry(0.65, 16, 16);
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.y = 526.0;
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0xff0022, 3.5, 450);
  beaconLight.position.y = 526.2;
  group.add(beaconLight);

  // 中階障礙輔助警示燈 (2 處)
  const midBeaconGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const midBeacon1 = new THREE.Mesh(midBeaconGeo, beaconMat);
  midBeacon1.position.set(0, 443, 4.8);
  group.add(midBeacon1);

  const midBeacon2 = new THREE.Mesh(midBeaconGeo, beaconMat);
  midBeacon2.position.set(0, 473, 3.6);
  group.add(midBeacon2);

  let pulseTimer = 0;

  return {
    group,
    update(delta) {
      pulseTimer += delta * 3.5;
      // 模擬經典航空警示燈明暗呼吸律動
      const pulse = Math.sin(pulseTimer) * 0.5 + 0.5;
      const intensity = 1.0 + Math.pow(pulse, 3) * 4.0;
      beaconMat.emissiveIntensity = intensity;
      beaconLight.intensity = intensity;
    },
    setXRayMode(isXRay) {
      if (isXRay) {
        mastMat.transparent = true;
        mastMat.opacity = 0.25;
        platformMat.transparent = true;
        platformMat.opacity = 0.2;
      } else {
        mastMat.transparent = false;
        mastMat.opacity = 1.0;
        platformMat.transparent = false;
        platformMat.opacity = 1.0;
      }
    }
  };
}

/**
 * 建造 2 WTC 南塔頂部 110 樓室外露天觀景台 (Top of the World Trade Center Observatories)
 * 包含二階木質散步木棧道、玻璃擋風欄杆、觀景望遠鏡與天台設施
 */
function createSouthTowerObservationDeck() {
  const group = new THREE.Group();
  group.name = 'SouthTowerObservationDeck';

  // 觀景平台地坪木紋/防滑材質
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x5a534c,
    roughness: 0.8,
    metalness: 0.15
  });

  // 欄杆金屬材質
  const railingMat = new THREE.MeshStandardMaterial({
    color: 0xd0d5dc,
    roughness: 0.35,
    metalness: 0.85
  });

  // 防風擋風玻璃材質
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa8d5e5,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.35
  });

  // 1. 第一階下層環形觀景步道 (y = 415 ~ 416.5m)
  const lowerDeckGeo = new THREE.BoxGeometry(50, 1.4, 50);
  const lowerDeck = new THREE.Mesh(lowerDeckGeo, deckMat);
  lowerDeck.position.y = 415 + 0.7;
  lowerDeck.receiveShadow = true;
  group.add(lowerDeck);

  // 2. 第二階中央高架眺望台 (y = 416.4 ~ 417.8m)
  const upperDeckGeo = new THREE.BoxGeometry(36, 1.2, 36);
  const upperDeck = new THREE.Mesh(upperDeckGeo, deckMat);
  upperDeck.position.y = 416.4 + 0.6;
  upperDeck.receiveShadow = true;
  group.add(upperDeck);

  // 3. 觀景台金屬與玻璃安全防護圍欄 (高 2.2 米，沿下層外緣 50m 圍繞)
  const fenceH = 2.2;
  const halfSpan = 24.5;
  const fenceCenterY = 416.4 + fenceH / 2;

  // 4 面玻璃擋風欄杆
  const glassSides = [
    { pos: [0, fenceCenterY, halfSpan], size: [49, fenceH, 0.1] },
    { pos: [0, fenceCenterY, -halfSpan], size: [49, fenceH, 0.1] },
    { pos: [halfSpan, fenceCenterY, 0], size: [0.1, fenceH, 49] },
    { pos: [-halfSpan, fenceCenterY, 0], size: [0.1, fenceH, 49] }
  ];

  glassSides.forEach((side) => {
    const gGeo = new THREE.BoxGeometry(...side.size);
    const gMesh = new THREE.Mesh(gGeo, glassMat);
    gMesh.position.set(...side.pos);
    group.add(gMesh);
  });

  // 扶手立柱 (圍繞邊緣每隔 5 米立一根)
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, fenceH, 8);
  for (let x = -24; x <= 24; x += 6) {
    const p1 = new THREE.Mesh(postGeo, railingMat);
    p1.position.set(x, fenceCenterY, halfSpan);
    group.add(p1);

    const p2 = new THREE.Mesh(postGeo, railingMat);
    p2.position.set(x, fenceCenterY, -halfSpan);
    group.add(p2);
  }
  for (let z = -24; z <= 24; z += 6) {
    const p1 = new THREE.Mesh(postGeo, railingMat);
    p1.position.set(halfSpan, fenceCenterY, z);
    group.add(p1);

    const p2 = new THREE.Mesh(postGeo, railingMat);
    p2.position.set(-halfSpan, fenceCenterY, z);
    group.add(p2);
  }

  // 4. 四角經典投幣式雙筒觀景望遠鏡 (Coin-operated Telescopes)
  const telescopeMat = new THREE.MeshStandardMaterial({
    color: 0x8894a0,
    metalness: 0.9,
    roughness: 0.2
  });
  const tBaseGeo = new THREE.CylinderGeometry(0.18, 0.3, 1.2, 12);
  const tHeadGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.6, 8);

  const telescopePositions = [
    { x: 22, z: 22, rot: Math.PI / 4 },
    { x: -22, z: 22, rot: -Math.PI / 4 },
    { x: 22, z: -22, rot: (3 * Math.PI) / 4 },
    { x: -22, z: -22, rot: -(3 * Math.PI) / 4 }
  ];

  telescopePositions.forEach((tp) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(tp.x, 416.4, tp.z);
    tGroup.rotation.y = tp.rot;

    const base = new THREE.Mesh(tBaseGeo, telescopeMat);
    base.position.y = 0.6;
    tGroup.add(base);

    const head = new THREE.Mesh(tHeadGeo, telescopeMat);
    head.rotation.x = Math.PI / 2 - 0.2; // 微仰視視野
    head.position.set(0, 1.25, 0);
    tGroup.add(head);

    group.add(tGroup);
  });

  return {
    group,
    setXRayMode(isXRay) {
      if (isXRay) {
        deckMat.transparent = true;
        deckMat.opacity = 0.2;
        railingMat.transparent = true;
        railingMat.opacity = 0.2;
      } else {
        deckMat.transparent = false;
        deckMat.opacity = 1.0;
        railingMat.transparent = false;
        railingMat.opacity = 1.0;
      }
    }
  };
}

/**
 * 建造單座完整世界貿易中心塔樓 (包含 Core, Facade, SteelCore, 以及頂部配件)
 * @param {Object} config
 */
function createTowerInstance(config) {
  const {
    id,
    name,
    position,
    isNorth,
    windowTextureDay,
    windowTextureNight,
    isNight
  } = config;

  const towerGroup = new THREE.Group();
  towerGroup.name = name;
  towerGroup.position.set(position.x, position.y, position.z);

  // 1. 建築立面與主體核心
  const buildingCore = new BuildingCore({
    width: 63.14,
    depth: 63.14,
    height: 415,
    windowTextureDay,
    windowTextureNight,
    isNight
  });
  towerGroup.add(buildingCore.group);

  // 2. 密集鋁柱立面與地面三叉戟
  const facadeColumns = new FacadeColumns({
    width: 63.14,
    depth: 63.14,
    height: 415,
    columnsPerSide: 59
  });
  towerGroup.add(facadeColumns.group);

  // 3. 內部核心筒鋼骨與桁架 (X-Ray 透視用)
  const steelCore = new SteelCore({
    towerWidth: 63.14,
    towerDepth: 63.14,
    towerHeight: 415,
    coreWidth: 27,
    coreDepth: 40
  });
  towerGroup.add(steelCore.group);

  // 4. 頂部專屬特色設施 (北塔天線 / 南塔觀景台)
  let roofFeature = null;
  if (isNorth) {
    roofFeature = createNorthTowerAntenna();
    towerGroup.add(roofFeature.group);
  } else {
    roofFeature = createSouthTowerObservationDeck();
    towerGroup.add(roofFeature.group);
  }

  return {
    group: towerGroup,
    buildingCore,
    facadeColumns,
    steelCore,
    roofFeature,
    setNightMode(night) {
      buildingCore.setNightMode(night);
    },
    setXRayMode(xray) {
      buildingCore.setXRayMode(xray);
      facadeColumns.setXRayMode(xray);
      steelCore.setXRayMode(xray);
      if (roofFeature && roofFeature.setXRayMode) {
        roofFeature.setXRayMode(xray);
      }
    },
    update(delta) {
      if (roofFeature && roofFeature.update) {
        roofFeature.update(delta);
      }
    }
  };
}

/**
 * 導出雙塔總裝工廠函式
 *
 * @param {Object} options
 * @param {THREE.Texture} [options.windowTextureDay] - 白天辦公室立面貼圖
 * @param {THREE.Texture} [options.windowTextureNight] - 夜間點燈立面貼圖
 * @param {{x: number, y: number, z: number}} [options.northTowerPos] - 北塔位置 (預設 x:-70, y:0, z:-70)
 * @param {{x: number, y: number, z: number}} [options.southTowerPos] - 南塔位置 (預設 x:70, y:0, z:70)
 * @param {boolean} [options.isNight=false] - 初始夜間狀態
 * @returns {{
 *   group: THREE.Group,
 *   northTower: THREE.Group,
 *   southTower: THREE.Group,
 *   setNightMode: (night: boolean) => void,
 *   setXRayMode: (xray: boolean) => void,
 *   update: (delta: number) => void
 * }}
 */
export function createTwinTowers(options = {}) {
  const group = new THREE.Group();
  group.name = 'TwinTowersComplex';

  const northTowerPos = options.northTowerPos || { x: -70, y: 0, z: -70 };
  const southTowerPos = options.southTowerPos || { x: 70, y: 0, z: 70 };
  const isNight = !!options.isNight;

  // 1 WTC 北塔
  const north = createTowerInstance({
    id: '1wtc',
    name: '1_WTC_NorthTower',
    position: northTowerPos,
    isNorth: true,
    windowTextureDay: options.windowTextureDay,
    windowTextureNight: options.windowTextureNight,
    isNight
  });
  group.add(north.group);

  // 2 WTC 南塔
  const south = createTowerInstance({
    id: '2wtc',
    name: '2_WTC_SouthTower',
    position: southTowerPos,
    isNorth: false,
    windowTextureDay: options.windowTextureDay,
    windowTextureNight: options.windowTextureNight,
    isNight
  });
  group.add(south.group);

  return {
    group,
    northTower: north.group,
    southTower: south.group,
    setNightMode(night) {
      north.setNightMode(night);
      south.setNightMode(night);
    },
    setXRayMode(xray) {
      north.setXRayMode(xray);
      south.setXRayMode(xray);
    },
    update(delta) {
      north.update(delta);
      south.update(delta);
    }
  };
}
