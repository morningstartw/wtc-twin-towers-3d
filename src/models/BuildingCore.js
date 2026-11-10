/**
 * BuildingCore.js
 * 世界貿易中心 (WTC) 雙塔核心主體與機械層模型
 * 
 * 建築規格：
 * - 寬度 63.14m，深度 63.14m，標高 415m (110 層樓)
 * - 4 個山崎實經典機械設備層 (MEP Louver Bands)：
 *   - 7-8 樓 (下方機電層)
 *   - 41-42 樓 (中段轉換層 / 空中大廳下方機電層)
 *   - 75-76 樓 (高段轉換層 / 空中大廳下方機電層)
 *   - 108-109 樓 (頂部機電層)
 * - 地面 1-6 樓挑高內凹玻璃大廳
 * - 支援日夜貼圖切換與 X-Ray 半透明藍圖透視切換
 */

import * as THREE from 'three';

export class BuildingCore {
  /**
   * @param {Object} options
   * @param {number} [options.width=63.14] - 塔樓面寬 (米)
   * @param {number} [options.depth=63.14] - 塔樓進深 (米)
   * @param {number} [options.height=415] - 塔樓總標高 (米)
   * @param {THREE.Texture} [options.windowTextureDay] - 白天辦公室立面紋理
   * @param {THREE.Texture} [options.windowTextureNight] - 夜間點燈立面紋理
   * @param {boolean} [options.isNight=false] - 初始夜間狀態
   */
  constructor(options = {}) {
    this.width = options.width || 63.14;
    this.depth = options.depth || 63.14;
    this.height = options.height || 415;
    this.windowTextureDay = options.windowTextureDay || null;
    this.windowTextureNight = options.windowTextureNight || null;
    this.isNight = !!options.isNight;
    this.isXRay = false;

    this.group = new THREE.Group();
    this.group.name = 'BuildingCore';

    this.materials = {};
    this.mechanicalBands = [];

    this.initMaterials();
    this.buildShaft();
    this.buildMechanicalBands();
    this.buildGroundLobby();
    this.buildRoofPenthouse();
  }

  /**
   * 初始化核心各部位材質
   */
  initMaterials() {
    const curMap = this.isNight ? this.windowTextureNight : this.windowTextureDay;

    // 塔身 4 面窗戶材質
    this.materials.facade = new THREE.MeshStandardMaterial({
      map: curMap,
      roughness: 0.35,
      metalness: 0.65,
      emissiveMap: this.isNight ? this.windowTextureNight : null,
      emissive: this.isNight ? new THREE.Color(0xffffff) : new THREE.Color(0x000000),
      emissiveIntensity: this.isNight ? 0.95 : 0.0,
      side: THREE.FrontSide
    });

    // 屋頂柏油與礫石鋪面材質
    this.materials.roof = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      roughness: 0.85,
      metalness: 0.2
    });

    // 底部地基遮光材質
    this.materials.bottom = new THREE.MeshBasicMaterial({
      color: 0x0a0c10
    });

    // 機械設備層深色百葉窗帶材質 (Matte Dark Louvers)
    this.materials.louver = new THREE.MeshStandardMaterial({
      color: 0x15181f,
      roughness: 0.9,
      metalness: 0.4
    });

    // 地面大廳深色反射帷幕玻璃
    this.materials.lobbyGlass = new THREE.MeshStandardMaterial({
      color: 0x1a2936,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    // 大廳內部夜間溫暖迎賓照明
    this.materials.lobbyInterior = new THREE.MeshBasicMaterial({
      color: 0xffe2aa,
      transparent: true,
      opacity: this.isNight ? 0.65 : 0.25
    });

    // 屋頂設備機房外牆材質
    this.materials.penthouse = new THREE.MeshStandardMaterial({
      color: 0x2b303c,
      roughness: 0.75,
      metalness: 0.3
    });
  }

  /**
   * 建造主塔身立面盒體 (從 y=0 到 y=415)
   */
  buildShaft() {
    // 塔身稍微比立柱內縮 0.2m，使外層金屬立柱立體突出
    const coreWidth = this.width - 0.24;
    const coreDepth = this.depth - 0.24;

    const boxGeo = new THREE.BoxGeometry(coreWidth, this.height, coreDepth);

    // BoxGeometry 材質順序: +X, -X, +Y (roof), -Y (bottom), +Z, -Z
    const multiMaterials = [
      this.materials.facade,
      this.materials.facade,
      this.materials.roof,
      this.materials.bottom,
      this.materials.facade,
      this.materials.facade
    ];

    this.shaftMesh = new THREE.Mesh(boxGeo, multiMaterials);
    // 將中心點抬升至 height / 2，使塔底剛好貼齊地面 y = 0
    this.shaftMesh.position.y = this.height / 2;
    this.shaftMesh.castShadow = true;
    this.shaftMesh.receiveShadow = true;
    this.shaftMesh.name = 'TowerShaft';

    this.group.add(this.shaftMesh);
  }

  /**
   * 建造 4 個經典機械層 (Mechanical Floors: 7-8, 41-42, 75-76, 108-109)
   * 山崎實設計特色：雙層挑高的暗色百葉帶，外觀深邃無窗，內藏空調冷卻與供電變電系統
   */
  buildMechanicalBands() {
    const totalFloors = 110;
    const floorH = this.height / totalFloors; // 約 3.7727m

    // 各機械層樓層區間 (中心樓層)
    const mechFloors = [
      { start: 7, count: 2, name: 'Mech_Floors_7_8' },
      { start: 41, count: 2, name: 'Mech_Floors_41_42' },
      { start: 75, count: 2, name: 'Mech_Floors_75_76' },
      { start: 108, count: 2, name: 'Mech_Floors_108_109' }
    ];

    const bandWidth = this.width - 0.12;
    const bandDepth = this.depth - 0.12;

    mechFloors.forEach((m) => {
      const bandHeight = m.count * floorH;
      const centerY = (m.start + m.count / 2) * floorH;

      const bandGeo = new THREE.BoxGeometry(bandWidth, bandHeight, bandDepth);
      const bandMesh = new THREE.Mesh(bandGeo, this.materials.louver);
      bandMesh.position.y = centerY;
      bandMesh.name = m.name;
      bandMesh.castShadow = true;
      bandMesh.receiveShadow = true;

      this.mechanicalBands.push(bandMesh);
      this.group.add(bandMesh);
    });
  }

  /**
   * 建造地面層 1-6 樓挑高大廳與玻璃帷幕 (高約 22.6m)
   */
  buildGroundLobby() {
    const lobbyHeight = 22.6;
    const lobbyWidth = this.width - 1.8; // 稍微內凹退縮，留空間給三叉戟拱門
    const lobbyDepth = this.depth - 1.8;

    // 內凹大廳帷幕玻璃盒
    const lobbyGeo = new THREE.BoxGeometry(lobbyWidth, lobbyHeight, lobbyDepth);
    this.lobbyMesh = new THREE.Mesh(lobbyGeo, this.materials.lobbyGlass);
    this.lobbyMesh.position.y = lobbyHeight / 2;
    this.lobbyMesh.name = 'GroundLobbyGlass';
    this.group.add(this.lobbyMesh);

    // 大廳內部中央照明核心 (夜晚散發溫暖金光)
    const interiorGeo = new THREE.BoxGeometry(lobbyWidth * 0.75, lobbyHeight * 0.9, lobbyDepth * 0.75);
    this.lobbyInteriorMesh = new THREE.Mesh(interiorGeo, this.materials.lobbyInterior);
    this.lobbyInteriorMesh.position.y = lobbyHeight / 2;
    this.lobbyInteriorMesh.name = 'LobbyInteriorLight';
    this.group.add(this.lobbyInteriorMesh);
  }

  /**
   * 建造天台防護女兒牆與中央機房電梯機房 (Penthouse)
   */
  buildRoofPenthouse() {
    // 女兒牆 (Parapet)
    const parapetHeight = 1.8;
    const parapetThickness = 0.5;
    const parapetGeo = new THREE.BoxGeometry(this.width, parapetHeight, this.depth);
    // 挖空中間簡化成圍繞在四周的邊緣女兒牆
    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0x3a404d,
      roughness: 0.65,
      metalness: 0.4
    });
    this.parapetMesh = new THREE.Mesh(parapetGeo, parapetMat);
    this.parapetMesh.position.y = this.height + parapetHeight / 2;
    this.parapetMesh.name = 'RoofParapet';
    // 稍微放大一點點避免與頂面 z-fighting
    this.parapetMesh.scale.set(1.002, 1, 1.002);
    this.group.add(this.parapetMesh);

    // 屋頂中央機電與電梯升降機房 (約 26m x 36m x 4.2m)
    const phWidth = 26;
    const phDepth = 36;
    const phHeight = 4.2;
    const phGeo = new THREE.BoxGeometry(phWidth, phHeight, phDepth);
    this.penthouseMesh = new THREE.Mesh(phGeo, this.materials.penthouse);
    this.penthouseMesh.position.y = this.height + phHeight / 2;
    this.penthouseMesh.castShadow = true;
    this.penthouseMesh.receiveShadow = true;
    this.penthouseMesh.name = 'RoofPenthouse';
    this.group.add(this.penthouseMesh);
  }

  /**
   * 切換日夜模式
   * @param {boolean} isNight 
   */
  setNightMode(isNight) {
    this.isNight = !!isNight;
    const curMap = this.isNight ? this.windowTextureNight : this.windowTextureDay;

    if (!this.isXRay) {
      this.materials.facade.map = curMap;
      this.materials.facade.emissiveMap = this.isNight ? this.windowTextureNight : null;
      this.materials.facade.emissive.set(this.isNight ? 0xffffff : 0x000000);
      this.materials.facade.emissiveIntensity = this.isNight ? 0.95 : 0.0;
      this.materials.facade.needsUpdate = true;
    }

    if (this.lobbyInteriorMesh) {
      this.materials.lobbyInterior.opacity = this.isNight ? 0.65 : 0.25;
    }
  }

  /**
   * 切換 X-Ray 結構透視模式
   * 外牆變為科技藍半透明全息圖，使內部核心鋼骨筒完全透出
   * @param {boolean} isXRay 
   */
  setXRayMode(isXRay) {
    this.isXRay = !!isXRay;

    if (this.isXRay) {
      // 科技全息藍圖半透明效果
      this.materials.facade.transparent = true;
      this.materials.facade.opacity = 0.2;
      this.materials.facade.color.setHex(0x163e63);
      this.materials.facade.emissive.setHex(0x0c253d);
      this.materials.facade.emissiveIntensity = 0.6;
      this.materials.facade.roughness = 0.2;
      this.materials.facade.metalness = 0.1;
      this.materials.facade.depthWrite = false;

      this.mechanicalBands.forEach((b) => {
        b.material.transparent = true;
        b.material.opacity = 0.28;
        b.material.depthWrite = false;
      });

      if (this.lobbyMesh) {
        this.lobbyMesh.material.opacity = 0.15;
        this.lobbyMesh.material.depthWrite = false;
      }
      if (this.parapetMesh) {
        this.parapetMesh.material.transparent = true;
        this.parapetMesh.material.opacity = 0.25;
        this.parapetMesh.material.depthWrite = false;
      }
      if (this.penthouseMesh) {
        this.penthouseMesh.material.transparent = true;
        this.penthouseMesh.material.opacity = 0.25;
        this.penthouseMesh.material.depthWrite = false;
      }
    } else {
      // 恢復原本實心建築外殼
      const curMap = this.isNight ? this.windowTextureNight : this.windowTextureDay;
      this.materials.facade.transparent = false;
      this.materials.facade.opacity = 1.0;
      this.materials.facade.color.setHex(0xffffff);
      this.materials.facade.map = curMap;
      this.materials.facade.emissiveMap = this.isNight ? this.windowTextureNight : null;
      this.materials.facade.emissive.set(this.isNight ? 0xffffff : 0x000000);
      this.materials.facade.emissiveIntensity = this.isNight ? 0.95 : 0.0;
      this.materials.facade.roughness = 0.35;
      this.materials.facade.metalness = 0.65;
      this.materials.facade.depthWrite = true;

      this.mechanicalBands.forEach((b) => {
        b.material.transparent = false;
        b.material.opacity = 1.0;
        b.material.depthWrite = true;
      });

      if (this.lobbyMesh) {
        this.lobbyMesh.material.opacity = 0.88;
        this.lobbyMesh.material.depthWrite = true;
      }
      if (this.parapetMesh) {
        this.parapetMesh.material.transparent = false;
        this.parapetMesh.material.opacity = 1.0;
        this.parapetMesh.material.depthWrite = true;
      }
      if (this.penthouseMesh) {
        this.penthouseMesh.material.transparent = false;
        this.penthouseMesh.material.opacity = 1.0;
        this.penthouseMesh.material.depthWrite = true;
      }
    }

    this.materials.facade.needsUpdate = true;
  }
}
