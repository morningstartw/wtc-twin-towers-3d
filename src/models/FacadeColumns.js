/**
 * FacadeColumns.js
 * 世界貿易中心 (WTC) 密柱立面與山崎實經典三叉戟拱門 (Yamasaki Tridents)
 *
 * 建築特色：
 * 1. 地面 1-6 樓 (高 23 米)：經典三叉戟拱門 (Gothic Arch Tridents)，每 3 根密柱在地面合而為一
 * 2. 7-110 樓 (高 392 米)：密集的垂直陽極氧化鋁合金立柱 (Perimeter Mullions)
 * 3. 採用 THREE.InstancedMesh 批量渲染，4 面外立柱全以單一 Draw Call 搞定，保證 60+ FPS 極致流暢度
 * 4. 金屬度 0.75，粗糙度 0.35，真實還原銀白色香檳鋁立面
 * 5. 支援 X-Ray 透視全息切換
 */

import * as THREE from 'three';

export class FacadeColumns {
  /**
   * @param {Object} options
   * @param {number} [options.width=63.14] - 塔身寬度 (米)
   * @param {number} [options.depth=63.14] - 塔身深度 (米)
   * @param {number} [options.height=415] - 塔身標高 (米)
   * @param {number} [options.columnsPerSide=59] - 單側立柱數 (WTC 原型為 59 根)
   */
  constructor(options = {}) {
    this.width = options.width || 63.14;
    this.depth = options.depth || 63.14;
    this.height = options.height || 415;
    this.columnsPerSide = options.columnsPerSide || 59;
    this.isXRay = false;

    // 經典分界點：地面三叉戟層高 23 米 (1-6 樓)
    this.tridentHeight = 23.0;
    this.mullionHeight = this.height - this.tridentHeight; // 392 米

    this.group = new THREE.Group();
    this.group.name = 'FacadeColumns';

    this.initMaterial();
    this.buildUpperMullions();
    this.buildYamasakiTridents();
    this.buildCornerBevelColumns();
  }

  /**
   * 初始化陽極氧化鋁合金材質 (Anodized Aluminum)
   */
  initMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      color: 0xdde3ea, // 淺銀香檳金屬色
      metalness: 0.75, // 高金屬度反射日光
      roughness: 0.35, // 絲光鋁拉絲粗糙度
      side: THREE.FrontSide
    });
  }

  /**
   * 建立 7-110 樓密集外立柱 (InstancedMesh 批次繪製)
   * 單塔 4 面共 59 * 4 = 236 根高達 392 米的鋁柱
   */
  buildUpperMullions() {
    const colWidth = 0.46; // 單根立柱面寬 (約 46-48cm)
    const colDepth = 0.44; // 單根立柱進深 (微突於外牆窗面)
    const colGeo = new THREE.BoxGeometry(colWidth, this.mullionHeight, colDepth);

    const totalInstances = this.columnsPerSide * 4;
    this.mullionsMesh = new THREE.InstancedMesh(colGeo, this.material, totalInstances);
    this.mullionsMesh.name = 'UpperMullionsInstanced';
    this.mullionsMesh.castShadow = true;
    this.mullionsMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const halfW = this.width / 2;
    const halfD = this.depth / 2;
    const centerY = this.tridentHeight + this.mullionHeight / 2; // y = 219m

    // 可分配立柱的寬度跨距 (扣除兩端轉角各約 1.8 米)
    const activeSpan = this.width - 3.6;
    const spacing = activeSpan / (this.columnsPerSide - 1);
    const startOffset = -activeSpan / 2;

    let idx = 0;

    // 4 個立面：
    // 面 0: 前面 (Z = +halfD)
    // 面 1: 後面 (Z = -halfD)
    // 面 2: 右面 (X = +halfW)
    // 面 3: 左面 (X = -halfW)
    const faces = [
      { normal: [0, 0, 1], rotY: 0, pos: (u) => [startOffset + u * spacing, centerY, halfD] },
      { normal: [0, 0, -1], rotY: Math.PI, pos: (u) => [startOffset + u * spacing, centerY, -halfD] },
      { normal: [1, 0, 0], rotY: Math.PI / 2, pos: (u) => [halfW, centerY, startOffset + u * spacing] },
      { normal: [-1, 0, 0], rotY: -Math.PI / 2, pos: (u) => [-halfW, centerY, startOffset + u * spacing] }
    ];

    faces.forEach((face) => {
      for (let i = 0; i < this.columnsPerSide; i++) {
        const [x, y, z] = face.pos(i);
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, face.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.mullionsMesh.setMatrixAt(idx++, dummy.matrix);
      }
    });

    this.mullionsMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.mullionsMesh);
  }

  /**
   * 建立地面層 1-6 樓山崎實三叉戟哥德式拱門 (Yamasaki Tridents)
   * 每 3 根密柱向下收束為 1 根粗壯的地面基柱，頂部形成尖拱
   */
  buildYamasakiTridents() {
    const tridentGeo = this.createTridentGeometry();
    const tridentsPerFace = 19; // 19 個三叉戟單元 * 3 = 57 根柱列，對應地面寬度
    const totalTridents = tridentsPerFace * 4;

    this.tridentsMesh = new THREE.InstancedMesh(tridentGeo, this.material, totalTridents);
    this.tridentsMesh.name = 'YamasakiTridentsInstanced';
    this.tridentsMesh.castShadow = true;
    this.tridentsMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const halfW = this.width / 2;
    const halfD = this.depth / 2;

    const activeSpan = this.width - 3.6;
    const spacing = activeSpan / (tridentsPerFace - 1);
    const startOffset = -activeSpan / 2;

    let idx = 0;

    const faces = [
      { rotY: 0, pos: (u) => [startOffset + u * spacing, 0, halfD] },
      { rotY: Math.PI, pos: (u) => [startOffset + u * spacing, 0, -halfD] },
      { rotY: Math.PI / 2, pos: (u) => [halfW, 0, startOffset + u * spacing] },
      { rotY: -Math.PI / 2, pos: (u) => [-halfW, 0, startOffset + u * spacing] }
    ];

    faces.forEach((face) => {
      for (let i = 0; i < tridentsPerFace; i++) {
        const [x, y, z] = face.pos(i);
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, face.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.tridentsMesh.setMatrixAt(idx++, dummy.matrix);
      }
    });

    this.tridentsMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.tridentsMesh);
  }

  /**
   * 程式化生成經典山崎實三叉戟 (Trident) 幾何體
   * 包含底部厚實基柱、分叉斜樑與雙尖拱開口
   */
  createTridentGeometry() {
    const prongSpan = 1.02; // 上方 3 根柱的中心間距
    const totalH = this.tridentHeight; // 23 米
    const baseH = 9.5; // 基柱高度
    const colW = 0.46; // 頂端立柱寬度
    const baseW = 0.95; // 底部基柱寬度

    const shape = new THREE.Shape();

    // 外輪廓 (從底部左下順時針繪製)
    shape.moveTo(-baseW / 2, 0);
    shape.lineTo(-baseW / 2, baseH);
    // 左外側斜向擴展至左側立柱
    shape.lineTo(-prongSpan - colW / 2, baseH + 3.5);
    shape.lineTo(-prongSpan - colW / 2, totalH);
    // 左立柱頂端
    shape.lineTo(-prongSpan + colW / 2, totalH);
    // 左拱側下切
    shape.lineTo(-prongSpan + colW / 2, totalH - 3.5);
    // 中央立柱頂端左側
    shape.lineTo(-colW / 2, totalH - 3.5);
    shape.lineTo(-colW / 2, totalH);
    // 中央立柱頂端右側
    shape.lineTo(colW / 2, totalH);
    // 右拱側下切
    shape.lineTo(colW / 2, totalH - 3.5);
    // 右立柱頂端左側
    shape.lineTo(prongSpan - colW / 2, totalH - 3.5);
    shape.lineTo(prongSpan - colW / 2, totalH);
    // 右立柱頂端右側
    shape.lineTo(prongSpan + colW / 2, totalH);
    // 右外側斜向下收束至基柱
    shape.lineTo(prongSpan + colW / 2, baseH + 3.5);
    shape.lineTo(baseW / 2, baseH);
    shape.lineTo(baseW / 2, 0);
    shape.closePath();

    // 建立左側哥德尖拱鏤空 (Hole 1)
    const leftHole = new THREE.Path();
    const lCenter = -prongSpan / 2;
    const archPeakY = totalH - 1.2;
    const archBaseY = baseH + 2.0;

    leftHole.moveTo(-prongSpan + colW / 2 + 0.05, archBaseY);
    leftHole.lineTo(-prongSpan + colW / 2 + 0.05, totalH - 4.5);
    // 尖拱左弧線上升至拱頂
    leftHole.quadraticCurveTo(-prongSpan + colW / 2 + 0.1, archPeakY, lCenter, archPeakY);
    // 尖拱右弧線下降
    leftHole.quadraticCurveTo(-colW / 2 - 0.1, archPeakY, -colW / 2 - 0.05, totalH - 4.5);
    leftHole.lineTo(-colW / 2 - 0.05, archBaseY);
    leftHole.quadraticCurveTo(lCenter, archBaseY - 0.8, -prongSpan + colW / 2 + 0.05, archBaseY);
    shape.holes.push(leftHole);

    // 建立右側哥德尖拱鏤空 (Hole 2)
    const rightHole = new THREE.Path();
    const rCenter = prongSpan / 2;

    rightHole.moveTo(colW / 2 + 0.05, archBaseY);
    rightHole.lineTo(colW / 2 + 0.05, totalH - 4.5);
    // 尖拱左弧線上升至拱頂
    rightHole.quadraticCurveTo(colW / 2 + 0.1, archPeakY, rCenter, archPeakY);
    // 尖拱右弧線下降
    rightHole.quadraticCurveTo(prongSpan - colW / 2 - 0.1, archPeakY, prongSpan - colW / 2 - 0.05, totalH - 4.5);
    rightHole.lineTo(prongSpan - colW / 2 - 0.05, archBaseY);
    rightHole.quadraticCurveTo(rCenter, archBaseY - 0.8, colW / 2 + 0.05, archBaseY);
    shape.holes.push(rightHole);

    // 擠出為立體實體金屬構件 (深度 0.48m，附帶立體倒角)
    const extrudeSettings = {
      steps: 1,
      depth: 0.48,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // 將幾何體中心沿 Z 軸微調居中
    geom.translate(0, 0, -0.24);
    return geom;
  }

  /**
   * 建立雙塔 4 個 45 度倒角轉角柱 (Beveled Corner Columns)
   * WTC 塔樓四角為優雅的 45 度切角，從地面貫穿至頂部
   */
  buildCornerBevelColumns() {
    const cornerGeo = new THREE.BoxGeometry(1.6, this.height, 0.46);
    const halfW = this.width / 2;
    const halfD = this.depth / 2;
    const centerY = this.height / 2;

    const corners = [
      { x: halfW - 0.4, z: halfD - 0.4, rotY: Math.PI / 4 },
      { x: -halfW + 0.4, z: halfD - 0.4, rotY: -Math.PI / 4 },
      { x: -halfW + 0.4, z: -halfD + 0.4, rotY: -Math.PI * 0.75 },
      { x: halfW - 0.4, z: -halfD + 0.4, rotY: Math.PI * 0.75 }
    ];

    corners.forEach((c) => {
      const cornerMesh = new THREE.Mesh(cornerGeo, this.material);
      cornerMesh.position.set(c.x, centerY, c.z);
      cornerMesh.rotation.y = c.rotY;
      cornerMesh.castShadow = true;
      cornerMesh.receiveShadow = true;
      this.group.add(cornerMesh);
    });
  }

  /**
   * 切換 X-Ray 模式
   * 外層立柱轉為極致通透的淡藍色晶瑩線條，使內部鋼骨筒清晰可辨
   * @param {boolean} isXRay 
   */
  setXRayMode(isXRay) {
    this.isXRay = !!isXRay;

    if (this.isXRay) {
      this.material.transparent = true;
      this.material.opacity = 0.12;
      this.material.color.setHex(0x38bdf8);
      this.material.depthWrite = false;
    } else {
      this.material.transparent = false;
      this.material.opacity = 1.0;
      this.material.color.setHex(0xdde3ea);
      this.material.depthWrite = true;
    }

    this.material.needsUpdate = true;
  }
}
