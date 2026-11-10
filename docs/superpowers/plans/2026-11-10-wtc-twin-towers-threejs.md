# 世貿雙子星大樓 (WTC Twin Towers) Three.js 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 Vite + 原生 Three.js 純程式碼（Procedural 3D）動態建構 1973 年紐約世界貿易中心雙塔、奧斯汀廣場、背景巡航民航機，並具備四種動態氣候、第一人稱漫遊、結構 X-Ray 透視、紀念光柱、歷史導覽熱點與 4K 截圖導出功能。

**Architecture:** 模組化 ES 模組架構。使用 Three.js 的 `InstancedMesh` 實例化繪製數千根鋁合金垂直密柱與三叉戟拱門確保 60 FPS 效能；程式化動態生成夜間辦公室發光貼圖與大理石廣場紋理；搭配 `EffectComposer` 與 `UnrealBloomPass` 實現逼真夜景與發光特效；支援 OrbitControls 與 WASD 第一人稱雙模式控制器。

**Tech Stack:** Vite 5, Three.js r160+, CSS3 (Glassmorphism), Vanilla JavaScript (ES2022)

**Spec:** `docs/superpowers/specs/2026-11-10-wtc-twin-towers-threejs-design.md`

## Global Constraints

- 不依賴任何外部 `.gltf` / `.obj` 檔案，全部幾何與紋理皆由 Three.js 程式碼生成。
- 嚴格維持 60 FPS：立面垂直密柱必須使用 `InstancedMesh` 批次繪製，不得為每根柱子創建獨立 Mesh。
- 專案架構基於 Vite 現代前端工具鏈，具備零組態熱重載 (HMR) 與一鍵建置發布能力。
- 雙塔比例嚴格依據真實 1:1 縮放（1 單位 = 1 米）：主塔寬約 63m、高 415m，北塔天線高 110m。
- 背景民航機僅於遠景空域巡航滑翔，安全遠離大樓，無任何碰撞或物理互動。

## Review Focus

1. **立面密柱頂點數過高導致卡頓**：實作必須驗證 `InstancedMesh` 實例數量與矩陣更新頻率，單次更新後設定 `needsUpdate = false`。
2. **夜間辦公室發光紋理記憶體佔用**：使用 HTML5 Canvas 程式化生成 1024x1024 窗格貼圖，並啟用 RepeatWrapping，避免大貼圖耗損 GPU 記憶體。
3. **第一人稱與軌道相機切換衝突**：相機模式切換時必須徹底停用/啟用對應事件監聽器，防止滑鼠事件互相干擾或視角瞬間跳躍。
4. **4K 截圖黑屏或變形**：截圖時暫存原始解析度與 UI 顯示狀態，調高 RenderTarget 渲染後恢復原狀，確保匯出清晰透明 PNG。
5. **天氣切換時燈光與霧氣過渡生硬**：背景顏色、方向光強度、環境光與 FogExp2 密度必須有平滑過渡或清晰的狀態映射。

---

### Task 1: 專案初始化與基礎架構 (Scaffolding & Layout)

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/style.css`
- Create: `src/main.js`

**Interfaces:**
- Produces: 具備 Three.js 依賴、啟動指令、HTML 結構與 CSS 玻璃擬態 UI 骨架的 Vite 專案。

- [ ] **Step 1: 建立 `package.json` 與 `vite.config.js`**
  - 宣告 `three` 依賴及 `vite` 開發伺服器腳本。
- [ ] **Step 2: 建立 `index.html` 與 `src/style.css`**
  - 包含 `#canvas-container` 容器、左上方標題與數據徽章、右側功能控制面板（天氣切換、相機模式、X-Ray、光束、截圖按鈕）、底部歷史熱點資訊彈窗。
  - 套用現代深色磨砂玻璃（`backdrop-filter: blur(12px)`)、細緻陰影與發光按鈕樣式。
- [ ] **Step 3: 建立基本 Three.js 場景骨架 `src/main.js`**
  - 初始化 Scene, PerspectiveCamera, WebGLRenderer, OrbitControls，並加入自適應視窗 resize 監聽。
- [ ] **Step 4: 執行相容性與依賴安裝驗證**
  - 執行 `npm install` 並執行 `npm run build` 確認 Vite 建置無誤。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: scaffold project with Vite, Three.js, and modern glassmorphism UI layout`

---

### Task 2: 程式化紋理與材質生成器 (Procedural Textures)

**Files:**
- Create: `src/utils/ProceduralTextures.js`

**Interfaces:**
- Produces:
  - `createWindowTexture(isNight: boolean): THREE.CanvasTexture`
  - `createPlazaPavingTexture(): THREE.CanvasTexture`
  - `createWaterBumpTexture(): THREE.CanvasTexture`

- [ ] **Step 1: 撰寫窗戶立面貼圖生成器**
  - 使用 Canvas 2D 動態繪製細密的垂直格子窗網，白天為反射深色玻璃，夜間隨機穿插點亮 35% 暖黃與冷白辦公室燈光。
- [ ] **Step 2: 撰寫奧斯汀廣場大理石/花崗岩放射紋理貼圖**
  - 生成世貿廣場經典的放射狀鋪石花紋，支援 `THREE.RepeatWrapping`。
- [ ] **Step 3: 撰寫水池微波紋理**
  - 利用噪點算法生成噴泉水面的微幅凹凸紋理（Bump Map）。
- [ ] **Step 4: 驗證紋理產出**
  - 在 `src/main.js` 中臨時掛載至方塊驗證貼圖產生正確無報錯。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: implement procedural textures for windows, plaza paving, and fountain`

---

### Task 3: 雙塔主體、密柱立面與尖頂天線 (Twin Towers & Facades)

**Files:**
- Create: `src/models/BuildingCore.js`
- Create: `src/models/FacadeColumns.js`
- Create: `src/models/Towers.js`
- Create: `src/models/SteelCore.js`

**Interfaces:**
- Consumes: `ProceduralTextures.js`
- Produces:
  - `createTwinTowers(): { group: THREE.Group, northTower: THREE.Group, southTower: THREE.Group, facadeColumns: THREE.InstancedMesh, setNightMode: (night: boolean) => void, setXRayMode: (xray: boolean) => void }`

- [ ] **Step 1: 實作 `BuildingCore.js`**
  - 建立 1 WTC 與 2 WTC 雙塔基本主體（63.14m x 63.14m x 415m），配置四個機械層深色內凹環帶（7-8, 41-42, 75-76, 108-109 樓）。
- [ ] **Step 2: 實作 `FacadeColumns.js` (InstancedMesh)**
  - 依照真實世貿設計，在塔樓外層建立一圈密集排列的垂直鋁合金立柱，下層為三叉戟拱門過渡。
  - 單一塔樓每面約 59 根垂直密柱，四面合計約 236 根，雙塔總計約 472 根柱身組合，使用 `THREE.InstancedMesh` 高效渲染。
- [ ] **Step 3: 實作 `Towers.js` (頂部特色)**
  - 1 WTC（北塔）：頂部建立精美通訊天線，由塔基、同軸多層金屬圓環與 110 米高的天線尖端組成，頂端配置規律閃爍紅色航標燈。
  - 2 WTC（南塔）：頂部建立室外露天觀景台（Observation Deck）、二階金屬護欄與天台地面。
- [ ] **Step 4: 實作 `SteelCore.js` (X-Ray 內部結構)**
  - 建立雙塔內部核心鋼骨筒（Core Columns）、電梯井與代表性樓板支架網格。平常隱藏，X-Ray 模式下外牆半透明並高亮內部核心。
- [ ] **Step 5: 驗證雙塔外觀與幾何結構**
  - 啟動畫面確認雙塔比例協調、天線與觀景台清晰可辨、三叉戟與密柱光影分明。
- [ ] **Step 6: 提交版本**
  - Git commit: `feat: implement Twin Towers architecture with InstancedMesh facade, antenna, observation deck, and inner core`

---

### Task 4: 奧斯汀廣場、克尼格天球與周邊地景 (Plaza & The Sphere)

**Files:**
- Create: `src/models/Plaza.js`

**Interfaces:**
- Consumes: `createPlazaPavingTexture`, `createWaterBumpTexture`
- Produces: `createPlaza(): { group: THREE.Group, update: (delta: number) => void }`

- [ ] **Step 1: 實作奧斯汀廣場 (Austin J. Tobin Plaza)**
  - 寬廣的大理石拼花廣場基地、邊界台階、低矮花台與長椅裝飾。
- [ ] **Step 2: 實作噴泉水池與「The Sphere」天球雕塑**
  - 圓形水池結構，中央基座放置由數面圓球體與幾何環組成的青銅金色「The Sphere」雕塑，重現弗里茨·克尼格（Fritz Koenig）的原作神韻。
- [ ] **Step 3: 實作水面動態更新**
  - 在 `update(delta)` 中循環位移水面法線貼圖，形成微動態波紋。
- [ ] **Step 4: 驗證廣場整合**
  - 確認雙塔穩固坐落於廣場兩側，天球雕塑位於雙塔中間核心位置。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: create Austin J. Tobin Plaza with circular fountain pool and The Sphere bronze sculpture`

---

### Task 5: 遠景平穩巡航民航機 (Scenic Background Airplane)

**Files:**
- Create: `src/models/Airplane.js`

**Interfaces:**
- Produces: `createAirplane(): { mesh: THREE.Group, update: (delta: number, time: number) => void }`

- [ ] **Step 1: 幾何建構 3D 民航機**
  - 使用純 Three.js 幾何組合：流線型圓柱機身、後掠主機翼、垂直尾翼與水平尾翼、兩具懸掛式渦扇噴射引擎。
  - 機體塗裝為經典白色機身與金屬銀色機翼，並帶有醒目的天藍色飾條。
- [ ] **Step 2: 加入機翼航行閃爍信號燈**
  - 左翼尖端配備紅色信號燈，右翼尖端配備綠色信號燈，機腹配備白色頻閃燈，以 1Hz 週期動態發光閃爍。
- [ ] **Step 3: 實現遠景平穩巡航飛行路徑**
  - 在雙塔外圍遠景高空（半徑約 450m、高度約 320m）設定平滑的巡航弧線飛行軌道。
  - 飛行時自動計算飛行切線方向並平滑轉向（LookAt），保持完全安全的巡航距離，不與大樓產生任何物理交互。
- [ ] **Step 4: 驗證飛行動態**
  - 觀察飛機在藍天與夜色中平穩劃過天際，航燈閃爍自然流暢。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: add procedural 3D background scenic airplane with blinking navigation lights and smooth cruising flightpath`

---

### Task 6: 環境、動態氣候與紀念光柱 (Environment, Weather & Memorial Beams)

**Files:**
- Create: `src/scene/Environment.js`
- Create: `src/models/TributeInLight.js`

**Interfaces:**
- Produces:
  - `createEnvironment(scene: THREE.Scene): { setWeather: (mode: 'day'|'sunset'|'night'|'rain') => void, update: (delta: number) => void }`
  - `createTributeInLight(): { group: THREE.Group, setVisible: (visible: boolean) => void, update: (time: number) => void }`

- [ ] **Step 1: 實作天空天幕與四大氣候模式**
  - **Day**：天空淡藍、陽光定向照射（DirectionalLight 帶陰影）、柔和環境光。
  - **Sunset**：橙紅黃昏漸變天幕、低角度暖金光線、大樓金屬拉長陰影。
  - **Night**：深藍星空、冷色月光、大樓窗戶亮起、夜景模式啟用。
  - **Rain / Fog**：大氣指數霧（FogExp2）、天空陰灰、開啟雨粒子系統。
- [ ] **Step 2: 實作動態雨絲粒子系統 (Rain Particle System)**
  - 建立 4,000 顆雨滴粒子，沿 Y 軸垂直下落並在觸地後循環重置。
- [ ] **Step 3: 實作夜間紀念光柱「Tribute in Light」**
  - 在雙塔屋頂設置兩道向天際投射的半透明淡藍白色漸變光錐（CylinderGeometry，AdditiveBlending），附帶呼吸式微動態光暈。
- [ ] **Step 4: 驗證氣候與光柱切換**
  - 測試從白天、黃昏、夜晚到下雨的平滑色彩轉換，以及夜間點亮紀念光柱時的視覺效果。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: implement dynamic 4-state weather system, rain particles, and Tribute in Light memorial beams`

---

### Task 7: 相機控制、後製泛光與視角導覽 (Camera & Post-Processing)

**Files:**
- Create: `src/scene/PostProcessing.js`
- Create: `src/scene/CameraManager.js`

**Interfaces:**
- Produces:
  - `setupPostProcessing(renderer, scene, camera): { composer: EffectComposer, setBloomStrength: (val: number) => void }`
  - `createCameraManager(camera, domElement): { setMode: (mode: 'orbit'|'walk') => void, flyTo: (presetName: string) => void, update: (delta: number) => void }`

- [ ] **Step 1: 實作後製泛光處理管線 (`PostProcessing.js`)**
  - 配置 `EffectComposer` + `RenderPass` + `UnrealBloomPass` + `OutputPass`。
  - 針對夜景、航標紅燈、辦公室燈光與 Tribute in Light 產生自然的輝光光暈。
- [ ] **Step 2: 實作軌道控制與經典視角平滑過渡 (`CameraManager.js`)**
  - 整合 `OrbitControls`。
  - 實作平滑移動算法，支援以下經典預設點位：
    - `Plaza (仰望)`: 廣場天球旁仰視雙塔。
    - `Aerial (鳥瞰)`: 曼哈頓下城高空鳥瞰。
    - `Deck (觀景台)`: 南塔頂樓室外觀景台邊緣。
    - `Antenna (天線)`: 北塔尖頂天線特寫。
- [ ] **Step 3: 實作第一人稱漫遊 / 無人機飛行控制**
  - 支援鍵盤 W/A/S/D 前後左右移動，Space 爬升，Shift 加速，滑鼠游標鎖定轉向。限制高度於地面以上。
- [ ] **Step 4: 驗證視角過渡與漫遊操作**
  - 確保切換無卡頓、視角轉換平滑自然。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: add UnrealBloom post-processing, smooth camera presets, and first-person fly/walk controls`

---

### Task 8: 歷史熱點、4K 截圖與 UI 整合 (UI, Hotspots & Screenshot)

**Files:**
- Create: `src/ui/Hotspots.js`
- Create: `src/ui/Screenshot.js`
- Create: `src/ui/UIController.js`

**Interfaces:**
- Produces:
  - `createHotspots(scene, camera): { update: () => void, setVisible: (visible: boolean) => void }`
  - `captureScreenshot(renderer, scene, camera): void`
  - `initUI(options): void`

- [ ] **Step 1: 實作 3D 歷史熱點標籤 (`Hotspots.js`)**
  - 在 3D 空間中錨定四個重點標籤（北塔通訊天線、南塔觀景台、三叉戟立面、中央天球雕塑）。
  - 將 3D 世界座標實時投影為螢幕 2D 懸浮標籤，點擊展開典雅介紹卡片（包含落成年代 1973、建築師山崎實、高度 417m/415m、工程亮點等）。
- [ ] **Step 2: 實作高解析度 4K 截圖器 (`Screenshot.js`)**
  - 點擊按鈕時暫時隱藏 DOM UI 浮層，將 WebGL 畫布渲染至高畫質圖像，並自動觸發 `WTC_Twin_Towers_Screenshot.png` 檔案下載。
- [ ] **Step 3: 實作介面聯動控制器 (`UIController.js`)**
  - 綁定天氣切換按鈕（晴天/黃昏/夜間/雨天）。
  - 綁定相機預設視角按鈕與漫遊模式切換開關。
  - 綁定 X-Ray 透視開關、Tribute in Light 光束開關、熱點顯示開關與截圖按鈕。
- [ ] **Step 4: 驗證 UI 操作與響應**
  - 測試全部按鈕與彈窗交互，確保無任何控制死角。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: integrate interactive 3D history hotspots, UI controller, and high-res screenshot capture`

---

### Task 9: 全系統整合、效能調校與最終驗證 (System Integration & Verification)

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

- [ ] **Step 1: 在 `main.js` 中組裝所有模組**
  - 串聯場景、建築雙塔、廣場、遠景飛機、環境天氣、後製處理、相機管理器、熱點與 UI。
- [ ] **Step 2: 效能與 FPS 監控驗證**
  - 加入簡易 FPS 統計計數器，確認各場景模式（含雨霧粒子與夜間 Bloom）均穩定維持在 60 FPS。
- [ ] **Step 3: 執行完整建置測試**
  - 執行 `npm run build` 確認生產環境打包零錯誤。
- [ ] **Step 4: 啟動本地伺服器並進行端到端視覺檢查**
  - 啟動開發伺服器進行完整功能檢查清單驗證。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: complete WTC Twin Towers 3D interactive application with verified performance`
