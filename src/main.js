/**
 * WTC Twin Towers Three.js - Main Application Entrypoint
 * 紐約世界貿易中心雙塔 (1973 - 2001) 3D 紀念導覽
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    this.initControls();
    this.initLights();
    this.initPlaceholderGround();
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
   * 初始化軌道相機控制器
   */
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 160, 0); // 瞄準雙塔中部高度
    this.controls.maxPolarAngle = Math.PI / 2 + 0.03; // 防止沉入地下過深
    this.controls.minDistance = 20;
    this.controls.maxDistance = 3500;
  }

  /**
   * 初始化環境光與主日光
   */
  initLights() {
    // 基礎環境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    // 主方向光 (模擬陽光/天光並投射大面積柔和陰影)
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.sunLight.position.set(300, 650, 400);
    this.sunLight.castShadow = true;

    // 陰影相機視野涵蓋雙塔與整座廣場
    const d = 400;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1200;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    // 輔助天光 (半球光模擬天空反射)
    this.hemiLight = new THREE.HemisphereLight(0x7ec0ee, 0x1a2634, 0.6);
    this.hemiLight.position.set(0, 500, 0);
    this.scene.add(this.hemiLight);
  }

  /**
   * 建立基礎地面網格與參考定位，供 Task 1 驗證
   */
  initPlaceholderGround() {
    // 曼哈頓街區參考地面
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 經典網格輔助 (細密參考刻度)
    const grid = new THREE.GridHelper(1000, 50, 0x38bdf8, 0x1f293d);
    grid.position.y = 0.2;
    this.scene.add(grid);

    // 座標輔助 (調小不干擾視覺)
    const axes = new THREE.AxesHelper(50);
    axes.position.y = 0.5;
    this.scene.add(axes);
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

    // 天氣切換按鈕互斥高亮
    const weatherBtns = document.querySelectorAll('.weather-btn');
    weatherBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        weatherBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 相機模式按鈕互斥高亮
    const modeBtns = document.querySelectorAll('.mode-btn');
    const flyGuide = document.getElementById('first-person-guide');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (flyGuide) {
          if (mode === 'fly') {
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
        if (orbitBtn) orbitBtn.click();
      });
    }

    // 切換開關 (X-Ray 與 紀念光柱)
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach((sw) => {
      sw.addEventListener('click', () => {
        const isActive = sw.classList.toggle('active');
        sw.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    });

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
    });
  }

  /**
   * 主渲染循環
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // 更新軌道控制器
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    // 渲染場景
    this.renderer.render(this.scene, this.camera);

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
