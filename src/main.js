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
import { createPlaza } from './models/Plaza.js';
import { createAirplane } from './models/Airplane.js';
import { createEnvironment } from './scene/Environment.js';
import { createTributeInLight } from './models/TributeInLight.js';
import { setupPostProcessing } from './scene/PostProcessing.js';
import { createCameraManager } from './scene/CameraManager.js';

class WTCApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    
    // FPS Tracking
    this.fpsElement = document.getElementById('fps-counter');
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initPostProcessing();
    this.initControls();
    this.initEnvironment();
    this.initProceduralTextures();
    this.initPlaza();
    this.initTwinTowers();
    this.initTributeInLight();
    this.initAirplane();
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
   * 綁定介面事件 (切換按鈕、開關、全螢幕)
   */
  initUIEvents() {
    // 隱藏/顯示 UI
    const toggleUiBtn = document.getElementById('btn-toggle-ui');
    const overlay = document.getElementById('ui-overlay');
    if (toggleUiBtn && overlay) {
      toggleUiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.toggle('ui-hidden');
      });
    }

    // 全螢幕切換
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // 天氣切換按鈕互斥高亮與日夜窗戶貼圖切換
    const weatherBtns = document.querySelectorAll('.weather-btn');
    weatherBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        weatherBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const weather = btn.dataset.weather;
        const isNight = weather === 'night';

        // 動態氣候系統切換 (Task 6)
        if (this.environment) {
          this.environment.setWeather(weather);
        }

        // 自動調整後製泛光強度 (Task 7)
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

        // 雙塔立面辦公室日夜燈光切換 (Task 3)
        if (this.towers) {
          this.towers.setNightMode(isNight);
        }

        // 紀念天際光柱：夜景模式預設點亮，其他模式關閉 (Task 6)
        const tributeSwitch = document.getElementById('btn-toggle-tribute');
        if (this.tributeInLight && tributeSwitch) {
          if (isNight) {
            tributeSwitch.classList.add('active');
            tributeSwitch.setAttribute('aria-checked', 'true');
            this.tributeInLight.setVisible(true);
          } else {
            tributeSwitch.classList.remove('active');
            tributeSwitch.setAttribute('aria-checked', 'false');
            this.tributeInLight.setVisible(false);
          }
        }
      });
    });

    // 經典導覽視角切換 (南塔觀景台 / 北塔天線 / 廣場 / 全景)
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        this.switchPresetView(view);
      });
    });

    // 相機模式按鈕互斥高亮與模式切換 (Task 7)
    const modeBtns = document.querySelectorAll('.mode-btn');
    const flyGuide = document.getElementById('first-person-guide');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        
        if (this.cameraManager) {
          this.cameraManager.setMode(mode === 'orbit' ? 'orbit' : 'fly');
        }

        if (flyGuide) {
          if (mode === 'fly' || mode === 'walk') {
            flyGuide.classList.remove('hidden');
          } else {
            flyGuide.classList.add('hidden');
          }
        }
      });
    });

    // 漫遊提示退出按鈕
    const exitFlyBtn = document.getElementById('btn-exit-fly');
    if (exitFlyBtn) {
      exitFlyBtn.addEventListener('click', () => {
        const orbitBtn = document.querySelector('.mode-btn[data-mode="orbit"]');
        if (orbitBtn) {
          orbitBtn.click();
        } else if (this.cameraManager) {
          this.cameraManager.setMode('orbit');
          if (flyGuide) flyGuide.classList.add('hidden');
        }
      });
    }

    // 切換開關 (X-Ray 與 紀念光柱)
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach((sw) => {
      sw.addEventListener('click', () => {
        const isActive = sw.classList.toggle('active');
        sw.setAttribute('aria-checked', isActive ? 'true' : 'false');

        if (sw.id === 'btn-toggle-xray' && this.towers) {
          this.towers.setXRayMode(isActive);
        } else if (sw.id === 'btn-toggle-tribute' && this.tributeInLight) {
          this.tributeInLight.setVisible(isActive);
        }
      });
    });

    // 4K 寫真截圖匯出按鈕
    const screenshotBtn = document.getElementById('btn-screenshot');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => {
        // 先確保畫面後製最新一幀
        if (this.postProcessing) {
          this.postProcessing.render();
        } else {
          this.renderer.render(this.scene, this.camera);
        }
        const dataUrl = this.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `WTC_Twin_Towers_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      });
    }

    // 熱點資訊關閉按鈕
    const closeHotspotBtn = document.getElementById('btn-close-hotspot');
    const hotspotModal = document.getElementById('hotspot-modal');
    if (closeHotspotBtn && hotspotModal) {
      closeHotspotBtn.addEventListener('click', () => {
        hotspotModal.classList.add('hidden');
      });
    }
  }

  /**
   * 切換預設經典導覽視角 (Task 7: 平滑飛行過渡)
   * @param {'plaza'|'aerial'|'deck'|'antenna'} view
   */
  switchPresetView(view) {
    if (this.cameraManager) {
      this.cameraManager.flyTo(view, 1.5, () => {
        // 飛行到達後的通知或回呼
      });

      // 同步 UI 模式按鈕狀態回軌道檢視
      const modeBtns = document.querySelectorAll('.mode-btn');
      const flyGuide = document.getElementById('first-person-guide');
      modeBtns.forEach((b) => {
        if (b.dataset.mode === 'orbit') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      if (flyGuide) {
        flyGuide.classList.add('hidden');
      }
    }
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

    // 動態更新大氣天幕、漂浮雲群、閃爍星空與雨絲粒子 (Task 6: Environment & Weather)
    if (this.environment && this.environment.update) {
      this.environment.update(delta);
    }

    // 動態更新紀念天際光柱呼吸律動與光塵微粒 (Task 6: Tribute in Light)
    if (this.tributeInLight && this.tributeInLight.update) {
      this.tributeInLight.update(this.clock.getElapsedTime());
    }

    // 後製管線渲染 (Task 7: EffectComposer & UnrealBloomPass)
    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
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
