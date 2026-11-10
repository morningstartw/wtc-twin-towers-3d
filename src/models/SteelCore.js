/**
 * SteelCore.js
 * 世界貿易中心 (WTC)「鋼框筒中筒」(Tube-in-Tube) 內部結構核心模型
 *
 * 結構工程亮點：
 * 1. 47 根中央巨型鋼骨柱 (47 Heavy Steel Core Columns)：
 *    - 矩形核心筒尺寸約 27m x 40m，自基礎貫穿至 110 樓頂部
 *    - 承擔整座摩天大樓約 60% 的垂直重力載重
 * 2. 三段式電梯分區核心筒 (Elevator Bank Shafts)：
 *    - 低層區 (1-40 樓)、中層區 (44-74 樓)、高層區 (78-107 樓)
 *    - 包含直達 44 樓與 78 樓空中大廳 (Skylobbies) 的高速直達電梯井
 * 3. 無柱式樓板桁架網格 (Open-Web Steel Floor Trusses)：
 *    - 橫跨核心筒至外牆的開放式鋼桁架，創造無任何中間立柱的純淨辦公空間
 * 4. 頂部帽狀桁架系統 (Roof Hat Truss System, 107-110 樓)：
 *    - 連結核心鋼骨與外立柱的巨型鋼斜撐，強化抗風並穩固北塔 110 米通訊天線
 * 5. X-Ray 模式控制：平時隱藏以節省運算效能，切換時散發震撼的科技藍與亮橘全息光芒
 */

import * as THREE from 'three';

export class SteelCore {
  /**
   * @param {Object} options
   * @param {number} [options.towerWidth=63.14] - 塔樓總面寬
   * @param {number} [options.towerDepth=63.14] - 塔樓總進深
   * @param {number} [options.towerHeight=415] - 塔樓總標高
   * @param {number} [options.coreWidth=27] - 核心筒寬度 (X 方向)
   * @param {number} [options.coreDepth=40] - 核心筒深度 (Z 方向)
   */
  constructor(options = {}) {
    this.towerWidth = options.towerWidth || 63.14;
    this.towerDepth = options.towerDepth || 63.14;
    this.towerHeight = options.towerHeight || 415;
    this.coreWidth = options.coreWidth || 27;
    this.coreDepth = options.coreDepth || 40;

    this.group = new THREE.Group();
    this.group.name = 'SteelCore';
    // 預設平時隱藏，由 setXRayMode(true) 喚醒
    this.group.visible = false;

    this.initMaterials();
    this.buildCoreColumns();
    this.buildElevatorShafts();
    this.buildRepresentativeTrusses();
    this.buildHatTruss();
  }

  /**
   * 初始化核心結構的發光與全息材質
   */
  initMaterials() {
    // 47 根重型鋼柱材質 (科技電光青藍色)
    this.columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0099cc,
      emissiveIntensity: 0.85,
      roughness: 0.3,
      metalness: 0.8
    });

    // 電梯井與服務核體積材質 (半透明亮橘琥珀全息光)
    this.elevatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7b00,
      emissive: 0xff5500,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.3,
      depthWrite: false
    });

    // 樓面鋼桁架網格材質 (天藍色藍圖線條)
    this.trussMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });

    // 頂部帽狀桁架 (Hat Truss) 重型斜撐材質 (金黃色結構鋼)
    this.hatTrussMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.75
    });
  }

  /**
   * 建立 47 根中央巨型鋼骨柱 (InstancedMesh)
   * 柱網分佈於 27m x 40m 的核心區內，每根柱斷面約 0.8m x 0.6m，高 412 米
   */
  buildCoreColumns() {
    const colW = 0.8;
    const colD = 0.6;
    const colH = this.towerHeight - 3.0; // 412 米

    const colGeo = new THREE.BoxGeometry(colW, colH, colD);

    const rows = 4; // X 方向 4 排
    const cols = 12; // Z 方向 12 欄 (4 * 12 = 48 柱，扣除 1 個電梯通風井 = 47 根)
    const count = 47;

    this.columnsMesh = new THREE.InstancedMesh(colGeo, this.columnMaterial, count);
    this.columnsMesh.name = 'CoreColumns47';

    const dummy = new THREE.Object3D();
    const xStep = this.coreWidth / (rows - 1);
    const zStep = this.coreDepth / (cols - 1);
    const xStart = -this.coreWidth / 2;
    const zStart = -this.coreDepth / 2;
    const centerY = colH / 2;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 略過第 2 排第 6 欄以符合 47 根精確真實規格
        if (r === 1 && c === 5) continue;
        if (idx >= count) break;

        const x = xStart + r * xStep;
        const z = zStart + c * zStep;

        dummy.position.set(x, centerY, z);
        dummy.updateMatrix();
        this.columnsMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }

    this.columnsMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.columnsMesh);
  }

  /**
   * 建立三段式垂直電梯井組與空中大廳 (Skylobbies at 44 & 78)
   */
  buildElevatorShafts() {
    const totalFloors = 110;
    const floorH = this.towerHeight / totalFloors;

    // 1. 直達特快車井 (Express Elevators 1 to 44, 1 to 78)
    const expressGeo = new THREE.BoxGeometry(this.coreWidth * 0.35, 78 * floorH, this.coreDepth * 0.35);
    const expressMesh = new THREE.Mesh(expressGeo, this.elevatorMaterial);
    expressMesh.position.set(-this.coreWidth * 0.25, (78 * floorH) / 2, 0);
    expressMesh.name = 'ExpressElevatorBank';
    this.group.add(expressMesh);

    // 2. 低層區電梯組 (Floors 1 - 40)
    const lowBankGeo = new THREE.BoxGeometry(this.coreWidth * 0.35, 40 * floorH, this.coreDepth * 0.4);
    const lowBankMesh = new THREE.Mesh(lowBankGeo, this.elevatorMaterial);
    lowBankMesh.position.set(this.coreWidth * 0.25, (40 * floorH) / 2, -this.coreDepth * 0.22);
    lowBankMesh.name = 'LowRiseElevatorBank';
    this.group.add(lowBankMesh);

    // 3. 中層區電梯組 (Floors 44 - 74)
    const midHeight = (74 - 44) * floorH;
    const midBankGeo = new THREE.BoxGeometry(this.coreWidth * 0.35, midHeight, this.coreDepth * 0.4);
    const midBankMesh = new THREE.Mesh(midBankGeo, this.elevatorMaterial);
    midBankMesh.position.set(this.coreWidth * 0.25, 44 * floorH + midHeight / 2, 0);
    midBankMesh.name = 'MidRiseElevatorBank';
    this.group.add(midBankMesh);

    // 4. 高層區電梯組 (Floors 78 - 107)
    const highHeight = (107 - 78) * floorH;
    const highBankGeo = new THREE.BoxGeometry(this.coreWidth * 0.35, highHeight, this.coreDepth * 0.4);
    const highBankMesh = new THREE.Mesh(highBankGeo, this.elevatorMaterial);
    highBankMesh.position.set(this.coreWidth * 0.25, 78 * floorH + highHeight / 2, this.coreDepth * 0.22);
    highBankMesh.name = 'HighRiseElevatorBank';
    this.group.add(highBankMesh);
  }

  /**
   * 建立代表性無柱樓板桁架網格 (Open-Web Steel Floor Trusses)
   * 涵蓋空中大廳 (44, 78)、機械層 (7, 41, 75, 108) 與代表樓層 (共 11 層)
   */
  buildRepresentativeTrusses() {
    const totalFloors = 110;
    const floorH = this.towerHeight / totalFloors;

    const floorLevels = [1, 7, 24, 41, 44, 58, 75, 78, 92, 107, 110];

    const spanW = this.towerWidth - 1.2;
    const spanD = this.towerDepth - 1.2;

    floorLevels.forEach((fl) => {
      const y = fl * floorH;

      // 樓板外輪廓結構面
      const slabGeo = new THREE.PlaneGeometry(spanW, spanD, 12, 12);
      const slabMesh = new THREE.Mesh(slabGeo, this.trussMaterial);
      slabMesh.rotation.x = -Math.PI / 2;
      slabMesh.position.y = y;
      slabMesh.name = `FloorTrussLevel_${fl}`;
      this.group.add(slabMesh);
    });
  }

  /**
   * 建立 107-110 樓帽狀桁架系統 (Roof Hat Truss System)
   * 巨型鋼結構斜撐連繫中央核心筒至外圍牆柱，提供強大抗側傾剛度
   */
  buildHatTruss() {
    const trussBaseY = this.towerHeight - 12; // 403 米
    const trussTopY = this.towerHeight;       // 415 米
    const halfCoreW = this.coreWidth / 2;
    const halfCoreD = this.coreDepth / 2;
    const halfTowerW = (this.towerWidth - 2) / 2;
    const halfTowerD = (this.towerDepth - 2) / 2;

    // 斜撐樑幾何 (Box 沿傾角連接)
    const beamGeo = new THREE.BoxGeometry(0.7, 0.7, 1);

    const connections = [
      // X 方向對稱斜撐 (核心連至外壁)
      { from: [-halfCoreW, trussBaseY, 0], to: [-halfTowerW, trussTopY, 0] },
      { from: [halfCoreW, trussBaseY, 0], to: [halfTowerW, trussTopY, 0] },
      { from: [-halfCoreW, trussTopY, 0], to: [-halfTowerW, trussBaseY, 0] },
      { from: [halfCoreW, trussTopY, 0], to: [halfTowerW, trussBaseY, 0] },
      // Z 方向對稱斜撐
      { from: [0, trussBaseY, -halfCoreD], to: [0, trussTopY, -halfTowerD] },
      { from: [0, trussBaseY, halfCoreD], to: [0, trussTopY, halfTowerD] },
      { from: [0, trussTopY, -halfCoreD], to: [0, trussBaseY, -halfTowerD] },
      { from: [0, trussTopY, halfCoreD], to: [0, trussBaseY, halfTowerD] }
    ];

    connections.forEach((c, idx) => {
      const p1 = new THREE.Vector3(...c.from);
      const p2 = new THREE.Vector3(...c.to);
      const dist = p1.distanceTo(p2);

      const beam = new THREE.Mesh(beamGeo, this.hatTrussMaterial);
      beam.scale.set(1, 1, dist);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      beam.position.copy(mid);
      beam.lookAt(p2);
      beam.name = `HatTrussStrut_${idx}`;
      this.group.add(beam);
    });
  }

  /**
   * 切換 X-Ray 顯示狀態
   * @param {boolean} isXRay 
   */
  setXRayMode(isXRay) {
    this.group.visible = !!isXRay;
  }
}
