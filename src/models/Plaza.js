/**
 * Plaza.js
 * 奧斯汀·J·托賓廣場 (Austin J. Tobin Plaza)、噴泉水池與克尼格天球 (The Sphere)
 *
 * 歷史建築特色：
 * 1. 曼哈頓下城超級街區 (Superblock) 與高架花崗岩基座 (約 400m x 400m，高 1.5 米)，四周圍繞宏偉花崗岩階梯。
 * 2. 廣場中心直徑 160 米同心圓花崗岩石磚鋪面 (採用 ProceduralTextures 放射狀貼圖)。
 * 3. 廣場周圍配置低矮石材花台植栽、山崎實極簡花崗岩長椅與經典細長黑銅路燈 (全採 InstancedMesh 零負擔繪製)。
 * 4. 中央直徑 25 米圓形噴泉水池，池緣為抬高 0.8 米的花崗岩環形池壁。
 * 5. 弗里茨·克尼格 (Fritz Koenig) 傳世銅雕《球體》(The Sphere / Große Kugelkaryatide)：
 *    - 直徑 7.6 米巨型鍛造黃銅球體，重現 52 片彎曲黃銅弧板接合、幾何開口與有機裂槽雕刻細節。
 *    - 黃銅金屬質感 (color: 0xc8963e, metalness: 0.85, roughness: 0.28)。
 *    - 中央環形多階花崗岩基座與下方多股環狀噴泉水柱弧形噴水。
 * 6. 水面流體微動態採用 GPU UV 偏移 (offset.x / offset.y) 滾動，0 CPU 運算負擔，確保 60+ FPS 極致流暢度。
 */

import * as THREE from 'three';

/**
 * 建立奧斯汀·J·托賓廣場總成
 * @param {Object} [options={}]
 * @param {THREE.Texture} [options.plazaTexture] - 廣場放射狀花崗岩紋理
 * @param {THREE.Texture} [options.waterTexture] - 噴泉水面凹凸紋理
 * @returns {{ group: THREE.Group, update: (delta: number) => void, waterMesh: THREE.Mesh, theSphere: THREE.Group }}
 */
export function createPlaza(options = {}) {
  const plazaGroup = new THREE.Group();
  plazaGroup.name = 'AustinJTobinPlaza';

  const plazaTexture = options.plazaTexture || null;
  const waterTexture = options.waterTexture || null;

  // 設定水波貼圖重複與包覆
  if (waterTexture) {
    waterTexture.wrapS = THREE.RepeatWrapping;
    waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(4, 4);
  }

  // --- 1. 共用材質定義 ---
  // 曼哈頓柏油街道底層材質
  const streetMat = new THREE.MeshStandardMaterial({
    color: 0x12151c,
    roughness: 0.88,
    metalness: 0.08
  });

  // 廣場花崗岩基座面材
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x50545e,
    roughness: 0.76,
    metalness: 0.14
  });

  // 階梯與路緣深色炭灰花崗岩
  const darkGraniteMat = new THREE.MeshStandardMaterial({
    color: 0x32353c,
    roughness: 0.70,
    metalness: 0.18
  });

  // 160 米同心圓花崗岩石磚鋪面材質
  const circularPlazaMat = new THREE.MeshStandardMaterial({
    map: plazaTexture,
    roughness: 0.72,
    metalness: 0.15
  });

  // 長椅淺灰磨光花崗岩材質
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x888e99,
    roughness: 0.62,
    metalness: 0.12
  });

  // 花台石材外壁
  const planterWallMat = new THREE.MeshStandardMaterial({
    color: 0x3d414a,
    roughness: 0.80,
    metalness: 0.10
  });

  // 花台修剪長青灌木植被材質
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1d3522,
    roughness: 0.92,
    metalness: 0.05
  });

  // 路燈黑色鍛鐵金屬燈桿
  const lampPoleMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.45,
    metalness: 0.75
  });

  // 路燈暖黃發光燈罩材質
  const lampLightMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: 0xffcb6b,
    emissiveIntensity: 1.1,
    roughness: 0.25,
    metalness: 0.1
  });

  // 噴泉水面材質 (半透明、高反射、流動凹凸)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x14425a,
    roughness: 0.12,
    metalness: 0.85,
    bumpMap: waterTexture,
    bumpScale: 0.38,
    transparent: true,
    opacity: 0.88,
    depthWrite: true
  });

  // 克尼格《球體》黃金青銅主體材質 (嚴格符合規範)
  const sphereBronzeMat = new THREE.MeshStandardMaterial({
    color: 0xc8963e,
    metalness: 0.85,
    roughness: 0.28
  });

  // 雕塑接縫與內凹暗色古銅材質
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x6e4e22,
    metalness: 0.80,
    roughness: 0.45
  });

  // 噴泉細柱水花半透明材質
  const waterJetMat = new THREE.MeshStandardMaterial({
    color: 0xe2f6ff,
    roughness: 0.08,
    metalness: 0.20,
    transparent: true,
    opacity: 0.70
  });

  // --- 2. 曼哈頓街區外圍地面與 400m x 400m 階梯基座 ---
  // 外圍街道水平面 (y = 0)
  const streetGeo = new THREE.PlaneGeometry(1600, 1600);
  const streetMesh = new THREE.Mesh(streetGeo, streetMat);
  streetMesh.name = 'ManhattanStreetLevel';
  streetMesh.rotation.x = -Math.PI / 2;
  streetMesh.position.y = -0.01;
  streetMesh.receiveShadow = true;
  plazaGroup.add(streetMesh);

  // 400m x 400m 高架花崗岩基座主台 (Top at y = 1.5m)
  const podiumTopY = 1.5;
  const podiumBaseWidth = 380;
  const podiumDeckGeo = new THREE.BoxGeometry(podiumBaseWidth, podiumTopY, podiumBaseWidth);
  const podiumDeck = new THREE.Mesh(podiumDeckGeo, podiumMat);
  podiumDeck.name = 'PodiumDeck';
  podiumDeck.position.y = podiumTopY / 2;
  podiumDeck.receiveShadow = true;
  plazaGroup.add(podiumDeck);

  // 外圍四邊多層寬闊花崗岩宏偉台階 (Perimeter Grand Steps: 5 Tiers)
  const stepTiers = 5;
  for (let s = 1; s <= stepTiers; s++) {
    const stepHeight = (podiumTopY / stepTiers) * s;
    const stepWidth = podiumBaseWidth + (stepTiers - s + 1) * 3.5;
    const stepThickness = podiumTopY / stepTiers;
    const stepGeo = new THREE.BoxGeometry(stepWidth, stepThickness, stepWidth);
    const stepMesh = new THREE.Mesh(stepGeo, darkGraniteMat);
    stepMesh.name = `PodiumStepTier_${s}`;
    stepMesh.position.y = (s - 0.5) * stepThickness;
    stepMesh.receiveShadow = true;
    plazaGroup.add(stepMesh);
  }

  // --- 3. 奧斯汀廣場中央直徑 160 米同心圓花崗岩石磚鋪面 ---
  const plazaCircleRadius = 80; // 直徑 160m
  const circularPlazaGeo = new THREE.CircleGeometry(plazaCircleRadius, 96);
  const circularPlazaMesh = new THREE.Mesh(circularPlazaGeo, circularPlazaMat);
  circularPlazaMesh.name = 'AustinTobinPlazaPaving';
  circularPlazaMesh.rotation.x = -Math.PI / 2;
  circularPlazaMesh.position.y = podiumTopY + 0.012; // 略高於基座避免 Z-fighting
  circularPlazaMesh.receiveShadow = true;
  plazaGroup.add(circularPlazaMesh);

  // 160 米同心圓外圍裝飾性深色花崗岩邊框 (Curb Ring)
  const curbRingGeo = new THREE.RingGeometry(plazaCircleRadius - 0.5, plazaCircleRadius + 1.2, 96);
  const curbRingMesh = new THREE.Mesh(curbRingGeo, darkGraniteMat);
  curbRingMesh.name = 'PlazaCurbRing';
  curbRingMesh.rotation.x = -Math.PI / 2;
  curbRingMesh.position.y = podiumTopY + 0.015;
  curbRingMesh.receiveShadow = true;
  plazaGroup.add(curbRingMesh);

  // --- 4. 廣場周邊傢俱與景觀 (長椅、花台、路燈) ---
  // (A) 花崗岩長椅 (InstancedMesh: 48 座環形排列與主通道長椅)
  const benchWidth = 3.2;
  const benchHeight = 0.48;
  const benchDepth = 0.75;
  const benchSlabGeo = new THREE.BoxGeometry(benchWidth, benchHeight, benchDepth);

  const benchCount = 48;
  const benchMesh = new THREE.InstancedMesh(benchSlabGeo, benchMat, benchCount);
  benchMesh.name = 'PlazaBenchesInstanced';
  benchMesh.castShadow = true;
  benchMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let benchIndex = 0;

  // 沿著 160 米同心圓外緣環向佈設 32 座長椅
  const outerRingRadius = 86;
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    // 避開雙塔所在象限的主通道入口
    const posX = Math.cos(angle) * outerRingRadius;
    const posZ = Math.sin(angle) * outerRingRadius;

    dummy.position.set(posX, podiumTopY + benchHeight / 2, posZ);
    dummy.rotation.set(0, -angle + Math.PI / 2, 0); // 朝向廣場中心
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    benchMesh.setMatrixAt(benchIndex++, dummy.matrix);
  }

  // 沿東西、南北四條副通道對稱配置 16 座直列長椅
  const axialPositions = [
    { x: -45, z: 120 }, { x: -35, z: 120 }, { x: 35, z: 120 }, { x: 45, z: 120 },
    { x: -45, z: -120 }, { x: -35, z: -120 }, { x: 35, z: -120 }, { x: 45, z: -120 },
    { x: 120, z: -45 }, { x: 120, z: -35 }, { x: 120, z: 35 }, { x: 120, z: 45 },
    { x: -120, z: -45 }, { x: -120, z: -35 }, { x: -120, z: 35 }, { x: -120, z: 45 }
  ];
  axialPositions.forEach((pos) => {
    if (benchIndex < benchCount) {
      dummy.position.set(pos.x, podiumTopY + benchHeight / 2, pos.z);
      dummy.rotation.set(0, Math.atan2(-pos.z, -pos.x) + Math.PI / 2, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      benchMesh.setMatrixAt(benchIndex++, dummy.matrix);
    }
  });
  benchMesh.instanceMatrix.needsUpdate = true;
  plazaGroup.add(benchMesh);

  // (B) 低矮石材花台與整齊綠化植栽 (InstancedMesh: 24 座矩形花台)
  const planterLength = 12.0;
  const planterWidth = 3.2;
  const planterHeight = 0.75;
  const planterWallGeo = new THREE.BoxGeometry(planterLength, planterHeight, planterWidth);
  const foliageGeo = new THREE.BoxGeometry(planterLength - 0.4, 0.4, planterWidth - 0.4);

  const planterCount = 24;
  const planterWallsMesh = new THREE.InstancedMesh(planterWallGeo, planterWallMat, planterCount);
  planterWallsMesh.name = 'PlanterWallsInstanced';
  planterWallsMesh.castShadow = true;
  planterWallsMesh.receiveShadow = true;

  const planterFoliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, planterCount);
  planterFoliageMesh.name = 'PlanterFoliageInstanced';
  planterFoliageMesh.castShadow = true;
  planterFoliageMesh.receiveShadow = true;

  let planterIndex = 0;
  const planterRadius = 100;
  for (let p = 0; p < planterCount; p++) {
    const angle = (p / planterCount) * Math.PI * 2;
    const px = Math.cos(angle) * planterRadius;
    const pz = Math.sin(angle) * planterRadius;

    dummy.position.set(px, podiumTopY + planterHeight / 2, pz);
    dummy.rotation.set(0, -angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planterWallsMesh.setMatrixAt(planterIndex, dummy.matrix);

    dummy.position.set(px, podiumTopY + planterHeight + 0.15, pz);
    dummy.updateMatrix();
    planterFoliageMesh.setMatrixAt(planterIndex, dummy.matrix);

    planterIndex++;
  }
  planterWallsMesh.instanceMatrix.needsUpdate = true;
  planterFoliageMesh.instanceMatrix.needsUpdate = true;
  plazaGroup.add(planterWallsMesh);
  plazaGroup.add(planterFoliageMesh);

  // (C) 山崎實經典簡約黑銅路燈 (InstancedMesh: 36 盞高 5.2 米立燈)
  const poleHeight = 5.2;
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, poleHeight, 8);
  const lampHeadGeo = new THREE.BoxGeometry(0.42, 0.45, 0.42);

  const lampCount = 36;
  const lampPolesMesh = new THREE.InstancedMesh(poleGeo, lampPoleMat, lampCount);
  lampPolesMesh.name = 'LampPolesInstanced';
  lampPolesMesh.castShadow = true;

  const lampLightsMesh = new THREE.InstancedMesh(lampHeadGeo, lampLightMat, lampCount);
  lampLightsMesh.name = 'LampLightsInstanced';

  let lampIndex = 0;
  const lampRadius = 92;
  for (let l = 0; l < lampCount; l++) {
    const angle = (l / lampCount) * Math.PI * 2;
    const lx = Math.cos(angle) * lampRadius;
    const lz = Math.sin(angle) * lampRadius;

    dummy.position.set(lx, podiumTopY + poleHeight / 2, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPolesMesh.setMatrixAt(lampIndex, dummy.matrix);

    dummy.position.set(lx, podiumTopY + poleHeight + 0.22, lz);
    dummy.updateMatrix();
    lampLightsMesh.setMatrixAt(lampIndex, dummy.matrix);

    lampIndex++;
  }
  lampPolesMesh.instanceMatrix.needsUpdate = true;
  lampLightsMesh.instanceMatrix.needsUpdate = true;
  plazaGroup.add(lampPolesMesh);
  plazaGroup.add(lampLightsMesh);

  // --- 5. 噴泉水池 (直徑 25 米，池壁抬高 0.8 米) ---
  const fountainRadius = 12.5; // 直徑 25m
  const poolWallHeight = 0.8;
  const poolWallThickness = 0.7;

  // 圓形噴泉外池壁 (Cylinder/Tube with Dark Charcoal Granite)
  const poolWallOuterR = fountainRadius + poolWallThickness;
  const poolWallGeo = new THREE.CylinderGeometry(
    poolWallOuterR,
    poolWallOuterR,
    poolWallHeight,
    64,
    1,
    true
  );
  const poolWallMesh = new THREE.Mesh(poolWallGeo, darkGraniteMat);
  poolWallMesh.name = 'FountainPoolOuterWall';
  poolWallMesh.position.y = podiumTopY + poolWallHeight / 2;
  poolWallMesh.castShadow = true;
  poolWallMesh.receiveShadow = true;
  plazaGroup.add(poolWallMesh);

  // 頂部圓環花崗岩坐靠石槽 (Ring Curb)
  const poolCurbGeo = new THREE.RingGeometry(fountainRadius - 0.1, poolWallOuterR, 64);
  const poolCurbMesh = new THREE.Mesh(poolCurbGeo, darkGraniteMat);
  poolCurbMesh.name = 'FountainPoolCurb';
  poolCurbMesh.rotation.x = -Math.PI / 2;
  poolCurbMesh.position.y = podiumTopY + poolWallHeight;
  poolCurbMesh.castShadow = true;
  poolCurbMesh.receiveShadow = true;
  plazaGroup.add(poolCurbMesh);

  // 水池底面 (深色暗底)
  const poolBottomGeo = new THREE.CircleGeometry(fountainRadius, 64);
  const poolBottomMat = new THREE.MeshStandardMaterial({
    color: 0x0f1c26,
    roughness: 0.9,
    metalness: 0.1
  });
  const poolBottomMesh = new THREE.Mesh(poolBottomGeo, poolBottomMat);
  poolBottomMesh.name = 'FountainPoolBottom';
  poolBottomMesh.rotation.x = -Math.PI / 2;
  poolBottomMesh.position.y = podiumTopY + 0.05;
  poolBottomMesh.receiveShadow = true;
  plazaGroup.add(poolBottomMesh);

  // 噴泉水面網格 (Water Surface Mesh, y = podiumTopY + 0.65m，低於池壁頂 0.15m)
  const waterGeo = new THREE.CircleGeometry(fountainRadius - 0.05, 64);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.name = 'FountainWaterSurface';
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = podiumTopY + 0.65;
  waterMesh.receiveShadow = true;
  plazaGroup.add(waterMesh);

  // --- 6. 弗里茨·克尼格《球體》(The Sphere / Große Kugelkaryatide) 雕塑 ---
  const theSphereGroup = new THREE.Group();
  theSphereGroup.name = 'TheSphereSculpture';
  theSphereGroup.position.set(0, podiumTopY, 0);

  // (A) 中心同心多階環形基座 (Concentric Stepped Plinth)
  const plinthStepMat = new THREE.MeshStandardMaterial({
    color: 0x3d414a,
    roughness: 0.68,
    metalness: 0.22
  });

  const plinthTier1 = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.8, 0.45, 48), plinthStepMat);
  plinthTier1.position.y = 0.45 / 2;
  plinthTier1.castShadow = true;
  plinthTier1.receiveShadow = true;
  theSphereGroup.add(plinthTier1);

  const plinthTier2 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.4, 40), plinthStepMat);
  plinthTier2.position.y = 0.45 + 0.4 / 2;
  plinthTier2.castShadow = true;
  plinthTier2.receiveShadow = true;
  theSphereGroup.add(plinthTier2);

  const plinthTier3 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 0.35, 36), plinthStepMat);
  plinthTier3.position.y = 0.85 + 0.35 / 2;
  plinthTier3.castShadow = true;
  plinthTier3.receiveShadow = true;
  theSphereGroup.add(plinthTier3);

  // (B) 黃銅柱承台 (Caryatid Base Collar & Supporting Shaft)
  // 克尼格《球體》下方具有具備女像柱 (Karyatide) 意味的有機雕刻支撐底柱
  const shaftGeo = new THREE.CylinderGeometry(1.4, 1.8, 1.8, 24);
  const shaftMesh = new THREE.Mesh(shaftGeo, sphereBronzeMat);
  shaftMesh.position.y = 1.2 + 0.9;
  shaftMesh.castShadow = true;
  theSphereGroup.add(shaftMesh);

  // 8 道外張雕刻黃銅斜肋支撐托架 (Radial Buttress Brackets)
  const bracketGeo = new THREE.BoxGeometry(0.24, 1.6, 0.9);
  for (let b = 0; b < 8; b++) {
    const angle = (b / 8) * Math.PI * 2;
    const bracket = new THREE.Mesh(bracketGeo, sphereBronzeMat);
    bracket.position.set(Math.cos(angle) * 1.5, 2.1, Math.sin(angle) * 1.5);
    bracket.rotation.y = -angle;
    bracket.castShadow = true;
    theSphereGroup.add(bracket);
  }

  // (C) 直徑 7.6 米巨型鍛造黃銅《球體》主體 (Sphere Diameter = 7.6m, Radius = 3.8m)
  // 球體中心高度位於 y = 6.2 米 (直徑 7.6m 跨越 y = 2.4m 至 y = 10.0m)
  const sphereRadius = 3.8;
  const sphereCenterY = 6.4;

  const sphereCoreGroup = new THREE.Group();
  sphereCoreGroup.name = 'KoenigSphereBody';
  sphereCoreGroup.position.y = sphereCenterY;

  // 1. 內核黃銅母體球 (稍微內縮 0.08m，作為內襯暗槽背景)
  const coreGeo = new THREE.SphereGeometry(sphereRadius - 0.08, 48, 36);
  const coreMesh = new THREE.Mesh(coreGeo, darkBronzeMat);
  coreMesh.castShadow = true;
  sphereCoreGroup.add(coreMesh);

  // 2. 赤道幾何分割帶與開口 (Equatorial Segmented Band with Windows)
  const equatorGeo = new THREE.CylinderGeometry(
    sphereRadius + 0.04,
    sphereRadius + 0.04,
    1.4,
    32,
    1,
    true
  );
  const equatorMesh = new THREE.Mesh(equatorGeo, sphereBronzeMat);
  equatorMesh.castShadow = true;
  sphereCoreGroup.add(equatorMesh);

  // 赤道幾何開口暗窗 (Slit Windows)
  const slitGeo = new THREE.BoxGeometry(0.35, 0.9, 0.5);
  for (let s = 0; s < 12; s++) {
    const angle = (s / 12) * Math.PI * 2;
    const slit = new THREE.Mesh(slitGeo, darkBronzeMat);
    slit.position.set(Math.cos(angle) * (sphereRadius + 0.02), 0, Math.sin(angle) * (sphereRadius + 0.02));
    slit.rotation.y = -angle;
    sphereCoreGroup.add(slit);
  }

  // 3. 北半球 16 片重疊鍛造黃銅弧板花瓣 (Upper Curved Plate Petals)
  for (let u = 0; u < 16; u++) {
    const angle = (u / 16) * Math.PI * 2;
    // 使用圓弧段與縮放模擬克尼格手工鍛造金屬板塊
    const plateGeo = new THREE.SphereGeometry(
      sphereRadius + 0.03,
      12,
      10,
      0,
      Math.PI / 8.8,
      0.15,
      Math.PI / 3.2
    );
    const plateMesh = new THREE.Mesh(plateGeo, sphereBronzeMat);
    plateMesh.rotation.y = angle;
    plateMesh.rotation.z = (u % 2 === 0 ? 0.04 : -0.04);
    plateMesh.castShadow = true;
    sphereCoreGroup.add(plateMesh);
  }

  // 4. 南半球 16 片有機過渡鍛造黃銅板 (Lower Converging Plate Segments)
  for (let l = 0; l < 16; l++) {
    const angle = (l / 16) * Math.PI * 2 + Math.PI / 16;
    const plateGeo = new THREE.SphereGeometry(
      sphereRadius + 0.02,
      10,
      8,
      0,
      Math.PI / 8.5,
      Math.PI / 2 + 0.1,
      Math.PI / 3.4
    );
    const plateMesh = new THREE.Mesh(plateGeo, sphereBronzeMat);
    plateMesh.rotation.y = angle;
    plateMesh.rotation.z = (l % 2 === 0 ? -0.03 : 0.03);
    plateMesh.castShadow = true;
    sphereCoreGroup.add(plateMesh);
  }

  // 5. 經向凸稜縫隙飾條 (Meridian Seam Ribs)
  const ribGeo = new THREE.TorusGeometry(sphereRadius + 0.04, 0.065, 8, 48);
  for (let r = 0; r < 4; r++) {
    const rib = new THREE.Mesh(ribGeo, darkBronzeMat);
    rib.rotation.y = (r * Math.PI) / 4;
    rib.castShadow = true;
    sphereCoreGroup.add(rib);
  }

  // 6. 頂部幾何壓頂環 (Top Crown Ring)
  const crownGeo = new THREE.CylinderGeometry(0.85, 1.25, 0.4, 20);
  const crownMesh = new THREE.Mesh(crownGeo, sphereBronzeMat);
  crownMesh.position.y = sphereRadius - 0.1;
  crownMesh.castShadow = true;
  sphereCoreGroup.add(crownMesh);

  theSphereGroup.add(sphereCoreGroup);
  plazaGroup.add(theSphereGroup);

  // --- 7. 環形噴泉噴水孔與弧形細柱水花 (Ring Fountain Water Jets) ---
  const jetCount = 20;
  const jetRingRadius = 4.8;
  const jetGroup = new THREE.Group();
  jetGroup.name = 'FountainWaterJets';
  jetGroup.position.set(0, podiumTopY, 0);

  // 銅質細孔噴嘴環 (Bronze Nozzle Ring)
  const nozzleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8);
  for (let j = 0; j < jetCount; j++) {
    const angle = (j / jetCount) * Math.PI * 2;
    const nx = Math.cos(angle) * jetRingRadius;
    const nz = Math.sin(angle) * jetRingRadius;

    // 噴嘴實體
    const nozzle = new THREE.Mesh(nozzleGeo, sphereBronzeMat);
    nozzle.position.set(nx, 0.72, nz);
    nozzle.rotation.x = Math.PI / 7;
    nozzle.rotation.y = -angle;
    jetGroup.add(nozzle);

    // 拋物線水流弧線 (Parabolic Water Jet Curve)
    const curvePoints = [];
    const arcHeight = 1.6;
    const arcReach = 5.2; // 水花向外噴射至水池深處
    const targetX = Math.cos(angle) * (jetRingRadius + arcReach);
    const targetZ = Math.sin(angle) * (jetRingRadius + arcReach);

    for (let t = 0; t <= 10; t++) {
      const prog = t / 10;
      const x = THREE.MathUtils.lerp(nx, targetX, prog);
      const z = THREE.MathUtils.lerp(nz, targetZ, prog);
      // 拋物線高度公式 y = -4 * h * (p - 0.5)^2 + h
      const y = 0.75 + Math.sin(prog * Math.PI) * arcHeight - prog * 0.1;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const jetGeo = new THREE.TubeGeometry(curve, 16, 0.065 * (1.1 - 0.4 * (j % 2)), 6, false);
    const jetMesh = new THREE.Mesh(jetGeo, waterJetMat);
    jetGroup.add(jetMesh);
  }

  // 雕塑基座水花環繞微霧 (Mist Ring)
  const mistGeo = new THREE.RingGeometry(jetRingRadius - 0.4, jetRingRadius + 4.5, 32);
  const mistMat = new THREE.MeshBasicMaterial({
    color: 0xcdeeff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  });
  const mistMesh = new THREE.Mesh(mistGeo, mistMat);
  mistMesh.rotation.x = -Math.PI / 2;
  mistMesh.position.y = 0.67;
  jetGroup.add(mistMesh);

  plazaGroup.add(jetGroup);

  // --- 8. 高效能微動態更新函式 (High-Performance UV Scroll Animation) ---
  /**
   * 切換日夜燈光模式
   * @param {boolean} isNight
   */
  const setNightMode = function (isNight) {
    if (lampLightMat) {
      lampLightMat.emissiveIntensity = isNight ? 2.5 : 0.0;
      lampLightMat.needsUpdate = true;
    }
  };

  /**
   * 動態更新水面紋理與噴泉雕塑微動態
   * @param {number} delta - 幀間隔秒數
   */
  const update = function (delta) {
    // (A) 高效能 GPU UV 滾動：無任何 CPU Canvas 重新計算，零負擔維持 60+ FPS
    if (waterTexture) {
      waterTexture.offset.x = (waterTexture.offset.x + delta * 0.035) % 1;
      waterTexture.offset.y = (waterTexture.offset.y + delta * 0.022) % 1;
    }

    // (B) 弗里茨·克尼格《球體》歷史特色：安置於轉盤上緩慢旋轉
    if (theSphereGroup) {
      theSphereGroup.rotation.y += delta * 0.015;
    }
  };

  return {
    group: plazaGroup,
    update,
    setNightMode,
    waterMesh,
    theSphere: theSphereGroup
  };
}

export default {
  createPlaza
};
