/**
 * WTC Twin Towers Three.js - Camera Manager
 * 整合式相機控制器：包含 OrbitControls 軌道檢視、經典視角平滑過渡動畫、以及第一人稱自由漫遊/無人機飛行模式
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 預設經典導覽視角設定
export const CAMERA_PRESETS = {
  plaza: {
    pos: new THREE.Vector3(0, 3.2, 35),
    target: new THREE.Vector3(-10, 160, -10),
    title: '奧斯汀廣場中央仰望'
  },
  aerial: {
    pos: new THREE.Vector3(420, 320, 480),
    target: new THREE.Vector3(0, 180, 0),
    title: '曼哈頓高空俯瞰全景'
  },
  deck: {
    pos: new THREE.Vector3(65, 417, 35),
    target: new THREE.Vector3(0, 415, 0),
    title: '南塔 110 樓室外觀景台'
  },
  antenna: {
    pos: new THREE.Vector3(-42, 495, -42),
    target: new THREE.Vector3(-45, 470, -45),
    title: '北塔 526m 避雷針天線'
  }
};

/**
 * 建立相機管理器
 * @param {THREE.PerspectiveCamera} camera 
 * @param {HTMLElement} domElement 
 * @param {Object} [options] 
 */
export function createCameraManager(camera, domElement, options = {}) {
  let mode = options.defaultMode || 'orbit'; // 'orbit' | 'fly' | 'walk'
  
  // 1. 初始化 OrbitControls
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 160, 0);
  controls.maxPolarAngle = Math.PI / 2 + 0.03;
  controls.minDistance = 15;
  controls.maxDistance = 3500;

  // 2. 視角平滑過渡動畫狀態
  let isTransitioning = false;
  let transitionElapsed = 0;
  let transitionDuration = 1.5;
  const startPosition = new THREE.Vector3();
  const startTarget = new THREE.Vector3();
  const endPosition = new THREE.Vector3();
  const endTarget = new THREE.Vector3();
  let onTransitionComplete = null;

  // 3. 第一人稱漫遊/飛行狀態
  const keysDown = {};
  let isMouseDown = false;
  let previousMouseX = 0;
  let previousMouseY = 0;
  let yaw = 0;
  let pitch = 0;

  const moveSpeed = options.moveSpeed || 45.0; // 基礎移動速度 (m/s)
  const boostMultiplier = options.boostMultiplier || 2.5; // Shift 衝刺倍率
  const minGroundHeight = options.minHeight !== undefined ? options.minHeight : 1.8; // 最低地面高度限制
  const mouseSensitivity = options.mouseSensitivity || 0.0022;

  // 輔助運算向量
  const forwardVec = new THREE.Vector3();
  const horizontalForward = new THREE.Vector3();
  const rightVec = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);
  const moveDirection = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  /**
   * 從相機目前朝向同步 yaw 與 pitch
   */
  function syncAnglesFromCamera() {
    camera.getWorldDirection(forwardVec);
    // forwardVec: (x, y, z)
    yaw = Math.atan2(-forwardVec.x, -forwardVec.z);
    pitch = Math.asin(Math.max(-0.999, Math.min(0.999, forwardVec.y)));
  }

  // 初始化朝向
  syncAnglesFromCamera();

  // 監聽鍵盤事件
  function onKeyDown(e) {
    if (mode === 'orbit') return;
    keysDown[e.code] = true;

    // 防止漫遊時按空白鍵或方向鍵造成網頁滾動
    if (['Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyC'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  // 監聽滑鼠拖曳視角旋轉
  function onMouseDown(e) {
    if (mode === 'orbit') return;
    // 支援左鍵或右鍵拖曳
    if (e.button === 0 || e.button === 2) {
      isMouseDown = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    }
  }

  function onMouseMove(e) {
    if (mode === 'orbit' || !isMouseDown) return;

    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;

    yaw -= deltaX * mouseSensitivity;
    pitch -= deltaY * mouseSensitivity;

    // 限制仰俯角以防萬向鎖 (Pitch clamp)
    const maxPitch = Math.PI / 2 - 0.05;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    // 套用相機旋轉
    euler.set(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }

  function onMouseUp(e) {
    if (e.button === 0 || e.button === 2) {
      isMouseDown = false;
    }
  }

  function onContextMenu(e) {
    if (mode !== 'orbit') {
      e.preventDefault();
    }
  }

  // 綁定事件
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  domElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('contextmenu', onContextMenu);

  /**
   * 平滑緩動函數 (Smooth cubic ease-in-out)
   */
  function smoothEase(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 切換相機操作模式
   * @param {'orbit'|'fly'|'walk'} newMode 
   */
  function setMode(newMode) {
    const targetMode = (newMode === 'walk') ? 'fly' : newMode;
    if (mode === targetMode) return;

    mode = targetMode;

    if (mode === 'orbit') {
      // 從第一人稱回到軌道模式：將 controls target 設為相機前方
      camera.getWorldDirection(forwardVec);
      controls.target.copy(camera.position).addScaledVector(forwardVec, 60);
      controls.enabled = true;
      controls.update();
      isMouseDown = false;
    } else {
      // 進入第一人稱漫遊/飛行模式
      controls.enabled = false;
      syncAnglesFromCamera();
      // 清空鍵盤狀態
      for (const k in keysDown) {
        keysDown[k] = false;
      }
    }
  }

  /**
   * 取得目前模式
   * @returns {'orbit'|'fly'}
   */
  function getMode() {
    return mode;
  }

  /**
   * 平滑飛往預設景點
   * @param {'plaza'|'aerial'|'deck'|'antenna'|string} presetName 
   * @param {number} [duration=1.5] 秒數
   * @param {Function} [callback]
   */
  function flyTo(presetName, duration = 1.5, callback = null) {
    const preset = CAMERA_PRESETS[presetName];
    if (!preset) {
      console.warn(`[CameraManager] Preset "${presetName}" not found.`);
      return;
    }

    // 若在漫遊模式，先轉回軌道模式
    if (mode !== 'orbit') {
      setMode('orbit');
    }

    startPosition.copy(camera.position);
    startTarget.copy(controls.target);
    endPosition.copy(preset.pos);
    endTarget.copy(preset.target);

    transitionDuration = Math.max(0.1, duration);
    transitionElapsed = 0;
    isTransitioning = true;
    onTransitionComplete = callback;

    controls.enabled = false; // 過渡期間暫停手動控制
  }

  /**
   * 每幀更新相機平滑過渡或第一人稱漫遊運動
   * @param {number} delta 幀時間差 (秒)
   */
  function update(delta) {
    const safeDelta = Math.min(delta, 0.1);

    // 1. 處理平滑視角過渡
    if (isTransitioning) {
      transitionElapsed += safeDelta;
      const progress = Math.min(transitionElapsed / transitionDuration, 1.0);
      const ease = smoothEase(progress);

      camera.position.lerpVectors(startPosition, endPosition, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.lookAt(controls.target);

      if (progress >= 1.0) {
        isTransitioning = false;
        camera.position.copy(endPosition);
        controls.target.copy(endTarget);
        controls.enabled = true;
        controls.update();
        syncAnglesFromCamera();

        if (onTransitionComplete) {
          onTransitionComplete();
          onTransitionComplete = null;
        }
      }
      return;
    }

    // 2. 軌道檢視模式更新
    if (mode === 'orbit') {
      if (controls.enabled) {
        controls.update();
      }
      return;
    }

    // 3. 第一人稱漫遊 / 飛行模式更新
    if (mode === 'fly' || mode === 'walk') {
      // 計算水平前進與側向向量
      camera.getWorldDirection(forwardVec);
      horizontalForward.set(forwardVec.x, 0, forwardVec.z).normalize();
      
      // 避免俯視90度時 horizontalForward 為零向量
      if (horizontalForward.lengthSq() < 0.001) {
        horizontalForward.set(0, 0, -1);
      }
      
      rightVec.crossVectors(horizontalForward, upVec).normalize();

      moveDirection.set(0, 0, 0);

      // W / S: 前進 / 後退
      if (keysDown['KeyW'] || keysDown['ArrowUp']) {
        moveDirection.add(horizontalForward);
      }
      if (keysDown['KeyS'] || keysDown['ArrowDown']) {
        moveDirection.sub(horizontalForward);
      }

      // A / D: 左移 / 右移
      if (keysDown['KeyA'] || keysDown['ArrowLeft']) {
        moveDirection.sub(rightVec);
      }
      if (keysDown['KeyD'] || keysDown['ArrowRight']) {
        moveDirection.add(rightVec);
      }

      // 垂直移動：Space 升空，C / Ctrl 下降
      let verticalMove = 0;
      if (keysDown['Space']) {
        verticalMove += 1.0;
      }
      if (keysDown['KeyC'] || keysDown['ControlLeft'] || keysDown['ControlRight']) {
        verticalMove -= 1.0;
      }

      // 計算速度倍率
      let currentSpeed = moveSpeed;
      if (keysDown['ShiftLeft'] || keysDown['ShiftRight']) {
        currentSpeed *= boostMultiplier;
      }

      // 水平位移應用
      if (moveDirection.lengthSq() > 0.0001) {
        moveDirection.normalize().multiplyScalar(currentSpeed * safeDelta);
        camera.position.add(moveDirection);
      }

      // 垂直位移應用
      if (verticalMove !== 0) {
        camera.position.y += verticalMove * currentSpeed * safeDelta;
      }

      // 地面碰撞防穿透限制 (Ground Clamping)
      camera.position.y = Math.max(minGroundHeight, camera.position.y);

      // 同步 controls.target，方便切換回軌道時不突兀
      controls.target.copy(camera.position).addScaledVector(forwardVec, 50);
    }
  }

  /**
   * 釋放資源與事件監聽
   */
  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    domElement.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    domElement.removeEventListener('contextmenu', onContextMenu);
    controls.dispose();
  }

  return {
    controls,
    setMode,
    getMode,
    flyTo,
    update,
    dispose,
    presets: CAMERA_PRESETS
  };
}
