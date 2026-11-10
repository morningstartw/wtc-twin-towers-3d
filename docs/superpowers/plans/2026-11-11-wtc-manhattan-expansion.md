# Lower Manhattan & Hudson River Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the WTC Twin Towers Three.js application into a comprehensive historic Lower Manhattan experience featuring WTC 3~7, World Financial Center, Hudson River with cruising ferry, West Street traffic light trails, Battery Park City landscaping, and new navigation presets.

**Architecture:** Build modular, procedural Three.js components adhering to 1:1 metric scale, utilizing `THREE.InstancedMesh` for trees, street furniture, background skyscrapers, and traffic light streaks. Maintain dynamic synchronization with the existing 4-state weather system and night-mode lighting without external 3D asset dependencies.

**Tech Stack:** Three.js (r160+), Vite 5 (@rollup/wasm-node), WebGL, ShaderMaterial / CanvasTexture, HTML5/CSS3 glassmorphism UI.

**Spec:** [docs/superpowers/specs/2026-11-10-wtc-twin-towers-threejs-design.md](file:///c:/twin%20towll/docs/superpowers/specs/2026-11-10-wtc-twin-towers-threejs-design.md) (Expanded with Lower Manhattan urban context).

## Global Constraints

- Pure procedural Three.js without external `.gltf`/`.obj` or image downloads.
- Strict 60 FPS performance: batch high-volume objects (trees, light streaks, building blocks) via `THREE.InstancedMesh`.
- 1:1 real-world metric scale (1 unit = 1 meter).
- Clean Vite production builds with 0 errors (`cmd /c npm run build`).
- Synchronize all new elements with Day, Sunset, Night, and Rain weather modes.

## Review Focus

1. **Traffic Light Trails Performance:** Verify that streaming vehicle headlight and taillight streaks on West Street are rendered via `InstancedMesh` without per-frame CPU allocation, preserving 60 FPS.
2. **Hudson River Water Flow & Reflection:** Ensure the river's dynamic water shader/bump texture handles day reflections and night shimmer without depth fighting with the seawall.
3. **Day/Night Synchronization:** Verify that WTC 3~7, WFC, background skyscrapers, traffic trails, and ferry lights respond seamlessly to weather changes and night lighting toggles.
4. **Camera Preset & Boundary Clamping:** Verify that new viewpoints (`hudson`, `westst`, `wintergarden`) transition smoothly and maintain floor height clamping (`y >= 1.8m`) in walk/fly mode.
5. **Memory & Draw Call Footprint:** Ensure all models properly dispose geometries and materials on teardown and keep total draw calls strictly optimized.

---

### Task 1: 世貿中心周邊附屬建築群 (WTC 3, 4, 5, 6, 7)

**Files:**
- Create: `src/models/WTCComplex.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `createWTCComplex(options): { group: THREE.Group, setNightMode: (isNight: boolean) => void }`

- [ ] **Step 1: 實作 WTC 3 萬豪酒店 (Vista / Marriott WTC)**
  - 22 層階梯狀鋼骨玻璃結構，坐落於南北雙塔之間西側西街邊界，具備金屬窗條與低層挑高大門。
- [ ] **Step 2: 實作 WTC 4、5、6 低層辦公大樓**
  - WTC 4（9 層，東南方）、WTC 5（9 層，東北方）、WTC 6（8 層，西北方美國海關大樓）。
  - 深色方正量體、金屬百葉立面與內凹拱廊，圍塑出奧斯汀·J·托賓廣場的完整邊界。
- [ ] **Step 3: 實作 WTC 7 梯形紅花崗岩大樓**
  - 47 層高樓，坐落於維西街（Vesey St）北側，特色為梯形柱面輪廓、暖紅花崗岩外立面與高架人行空橋天橋。
- [ ] **Step 4: 支援日夜貼圖與窗戶燈光切換**
  - 夜間自動點亮暖黃與日光辦公室隨機窗戶照明。
- [ ] **Step 5: 驗證建置與提交**
  - 執行 `cmd /c npm run build` 通過。
  - Git commit: `feat: add WTC 3, 4, 5, 6, and 7 buildings to complete the historic World Trade Center complex`

---

### Task 2: 世界金融中心與冬季花園 (World Financial Center & Winter Garden)

**Files:**
- Create: `src/models/WorldFinancialCenter.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `createWorldFinancialCenter(options): { group: THREE.Group, setNightMode: (isNight: boolean) => void }`

- [ ] **Step 1: 實作西薩·佩里經典四座地標塔**
  - 1 WFC（40 層，梯形頂 / 階梯金字塔銅綠屋頂）。
  - 2 WFC（44 層，圓頂 Dome 綠色銅質屋頂）。
  - 3 WFC（51 層，實心尖頂金字塔銅綠屋頂，最高座）。
  - 4 WFC（34 層，階梯式平頂切角屋頂）。
- [ ] **Step 2: 實作冬季花園（Winter Garden Atrium）**
  - 位於 2 WFC 與 3 WFC 之間，通透的大跨度半圓形拱頂玻璃天幕大廳，內含微發光棕櫚樹景觀。
- [ ] **Step 3: 實作砲台公園城水岸步道與海堤石欄**
  - 連接世界金融中心西側的沿河步道平台（Esplanade），設有水岸石材圍欄。
- [ ] **Step 4: 驗證建置與提交**
  - 執行 `cmd /c npm run build` 通過。
  - Git commit: `feat: add World Financial Center post-modern towers and glass Winter Garden atrium`

---

### Task 3: 哈德遜河水域與動態遊弋渡輪 (Hudson River & Cruising Ferry)

**Files:**
- Create: `src/models/HudsonRiver.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `createHudsonRiver(options): { group: THREE.Group, update: (delta: number, time: number) => void }`

- [ ] **Step 1: 實作哈德遜河大範圍水面**
  - 位於西側（x = -200m 至 -1200m，z = -800m 至 +800m）的深藍水域平面。
  - 採用雙重 UV 滾動法線/Bump 圖，模擬河面自然水流漣漪，並支援日光鏡面高光反射與月夜倒影。
- [ ] **Step 2: 實作程序化 3D 紐約港渡輪模型 (NY Harbor Ferry)**
  - 經典雙層客運渡輪，白藍雙色塗裝、船首船尾舷窗、駕駛台與兩側煙囪。
  - 配置航行燈（左紅右綠）與艙內暖光。
- [ ] **Step 3: 實作平滑航行巡遊路徑**
  - 在哈德遜河道上沿南北向平緩往返航行，伴隨水波微微搖晃（Pitch & Roll 微動態）。
- [ ] **Step 4: 驗證建置與提交**
  - 執行 `cmd /c npm run build` 通過。
  - Git commit: `feat: implement Hudson River reflective water surface and dynamic cruising harbor ferry`

---

### Task 4: 西街交通光軌與水岸都市綠化 (West Street Traffic Trails & Landscaping)

**Files:**
- Create: `src/models/UrbanStreets.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `createUrbanStreets(options): { group: THREE.Group, update: (delta: number) => void, setNightMode: (isNight: boolean) => void }`

- [ ] **Step 1: 實作西街（Route 9A）多線道主幹道與地面鋪裝**
  - 8 線道柏油幹道、中央分隔島、斑馬線路口與西街高架人行空橋橋墩。
- [ ] **Step 2: 實作 InstancedMesh 長曝光車流光軌 (Light Trails)**
  - 南向車道：以 InstancedMesh 批次渲染白金/黃光車頭燈流動長條。
  - 北向車道：以 InstancedMesh 批次渲染亮紅尾燈流動長條。
  - 車速在一定範圍內交錯流動，抵達端點平滑循環，夜間與黃昏模式增強輝光，日間降低透明度。
- [ ] **Step 3: 實作砲台公園城水岸行道樹與街燈**
  - 使用 `THREE.InstancedMesh` 批次種植約 180 棵常青綠樹與楓樹，沿西街與水岸步道整齊排列。
  - 沿街佈設黑金屬美式古典街燈。
- [ ] **Step 4: 驗證建置與提交**
  - 執行 `cmd /c npm run build` 通過。
  - Git commit: `feat: add West Street dual-direction traffic light trails and Battery Park City tree esplanade`

---

### Task 5: 曼哈頓下城背景天際線群 (Lower Manhattan Background Skyline)

**Files:**
- Create: `src/models/ManhattanSkyline.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `createManhattanSkyline(options): { group: THREE.Group, setNightMode: (isNight: boolean) => void }`

- [ ] **Step 1: 建立東側與南側金融街區程序化摩天樓群**
  - 華爾街方向包括伍爾沃斯大樓（Woolworth Building）尖頂風格建築、裝飾藝術（Art Deco）階梯狀大廈、現代鋼骨玻璃辦公樓群。
  - 採用低多邊形組合幾何（約 60~80 座不同高度比例之建築），單一材質批次合併渲染。
- [ ] **Step 2: 夜間立面與航空避雷紅燈**
  - 樓頂配置規律微閃紅光避雷標誌燈，夜間窗格透出微弱生活與辦公燈火。
- [ ] **Step 3: 驗證建置與提交**
  - 執行 `cmd /c npm run build` 通過。
  - Git commit: `feat: create Lower Manhattan surrounding skyscraper skyline and Financial District cityscape`

---

### Task 6: 導覽視角擴充、歷史熱點與 UI 升級 (Camera Presets, Hotspots & Final Integration)

**Files:**
- Modify: `src/scene/CameraManager.js`
- Modify: `src/ui/Hotspots.js`
- Modify: `src/ui/UIController.js`
- Modify: `index.html`
- Modify: `src/style.css`
- Modify: `src/main.js`

- [ ] **Step 1: 擴充三大經典導覽新視角 (`CameraManager.js`)**
  - `hudson`: 哈德遜河面遠眺曼哈頓天際線與雙塔夕陽全景。
  - `westst`: 西街地面人行道仰望雙塔與萬豪酒店仰視震撼角。
  - `wintergarden`: 世界金融中心冬季花園玻璃拱門前眺望托賓廣場。
- [ ] **Step 2: 擴增 3D 空間歷史標籤 (`Hotspots.js`)**
  - 世界金融中心（WFC）、WTC 3 萬豪酒店、WTC 7、哈德遜河濱水碼頭，附帶豐富歷史解說卡片。
- [ ] **Step 3: UI 面板與快捷鍵連動 (`UIController.js` & `index.html`)**
  - 在視角工具列新增新視角按鈕與快捷圖示。
  - 確保 Esc、漫遊切換、4K 截圖、天氣變更全數相容。
- [ ] **Step 4: 完整 60 FPS 效能驗證與生產打包檢驗**
  - 執行 `cmd /c npm run build` 確認打包零報錯。
- [ ] **Step 5: 提交版本**
  - Git commit: `feat: integrate expanded Lower Manhattan camera viewpoints, history hotspots, and full urban scenery`
