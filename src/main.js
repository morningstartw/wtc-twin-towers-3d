/**
 * WTC Twin Towers Three.js - Main Application Entrypoint
 * 紐約世界貿易中心雙塔 (1973 - 2001) 3D 紀念導覽
 */

import * as THREE from 'three';
import {
  createWindowTexture,
  createPlazaPavingTexture,
  createWaterBumpTexture
} from './utils/ProceduralTextures.js';
import { createTwinTowers } from './models/Towers.js';
import { createWTCComplex } from './models/WTCComplex.js';
import { createWorldFinancialCenter } from './models/WorldFinancialCenter.js';
import { createHudsonRiver } from './models/HudsonRiver.js';
import { createUrbanStreets } from './models/UrbanStreets.js';
import { createManhattanSkyline } from './models/ManhattanSkyline.js';
import { createPlaza } from './models/Plaza.js';
import { createAirplane } from './models/Airplane.js';
import { createEnvironment } from './scene/Environment.js';
import { createTributeInLight } from './models/TributeInLight.js';
import { setupPostProcessing } from './scene/PostProcessing.js';
import { createCameraManager } from './scene/CameraManager.js';
import { createHotspots } from './ui/Hotspots.js';
import { captureScreenshot } from './ui/Screenshot.js';
import { initUI } from './ui/UIController.js';

class WTCApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    
    // FPS Tracking
    this.fpsElement = document.getElementById('fps-counter');
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.firstFrameRendered = false;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initPostProcessing();
    this.initControls();
    this.initEnvironment();
    this.initProceduralTextures();
    this.initPlaza();
    this.initTwinTowers();
    this.initWTCComplex();
    this.initWorldFinancialCenter();
    this.initHudsonRiver();
    this.initUrbanStreets();
    this.initManhattanSkyline();
    this.initTributeInLight();
    this.initAirplane();
    this.initHotspots();
    this.initUIEvents();
    this.initResizeHandler();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /**
   * 初始化場景
   */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1128); // 深邃夜空藍底色
    this.scene.fog = new THREE.FogExp2(0x0a1128, 0.0004);
  }

  /**
   * 初始化相機 (設定適合雙塔 415 米尺度的透視投影相機)
   */
  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 6000);
    // 預設經典斜側仰視/俯瞰視角
    this.camera.position.set(380, 220, 480);
  }

  /**
   * 初始化 WebGL 渲染器
   */
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // 支援截圖導出
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 色調映射與色彩空間
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 陰影配置
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * 初始化後製處理管線 (Task 7: UnrealBloomPass & OutputPass)
   */
  initPostProcessing() {
    this.postProcessing = setupPostProcessing(this.renderer, this.scene, this.camera, {
      strength: 0.35, // 白天預設低輝光
      radius: 0.45,
      threshold: 0.70
    });
    window.wtcPostProcessing = this.postProcessing;
  }

  /**
   * 初始化相機控制器與漫遊管理器 (Task 7: CameraManager & Orbit/Fly)
   */
  initControls() {
    this.cameraManager = createCameraManager(this.camera, this.renderer.domElement);
    this.controls = this.cameraManager.controls;
    window.wtcCameraManager = this.cameraManager;
  }

  /**
   * 初始化環境光照、動態天幕與大氣系統 (Task 6: Environment & Weather System)
   */
  initEnvironment() {
    this.environment = createEnvironment(this.scene, this.renderer);
    this.sunLight = this.environment.lights.dirLight;
    this.ambientLight = this.environment.lights.ambientLight;
    this.hemiLight = this.environment.lights.hemiLight;
    window.wtcEnvironment = this.environment;
  }

  /**
   * 相容方法：相容原有 initLights 呼叫
   */
  initLights() {
    if (!this.environment) {
      this.initEnvironment();
    }
  }

  /**
   * 初始化雙塔紀念天際光柱 (Task 6: Tribute in Light Memorial Beams)
   */
  initTributeInLight() {
    this.tributeInLight = createTributeInLight({
      northPos: { x: -70, y: 415, z: -70 },
      southPos: { x: 70, y: 415, z: 70 },
      height: 1200,
      radiusBottom: 19,
      radiusTop: 28,
      visible: false
    });
    this.scene.add(this.tributeInLight.group);
    window.wtcTributeInLight = this.tributeInLight;
  }

  /**
   * 初始化程序化紋理生成器 (Task 2: Procedural Textures)
   */
  initProceduralTextures() {
    this.textures = {
      windowDay: createWindowTexture(false),
      windowNight: createWindowTexture(true),
      plazaPaving: createPlazaPavingTexture(),
      waterBump: createWaterBumpTexture()
    };

    // 掛載至 window 便於除錯與後續模組共用
    window.wtcTextures = this.textures;
  }

  /**
   * 初始化奧斯汀·J·托賓廣場、花崗岩基座、噴泉水池與克尼格天球 (Task 4: Plaza & The Sphere)
   */
  initPlaza() {
    this.plaza = createPlaza({
      plazaTexture: this.textures.plazaPaving,
      waterTexture: this.textures.waterBump
    });
    this.scene.add(this.plaza.group);
    this.fountainMesh = this.plaza.waterMesh;
    window.wtcPlaza = this.plaza;
  }

  /**
   * 初始化雙塔主體、密柱立面、尖頂天線與內部核心 (Task 3: Twin Towers Architecture)
   */
  initTwinTowers() {
    this.towers = createTwinTowers({
      windowTextureDay: this.textures.windowDay,
      windowTextureNight: this.textures.windowNight,
      northTowerPos: { x: -70, y: 0, z: -70 },
      southTowerPos: { x: 70, y: 0, z: 70 },
      isNight: false
    });

    this.scene.add(this.towers.group);
    window.wtcTowers = this.towers;
  }

  /**
   * 初始化世貿中心周邊附屬建築群 WTC 3, 4, 5, 6, 7 (Expansion Task 1)
   */
  initWTCComplex() {
    this.wtcComplex = createWTCComplex({
      isNight: false
    });
    this.scene.add(this.wtcComplex.group);
    window.wtcComplex = this.wtcComplex;
  }

  /**
   * 初始化世界金融中心四座大樓、冬季花園玻璃中庭與水岸步道 (Expansion Task 2)
   */
  initWorldFinancialCenter() {
    this.worldFinancialCenter = createWorldFinancialCenter({
      isNight: false
    });
    this.scene.add(this.worldFinancialCenter.group);
    window.worldFinancialCenter = this.worldFinancialCenter;
  }

  /**
   * 初始化哈德遜河水域與動態遊弋客運渡輪 (Expansion Task 3)
   */
  initHudsonRiver() {
    this.hudsonRiver = createHudsonRiver({
      isNight: false
    });
    this.scene.add(this.hudsonRiver.group);
    window.wtcHudsonRiver = this.hudsonRiver;
  }

  /**
   * 初始化西街（Route 9A）多線道主幹道、車流光軌與水岸綠蔭行道樹 (Expansion Task 4)
   */
  initUrbanStreets() {
    this.urbanStreets = createUrbanStreets({
      isNight: false
    });
    this.scene.add(this.urbanStreets.group);
    window.wtcUrbanStreets = this.urbanStreets;
  }

  /**
   * 初始化曼哈頓下城背景天際線群 (Expansion Task 5)
   */
  initManhattanSkyline() {
    this.manhattanSkyline = createManhattanSkyline({
      isNight: false
    });
    this.scene.add(this.manhattanSkyline.group);
    window.wtcManhattanSkyline = this.manhattanSkyline;
  }

  /**
   * 初始化遠景平穩巡航民航機 (Task 5: Scenic Background Airplane)
   */
  initAirplane() {
    this.airplane = createAirplane({
      radiusX: 520,
      radiusZ: 480,
      altitude: 320,
      speed: 0.045
    });
    this.scene.add(this.airplane.mesh);
    window.wtcAirplane = this.airplane;
  }

  /**
   * 初始化 3D 空間歷史標籤與互動卡片 (Task 8: 3D Hotspots & Architectural Landmarks)
   */
  initHotspots() {
    this.hotspots = createHotspots(
      this.scene,
      this.camera,
      document.getElementById('hotspot-markers-container'),
      (landmark) => {
        // 點擊地標時相機平滑平移對焦
        if (landmark.cameraPreset && this.cameraManager) {
          this.switchPresetView(landmark.cameraPreset);
        }
      }
    );
    window.wtcHotspots = this.hotspots;
  }

  /**
   * 透過 UIController 統一管理所有人機互動與介面事件 (Task 8: UIController)
   */
  initUIEvents() {
    this.uiController = initUI({
      onWeatherChange: (weather) => {
        const isNight = weather === 'night';

        // 動態氣候系統切換 (Task 6)
        if (this.environment) {
          this.environment.setWeather(weather);
        }

        // 後製泛光強度微調 (Task 7)
        if (this.postProcessing) {
          const bloomStrengthMap = {
            night: 0.9,
            sunset: 0.6,
            day: 0.35,
            rain: 0.45
          };
          const strength = bloomStrengthMap[weather] !== undefined ? bloomStrengthMap[weather] : 0.75;
          this.postProcessing.setBloomStrength(strength);
        }

        // 雙塔日夜燈光切換 (Task 3)
        if (this.towers) {
          this.towers.setNightMode(isNight);
        }

        // 世貿中心周邊附屬建築群日夜燈光切換 (Expansion Task 1)
        if (this.wtcComplex) {
          this.wtcComplex.setNightMode(isNight);
        }

        // 世界金融中心日夜燈光切換 (Expansion Task 2)
        if (this.worldFinancialCenter) {
          this.worldFinancialCenter.setNightMode(isNight);
        }

        // 哈德遜河水面與渡輪日夜切換 (Expansion Task 3)
        if (this.hudsonRiver && this.hudsonRiver.setNightMode) {
          this.hudsonRiver.setNightMode(isNight);
        }

        // 西街交通光軌與街燈日夜切換 (Expansion Task 4)
        if (this.urbanStreets && this.urbanStreets.setNightMode) {
          this.urbanStreets.setNightMode(isNight);
        }

        // 曼哈頓下城背景天際線群日夜切換 (Expansion Task 5)
        if (this.manhattanSkyline && this.manhattanSkyline.setNightMode) {
          this.manhattanSkyline.setNightMode(isNight);
        }

        // 紀念天際光柱：夜景模式預設點亮，其他模式關閉 (Task 6)
        if (this.tributeInLight) {
          this.tributeInLight.setVisible(isNight);
          if (this.uiController) {
            this.uiController.setTributeActive(isNight);
          }
        }
      },

      onViewChange: (view) => {
        this.switchPresetView(view);
      },

      onModeChange: (mode) => {
        if (this.cameraManager) {
          this.cameraManager.setMode(mode === 'orbit' ? 'orbit' : 'fly');
        }
      },

      onToggleXRay: (isActive) => {
        if (this.towers) {
          this.towers.setXRayMode(isActive);
        }
      },

      onToggleTribute: (isActive) => {
        if (this.tributeInLight) {
          this.tributeInLight.setVisible(isActive);
        }
      },

      onToggleHotspots: (isActive) => {
        if (this.hotspots) {
          this.hotspots.setVisible(isActive);
        }
      },

      onScreenshot: async () => {
        if (this.uiController) {
          this.uiController.showToast('正在準備 4K 寫真截圖...', 'info', 1200);
        }

        await captureScreenshot(this.renderer, this.scene, this.camera, {
          width: 3840,
          height: 2160,
          fileName: 'WTC_Twin_Towers_Screenshot.png',
          postProcessing: this.postProcessing,
          onSuccess: () => {
            if (this.uiController) {
              this.uiController.showToast('📸 4K 超高畫質寫真截圖已儲存！', 'success', 3500);
            }
          }
        });
      }
    });

    window.wtcUIController = this.uiController;
  }

  /**
   * 切換預設經典導覽視角 (Task 7: 平滑飛行過渡)
   * @param {'plaza'|'aerial'|'deck'|'antenna'} view
   */
  switchPresetView(view) {
    if (this.cameraManager) {
      this.cameraManager.flyTo(view, 1.5, () => {});

      // 同步 UI 狀態
      if (this.uiController) {
        this.uiController.setView(view);
      }
    }
  }

  /**
   * 初始載入畫面淡出與歡迎導覽 Toast
   */
  hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 700);
    }

    // 延遲跳出迎賓 Toast，引導使用者操作
    setTimeout(() => {
      if (this.uiController) {
        this.uiController.showToast(
          '歡迎造訪世界貿易中心 (1973–2001) 3D 紀念導覽！可按住滑鼠環顧，或按 W/A/S/D 漫遊',
          'info',
          4500
        );
      }
    }, 450);
  }

  /**
   * 監聽視窗縮放
   */
  initResizeHandler() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 同步更新後製處理管線解析度
      if (this.postProcessing) {
        this.postProcessing.resize(width, height);
      }
    });
  }

  /**
   * 主渲染循環
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // 更新相機控制器 (Task 7: 支援平滑飛行過渡與第一人稱漫遊運動)
    if (this.cameraManager) {
      this.cameraManager.update(delta);
    } else if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    // 動態更新噴泉水紋與克尼格天球 (Task 4: High-Performance GPU UV Scroll)
    if (this.plaza && this.plaza.update) {
      this.plaza.update(delta);
    }

    // 動態更新雙塔特色 (Task 3: 航空障礙燈脈衝閃爍)
    if (this.towers && this.towers.update) {
      this.towers.update(delta);
    }

    // 動態更新遠景民航機航行與航行燈 (Task 5: Scenic Background Airplane)
    if (this.airplane && this.airplane.update) {
      this.airplane.update(delta, this.clock.getElapsedTime());
    }

    // 動態更新世貿中心周邊附屬建築群航空警示燈 (Expansion Task 1)
    if (this.wtcComplex && this.wtcComplex.update) {
      this.wtcComplex.update(delta, this.clock.getElapsedTime());
    }

    // 動態更新世界金融中心航空警示燈 (Expansion Task 2)
    if (this.worldFinancialCenter && this.worldFinancialCenter.update) {
      this.worldFinancialCenter.update(delta, this.clock.getElapsedTime());
    }

    // 動態更新哈德遜河水面漣漪與巡航渡輪 (Expansion Task 3)
    if (this.hudsonRiver && this.hudsonRiver.update) {
      this.hudsonRiver.update(delta, this.clock.getElapsedTime());
    }

    // 動態更新西街雙向車流光軌高速流動循環 (Expansion Task 4)
    if (this.urbanStreets && this.urbanStreets.update) {
      this.urbanStreets.update(delta);
    }

    // 動態更新曼哈頓下城天際線高空航空警示燈 (Expansion Task 5)
    if (this.manhattanSkyline && this.manhattanSkyline.update) {
      this.manhattanSkyline.update(delta, this.clock.getElapsedTime());
    }

    // 動態更新大氣天幕、漂浮雲群、閃爍星空與雨絲粒子 (Task 6: Environment & Weather)
    if (this.environment && this.environment.update) {
      this.environment.update(delta);
    }

    // 動態更新紀念天際光柱呼吸律動與光塵微粒 (Task 6: Tribute in Light)
    if (this.tributeInLight && this.tributeInLight.update) {
      this.tributeInLight.update(this.clock.getElapsedTime());
    }

    // 動態更新 3D 空間歷史標籤螢幕投影 (Task 8: 3D Hotspots)
    if (this.hotspots && this.hotspots.update) {
      this.hotspots.update();
    }

    // 後製管線渲染 (Task 7: EffectComposer & UnrealBloomPass)
    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // 首幀繪製完成後平滑隱藏載入畫面並跳出迎賓導覽
    if (!this.firstFrameRendered) {
      this.firstFrameRendered = true;
      this.hideLoadingScreen();
    }

    // 更新 FPS 計數器
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.fpsElement) {
        this.fpsElement.textContent = `${fps} FPS`;
      }
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}

// 啟動應用
window.addEventListener('DOMContentLoaded', () => {
  window.wtcApp = new WTCApp();
});
