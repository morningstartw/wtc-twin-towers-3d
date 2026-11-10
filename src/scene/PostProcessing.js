/**
 * WTC Twin Towers Three.js - Post-Processing Pipeline
 * 後製輝光特效 (UnrealBloomPass) 與色彩管線配置
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * 初始化並配置後製泛光管線
 * @param {THREE.WebGLRenderer} renderer 
 * @param {THREE.Scene} scene 
 * @param {THREE.Camera} camera 
 * @param {Object} [options]
 * @returns {Object} Post-processing controls and passes
 */
export function setupPostProcessing(renderer, scene, camera, options = {}) {
  const width = renderer.domElement.clientWidth || window.innerWidth;
  const height = renderer.domElement.clientHeight || window.innerHeight;
  const resolution = new THREE.Vector2(width, height);

  // 1. 初始化 EffectComposer
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(width, height);

  // 2. 基本場景渲染 Pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 3. UnrealBloomPass 泛光通道
  // 針對雙塔辦公室燈火、避雷針紅色障礙燈與紀念天際光柱營造自然大氣光暈
  const defaultStrength = options.strength !== undefined ? options.strength : 0.75;
  const defaultRadius = options.radius !== undefined ? options.radius : 0.45;
  const defaultThreshold = options.threshold !== undefined ? options.threshold : 0.70;

  const bloomPass = new UnrealBloomPass(
    resolution,
    defaultStrength,
    defaultRadius,
    defaultThreshold
  );
  composer.addPass(bloomPass);

  // 4. OutputPass (負責正確的 Tone Mapping 與 sRGB 色彩空間轉換)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  /**
   * 動態調整泛光強度
   * @param {number} val 
   */
  const setBloomStrength = (val) => {
    bloomPass.strength = Math.max(0, val);
  };

  /**
   * 動態調整泛光半徑
   * @param {number} val 
   */
  const setBloomRadius = (val) => {
    bloomPass.radius = Math.max(0, val);
  };

  /**
   * 動態調整泛光發光閾值
   * @param {number} val 
   */
  const setBloomThreshold = (val) => {
    bloomPass.threshold = Math.max(0, Math.min(1, val));
  };

  /**
   * 響應視窗縮放
   * @param {number} w 
   * @param {number} h 
   */
  const resize = (w, h) => {
    composer.setSize(w, h);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    bloomPass.resolution.set(w, h);
  };

  /**
   * 執行後製渲染
   */
  const render = () => {
    composer.render();
  };

  return {
    composer,
    renderPass,
    bloomPass,
    outputPass,
    setBloomStrength,
    setBloomRadius,
    setBloomThreshold,
    resize,
    render
  };
}
