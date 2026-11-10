/**
 * WTC Twin Towers Three.js - Procedural Commercial Airliner
 * 遠景平穩巡航民航機 (Scenic Background Airplane)
 * 
 * 規格：
 * - 比例尺約 36 米翼展、38 米機長之雙發動機現代噴射客機
 * - 流線型圓柱機身、前錐形機頭、駕駛艙風擋、後掠主機翼（帶小翼）、垂直尾翼、水平尾翼
 * - 雙具機翼懸掛高涵道比渦扇噴射發動機（帶進氣口金屬唇環與風扇核心）
 * - 塗裝：光潔白色機身、深海軍藍經典腰線、金屬鋁合金前緣
 * - 航空信號燈：左翼尖紅燈、右翼尖綠燈、機尾白燈、機頂/機腹雙頻防撞閃光信號燈
 * - 遠景巡航：外圍高空平滑橢圓軌道 (半徑 ~500m, 高度 ~320m)，流暢航向切線導向與自然內傾轉彎角度
 */

import * as THREE from 'three';

/**
 * 建立 NACA 四位數翼型幾何體
 * @param {Object} params
 * @param {number} params.span 翼展半長
 * @param {number} params.rootChord 翼根弦長
 * @param {number} params.tipChord 翼尖弦長
 * @param {number} params.sweep 後掠距離
 * @param {number} params.dihedral 上反高度
 * @param {number} params.rootThickness 翼根厚度
 * @param {number} params.tipThickness 翼尖厚度
 * @param {boolean} params.isLeft 是否為左翼
 * @returns {THREE.BufferGeometry}
 */
function createAirfoilWingGeometry({
  span = 16.0,
  rootChord = 5.6,
  tipChord = 1.8,
  sweep = 7.5,
  dihedral = 1.2,
  rootThickness = 0.65,
  tipThickness = 0.2,
  isLeft = false
}) {
  const spanSegments = 8;
  const chordSegments = 16;
  const vertices = [];
  const indices = [];
  const uvs = [];

  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i <= spanSegments; i++) {
    const u = i / spanSegments; // 0 (root) -> 1 (tip)
    const x = sideSign * (1.8 + u * span);
    const yCenter = u * dihedral;
    const zLeading = -2.2 + u * sweep;
    const chord = rootChord * (1 - u) + tipChord * u;
    const thickness = rootThickness * (1 - u) + tipThickness * u;

    // 沿翼型周長 (從後緣下表面 -> 前緣 -> 後緣上表面)
    for (let j = 0; j <= chordSegments; j++) {
      const v = j / chordSegments; // 0 -> 1
      // 翼型參數 theta: 0 到 2*PI
      const angle = v * Math.PI * 2;
      const s = 0.5 * (1 - Math.cos(angle)); // 0 at leading edge, 1 at trailing edge
      
      // NACA 翼型厚度公式簡化
      const halfThick = thickness * 5 * (
        0.2969 * Math.sqrt(Math.max(0, s)) -
        0.1260 * s -
        0.3516 * s * s +
        0.2843 * s * s * s -
        0.1015 * s * s * s * s
      );

      const z = zLeading + s * chord;
      const yOffset = Math.sin(angle) * halfThick;
      const y = yCenter + yOffset;

      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // 構建面索引
  const ringSize = chordSegments + 1;
  for (let i = 0; i < spanSegments; i++) {
    for (let j = 0; j < chordSegments; j++) {
      const a = i * ringSize + j;
      const b = (i + 1) * ringSize + j;
      const c = (i + 1) * ringSize + (j + 1);
      const d = i * ringSize + (j + 1);

      if (isLeft) {
        indices.push(a, c, b);
        indices.push(a, d, c);
      } else {
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * 建立民航客機 3D 模型與航行控制邏輯
 * @param {Object} options 
 * @param {number} [options.radiusX=520] 巡航軌道半長軸 (米)
 * @param {number} [options.radiusZ=480] 巡航軌道半短軸 (米)
 * @param {number} [options.altitude=320] 巡航基準高度 (米)
 * @param {number} [options.speed=0.045] 巡航角速度 (rad/s)
 * @param {number} [options.centerX=0] 巡航軌道中心 X
 * @param {number} [options.centerZ=0] 巡航軌道中心 Z
 * @returns {{ mesh: THREE.Group, update: (delta: number, time: number) => void }}
 */
export function createAirplane(options = {}) {
  const {
    radiusX = 520,
    radiusZ = 480,
    altitude = 320,
    speed = 0.045,
    centerX = 0,
    centerZ = 0
  } = options;

  // 主根群組 (負責全局航線位置與前進朝向)
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Airplane_Root';

  // 內部模型群組 (負責內傾轉彎 Bank/Roll 與微小俯仰姿態)
  const modelGroup = new THREE.Group();
  modelGroup.name = 'Airplane_Model';
  rootGroup.add(modelGroup);

  // ==========================================
  // 材質庫 (Materials)
  // ==========================================
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xfafcff,
    roughness: 0.22,
    metalness: 0.12,
    name: 'Airplane_Fuselage'
  });

  const navyLiveryMat = new THREE.MeshStandardMaterial({
    color: 0x0c2548,
    roughness: 0.28,
    metalness: 0.25,
    name: 'Airplane_Livery_Navy'
  });

  const aluminumLeadingEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.18,
    metalness: 0.88,
    name: 'Airplane_Aluminum_LeadingEdge'
  });

  const wingSurfaceMat = new THREE.MeshStandardMaterial({
    color: 0xe6ebf0,
    roughness: 0.32,
    metalness: 0.15,
    name: 'Airplane_Wing_Surface'
  });

  const cockpitGlassMat = new THREE.MeshStandardMaterial({
    color: 0x07111e,
    roughness: 0.08,
    metalness: 0.92,
    name: 'Airplane_Cockpit_Glass'
  });

  const engineDarkInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x181c20,
    roughness: 0.7,
    metalness: 0.6,
    name: 'Airplane_Engine_Interior'
  });

  const engineLipMat = new THREE.MeshStandardMaterial({
    color: 0xecf0f5,
    roughness: 0.12,
    metalness: 0.92,
    name: 'Airplane_Engine_Lip'
  });

  const engineExhaustMat = new THREE.MeshStandardMaterial({
    color: 0x3d3935,
    roughness: 0.5,
    metalness: 0.8,
    name: 'Airplane_Engine_Exhaust'
  });

  // ==========================================
  // 1. 機身主體 (Fuselage)
  // ==========================================
  const fuselageGroup = new THREE.Group();
  fuselageGroup.name = 'Fuselage_Group';

  // 中段客艙圓柱 (直徑 3.7m, 長度 23m)
  const cabinGeo = new THREE.CylinderGeometry(1.85, 1.85, 23, 32, 1, false);
  cabinGeo.rotateX(Math.PI / 2);
  const cabinMesh = new THREE.Mesh(cabinGeo, fuselageMat);
  cabinMesh.position.set(0, 0, 0);
  fuselageGroup.add(cabinMesh);

  // 前段機頭錐體 (長度 7.5m, 從半徑 1.85m 平滑收攏至 0.4m)
  const noseGeo = new THREE.CylinderGeometry(0.4, 1.85, 7.5, 32, 1, false);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, fuselageMat);
  noseMesh.position.set(0, -0.15, -15.25);
  fuselageGroup.add(noseMesh);

  // 雷達罩前端圓球
  const radomeGeo = new THREE.SphereGeometry(0.4, 24, 16);
  const radomeMesh = new THREE.Mesh(radomeGeo, fuselageMat);
  radomeMesh.position.set(0, -0.15, -19.0);
  fuselageGroup.add(radomeMesh);

  // 後段機尾錐體 (長度 9.5m, 向上傾斜並收攏至 APU 噴口)
  const tailGeo = new THREE.CylinderGeometry(1.85, 0.42, 9.5, 32, 1, false);
  tailGeo.rotateX(Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, fuselageMat);
  tailMesh.position.set(0, 0.35, 16.25);
  fuselageGroup.add(tailMesh);

  // APU 輔助動力排氣孔
  const apuGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 16);
  apuGeo.rotateX(Math.PI / 2);
  const apuMesh = new THREE.Mesh(apuGeo, engineExhaustMat);
  apuMesh.position.set(0, 0.55, 21.0);
  fuselageGroup.add(apuMesh);

  // 航空公司深藍腰線條紋 (Navy Cheatline)
  const stripeGeo = new THREE.CylinderGeometry(1.86, 1.86, 21, 32, 1, true);
  stripeGeo.rotateX(Math.PI / 2);
  const stripeMesh = new THREE.Mesh(stripeGeo, navyLiveryMat);
  stripeMesh.scale.set(1.002, 0.08, 1);
  stripeMesh.position.set(0, 0.15, 0);
  fuselageGroup.add(stripeMesh);

  // 駕駛艙風擋玻璃 (Cockpit Windshield Strip)
  const cockpitGeo = new THREE.BoxGeometry(1.9, 0.55, 1.6);
  const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitGlassMat);
  cockpitMesh.position.set(0, 0.95, -16.2);
  cockpitMesh.rotation.x = -0.32;
  fuselageGroup.add(cockpitMesh);

  // 客艙舷窗帶 (Cabin Window Bands - 兩側細緻分佈)
  const windowCount = 20;
  const windowBoxGeo = new THREE.BoxGeometry(0.12, 0.28, 0.42);
  for (let i = 0; i < windowCount; i++) {
    const zPos = -8.5 + i * 0.85;
    // 右側舷窗
    const winRight = new THREE.Mesh(windowBoxGeo, cockpitGlassMat);
    winRight.position.set(1.82, 0.38, zPos);
    fuselageGroup.add(winRight);
    // 左側舷窗
    const winLeft = new THREE.Mesh(windowBoxGeo, cockpitGlassMat);
    winLeft.position.set(-1.82, 0.38, zPos);
    fuselageGroup.add(winLeft);
  }

  modelGroup.add(fuselageGroup);

  // ==========================================
  // 2. 主機翼與翼尖小翼 (Wings & Winglets)
  // ==========================================
  const wingsGroup = new THREE.Group();
  wingsGroup.name = 'Wings_Group';

  // 右機翼 (Starboard Wing)
  const rightWingGeo = createAirfoilWingGeometry({
    span: 16.2,
    rootChord: 5.8,
    tipChord: 1.8,
    sweep: 7.6,
    dihedral: 1.25,
    rootThickness: 0.65,
    tipThickness: 0.2,
    isLeft: false
  });
  const rightWingMesh = new THREE.Mesh(rightWingGeo, wingSurfaceMat);
  wingsGroup.add(rightWingMesh);

  // 左機翼 (Port Wing)
  const leftWingGeo = createAirfoilWingGeometry({
    span: 16.2,
    rootChord: 5.8,
    tipChord: 1.8,
    sweep: 7.6,
    dihedral: 1.25,
    rootThickness: 0.65,
    tipThickness: 0.2,
    isLeft: true
  });
  const leftWingMesh = new THREE.Mesh(leftWingGeo, wingSurfaceMat);
  wingsGroup.add(leftWingMesh);

  // 鋁合金機翼前緣高光條 (Leading Edge Highlights)
  const leLength = 18.0;
  const leSlatGeo = new THREE.CylinderGeometry(0.09, 0.05, leLength, 12);
  
  // 右翼前緣金屬飾條
  const rightSlat = new THREE.Mesh(leSlatGeo, aluminumLeadingEdgeMat);
  rightSlat.position.set(9.9, 0.62, 1.6);
  rightSlat.rotation.set(0.08, -0.44, -1.49);
  wingsGroup.add(rightSlat);

  // 左翼前緣金屬飾條
  const leftSlat = new THREE.Mesh(leSlatGeo, aluminumLeadingEdgeMat);
  leftSlat.position.set(-9.9, 0.62, 1.6);
  leftSlat.rotation.set(0.08, 0.44, 1.49);
  wingsGroup.add(leftSlat);

  // 垂直翼尖小翼 (Blended Winglets)
  const wingletGeo = new THREE.BoxGeometry(0.12, 1.8, 1.4);

  // 右翼小翼
  const rightWinglet = new THREE.Mesh(wingletGeo, navyLiveryMat);
  rightWinglet.position.set(18.05, 2.05, 6.2);
  rightWinglet.rotation.set(-0.25, -0.15, -0.14);
  wingsGroup.add(rightWinglet);

  // 左翼小翼
  const leftWinglet = new THREE.Mesh(wingletGeo, navyLiveryMat);
  leftWinglet.position.set(-18.05, 2.05, 6.2);
  leftWinglet.rotation.set(-0.25, 0.15, 0.14);
  wingsGroup.add(leftWinglet);

  // 翼下襟翼整流罩 (Flap Track Fairings - 每側 3 個流線型導軌罩)
  const fairingGeo = new THREE.ConeGeometry(0.22, 2.4, 12);
  fairingGeo.rotateX(Math.PI / 2);
  const fairingOffsets = [5.5, 9.2, 13.0];
  fairingOffsets.forEach((xOffset, idx) => {
    const sweepZ = 2.4 + idx * 1.5;
    const yDihedral = 0.2 + idx * 0.35;

    // 右側整流罩
    const fairingRight = new THREE.Mesh(fairingGeo, wingSurfaceMat);
    fairingRight.position.set(xOffset, yDihedral - 0.22, sweepZ + 2.0);
    wingsGroup.add(fairingRight);

    // 左側整流罩
    const fairingLeft = new THREE.Mesh(fairingGeo, wingSurfaceMat);
    fairingLeft.position.set(-xOffset, yDihedral - 0.22, sweepZ + 2.0);
    wingsGroup.add(fairingLeft);
  });

  modelGroup.add(wingsGroup);

  // ==========================================
  // 3. 雙高涵道比渦扇噴射發動機 (Turbofan Engines)
  // ==========================================
  const enginesGroup = new THREE.Group();
  enginesGroup.name = 'Engines_Group';

  function createTurbofanEngine(isLeft) {
    const engine = new THREE.Group();
    const xPos = isLeft ? -6.2 : 6.2;
    engine.position.set(xPos, -1.35, 1.1);

    // 掛架 (Pylon)
    const pylonGeo = new THREE.BoxGeometry(0.28, 1.2, 3.4);
    const pylonMesh = new THREE.Mesh(pylonGeo, fuselageMat);
    pylonMesh.position.set(0, 0.85, 0.2);
    pylonMesh.rotation.x = -0.06;
    engine.add(pylonMesh);

    // 短艙主體 (Nacelle Outer Cowl)
    const nacelleGeo = new THREE.CylinderGeometry(1.08, 1.02, 4.3, 24, 1, false);
    nacelleGeo.rotateX(Math.PI / 2);
    const nacelleMesh = new THREE.Mesh(nacelleGeo, fuselageMat);
    engine.add(nacelleMesh);

    // 前端進氣道亮銀金屬唇環 (Polished Lip Ring)
    const lipGeo = new THREE.TorusGeometry(1.02, 0.08, 12, 28);
    const lipMesh = new THREE.Mesh(lipGeo, engineLipMat);
    lipMesh.position.set(0, 0, -2.15);
    engine.add(lipMesh);

    // 進氣道內部暗腔 (Intake Duct)
    const intakeGeo = new THREE.CylinderGeometry(0.96, 0.94, 0.8, 24, 1, true);
    intakeGeo.rotateX(Math.PI / 2);
    const intakeMesh = new THREE.Mesh(intakeGeo, engineDarkInteriorMat);
    intakeMesh.position.set(0, 0, -1.75);
    engine.add(intakeMesh);

    // 核心風扇旋轉整流錐 (Fan Spinner Cone)
    const spinnerGeo = new THREE.ConeGeometry(0.36, 0.95, 20);
    spinnerGeo.rotateX(-Math.PI / 2);
    const spinnerMesh = new THREE.Mesh(spinnerGeo, engineLipMat);
    spinnerMesh.position.set(0, 0, -1.6);
    engine.add(spinnerMesh);

    // 尾部核心排氣錐體 (Exhaust Nozzle)
    const exhaustGeo = new THREE.ConeGeometry(0.55, 1.3, 20);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMesh = new THREE.Mesh(exhaustGeo, engineExhaustMat);
    exhaustMesh.position.set(0, 0, 2.65);
    engine.add(exhaustMesh);

    return engine;
  }

  enginesGroup.add(createTurbofanEngine(false)); // 右發動機
  enginesGroup.add(createTurbofanEngine(true));  // 左發動機
  modelGroup.add(enginesGroup);

  // ==========================================
  // 4. 尾翼組 (Empennage: Vertical & Horizontal Stabilizers)
  // ==========================================
  const tailGroup = new THREE.Group();
  tailGroup.name = 'Tail_Group';

  // 垂直尾翼 (Vertical Stabilizer & Rudder)
  const vertFinShape = new THREE.Shape();
  vertFinShape.moveTo(11.5, 1.8);
  vertFinShape.lineTo(16.8, 8.8);
  vertFinShape.lineTo(19.4, 8.8);
  vertFinShape.lineTo(19.8, 2.2);
  vertFinShape.closePath();

  const vertFinExtrudeSettings = {
    steps: 1,
    depth: 0.36,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08
  };
  const vertFinGeo = new THREE.ExtrudeGeometry(vertFinShape, vertFinExtrudeSettings);
  vertFinGeo.translate(0, 0, -0.18);
  vertFinGeo.rotateY(Math.PI / 2);

  const vertFinMesh = new THREE.Mesh(vertFinGeo, navyLiveryMat);
  tailGroup.add(vertFinMesh);

  // 垂尾前緣金屬飾條
  const vertSlatGeo = new THREE.CylinderGeometry(0.06, 0.06, 8.8, 12);
  const vertSlatMesh = new THREE.Mesh(vertSlatGeo, aluminumLeadingEdgeMat);
  vertSlatMesh.position.set(0, 5.3, 14.15);
  vertSlatMesh.rotation.x = 0.64;
  tailGroup.add(vertSlatMesh);

  // 水平尾翼 (Horizontal Stabilizers - 帶上反與後掠)
  const hStabGeoRight = createAirfoilWingGeometry({
    span: 5.8,
    rootChord: 3.2,
    tipChord: 1.1,
    sweep: 2.8,
    dihedral: 0.5,
    rootThickness: 0.28,
    tipThickness: 0.1,
    isLeft: false
  });
  const hStabMeshRight = new THREE.Mesh(hStabGeoRight, wingSurfaceMat);
  hStabMeshRight.position.set(0, 1.0, 16.0);
  tailGroup.add(hStabMeshRight);

  const hStabGeoLeft = createAirfoilWingGeometry({
    span: 5.8,
    rootChord: 3.2,
    tipChord: 1.1,
    sweep: 2.8,
    dihedral: 0.5,
    rootThickness: 0.28,
    tipThickness: 0.1,
    isLeft: true
  });
  const hStabMeshLeft = new THREE.Mesh(hStabGeoLeft, wingSurfaceMat);
  hStabMeshLeft.position.set(0, 1.0, 16.0);
  tailGroup.add(hStabMeshLeft);

  modelGroup.add(tailGroup);

  // ==========================================
  // 5. 航空信號燈光系統 (Aviation Lighting)
  // ==========================================
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'Aviation_Lights';

  // (1) 左翼尖：紅色航行燈 (Navigation Red)
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff1616 });
  const redLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), redLightMat);
  redLightMesh.position.set(-18.1, 2.1, 6.2);
  lightsGroup.add(redLightMesh);

  const redPointLight = new THREE.PointLight(0xff2222, 1.5, 35);
  redPointLight.position.copy(redLightMesh.position);
  lightsGroup.add(redPointLight);

  // (2) 右翼尖：綠色航行燈 (Navigation Green)
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x18ff48 });
  const greenLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), greenLightMat);
  greenLightMesh.position.set(18.1, 2.1, 6.2);
  lightsGroup.add(greenLightMesh);

  const greenPointLight = new THREE.PointLight(0x22ff55, 1.5, 35);
  greenPointLight.position.copy(greenLightMesh.position);
  lightsGroup.add(greenPointLight);

  // (3) 機尾白光航行燈 (White Tail Position Light)
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tailLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), tailLightMat);
  tailLightMesh.position.set(0, 0.6, 21.2);
  lightsGroup.add(tailLightMesh);

  const tailPointLight = new THREE.PointLight(0xffffff, 1.2, 25);
  tailPointLight.position.copy(tailLightMesh.position);
  lightsGroup.add(tailPointLight);

  // (4) 翼尖高亮度白色雙頻防撞閃爍燈 (Strobe Lights)
  const wingStrobeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  });

  const leftWingStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), wingStrobeMat);
  leftWingStrobe.position.set(-18.15, 2.15, 6.4);
  lightsGroup.add(leftWingStrobe);

  const rightWingStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), wingStrobeMat);
  rightWingStrobe.position.set(18.15, 2.15, 6.4);
  lightsGroup.add(rightWingStrobe);

  const wingStrobeLight = new THREE.PointLight(0xffffff, 0, 50);
  wingStrobeLight.position.set(0, 2.0, 6.0);
  lightsGroup.add(wingStrobeLight);

  // (5) 機頂與機腹紅色信號燈 (Dorsal & Ventral Beacons - 1Hz 頻率節奏閃爍)
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xff0020,
    transparent: true,
    opacity: 0.2
  });

  // 機頂信號燈
  const dorsalBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), beaconMat);
  dorsalBeacon.position.set(0, 1.95, -1.0);
  lightsGroup.add(dorsalBeacon);

  // 機腹信號燈
  const ventralBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), beaconMat);
  ventralBeacon.position.set(0, -1.95, 2.5);
  lightsGroup.add(ventralBeacon);

  const beaconPointLight = new THREE.PointLight(0xff0022, 0, 40);
  beaconPointLight.position.set(0, 0, 0);
  lightsGroup.add(beaconPointLight);

  modelGroup.add(lightsGroup);

  // ==========================================
  // 6. 遠景巡航軌道動力學與實時更新 (Flight Dynamics)
  // ==========================================
  let currentAngle = 0.35; // 初始相位角
  let internalTime = 0;

  // 暫存向量以避免 GC 壓力
  const currentPos = new THREE.Vector3();
  const nextPos = new THREE.Vector3();
  const tangentDir = new THREE.Vector3();

  /**
   * 計算特定角度下的巡航位置
   * @param {number} theta 軌道角度
   * @param {THREE.Vector3} target 輸出向量
   */
  function getOrbitPosition(theta, target) {
    target.x = centerX + radiusX * Math.cos(theta);
    target.z = centerZ + radiusZ * Math.sin(theta);
    // 高空平穩巡航，疊加微小極低頻呼吸起伏 (±3.5m)
    target.y = altitude + Math.sin(theta * 2.0) * 3.5;
  }

  /**
   * 動態幀更新函數
   * @param {number} delta 每幀時差 (秒)
   * @param {number} [time] 總運行時間 (秒)
   */
  function update(delta, time) {
    const dt = Math.min(delta || 0.016, 0.1);
    internalTime = time !== undefined ? time : internalTime + dt;

    // 1. 推進巡航角度
    currentAngle += speed * dt;
    if (currentAngle > Math.PI * 2) {
      currentAngle -= Math.PI * 2;
    }

    // 2. 計算目前位置與前方切線朝向點
    getOrbitPosition(currentAngle, currentPos);
    getOrbitPosition(currentAngle + 0.02, nextPos);

    rootGroup.position.copy(currentPos);

    // 讓客機 nose (-Z 方向) 平滑瞄準前進切線方向
    tangentDir.subVectors(nextPos, currentPos).normalize();
    const lookTarget = currentPos.clone().add(tangentDir);
    rootGroup.lookAt(lookTarget);

    // 3. 內傾轉彎滾轉角 (Bank/Roll into turn)
    // 當逆時針巡航時，機身向左平滑內傾約 6.5 度 (0.115 rad)
    const baseBankAngle = -0.115;
    // 隨橢圓軌道曲率微調內傾深度
    const curvatureFactor = (radiusX / radiusZ);
    const dynamicBank = baseBankAngle * (1.0 + 0.15 * Math.sin(currentAngle * 2.0));
    modelGroup.rotation.z = dynamicBank;

    // 4. 機身防撞信號燈與翼尖閃光燈動畫 (1Hz 擬真航空燈光節奏)
    const cycle = internalTime % 1.0; // 1.0 秒週期 (1Hz)

    // 機頂/機腹紅色 Beacon 閃爍節奏 (正弦脈衝波)
    const beaconPulse = Math.pow(Math.max(0, Math.sin(cycle * Math.PI)), 5.0);
    beaconMat.opacity = 0.2 + 0.8 * beaconPulse;
    beaconPointLight.intensity = beaconPulse * 2.5;

    // 翼尖白色 Strobe 閃光 (經典雙閃雙脈衝: 0.00-0.08s 第一閃, 0.18-0.26s 第二閃)
    const isStrobeActive = (cycle >= 0.0 && cycle < 0.08) || (cycle >= 0.18 && cycle < 0.26);
    if (isStrobeActive) {
      wingStrobeMat.opacity = 1.0;
      wingStrobeLight.intensity = 4.0;
    } else {
      wingStrobeMat.opacity = 0.0;
      wingStrobeLight.intensity = 0.0;
    }
  }

  // 初始化首次位置與姿態
  update(0, 0);

  return {
    mesh: rootGroup,
    update
  };
}
