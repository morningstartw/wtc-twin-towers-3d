/**
 * Screenshot.js
 * 4K 超高解析度畫布截圖與寫真匯出器
 *
 * 功能：
 * 1. 支援高解析度 (3840x2160 4K UHD 或原生解析度) 離屏即時繪製。
 * 2. 截圖前自動暫時隱藏 UI 覆蓋層、3D 空間熱點標籤與彈窗。
 * 3. 完整支援 PostProcessing 後製管線 (Bloom 泛光與色彩映射)。
 * 4. 觸發自動瀏覽器下載（檔名：WTC_Twin_Towers_Screenshot.png）。
 * 5. 安全復原相機投電視角、Renderer 尺寸與 DPR。
 * 6. 具備相機快門閃光反饋動畫與 Toast 提示。
 */

/**
 * 建立短暫快門閃爍動畫
 */
function triggerCameraFlash() {
  let flashEl = document.getElementById('screenshot-flash');
  if (!flashEl) {
    flashEl = document.createElement('div');
    flashEl.id = 'screenshot-flash';
    flashEl.className = 'screen-flash';
    document.body.appendChild(flashEl);
  }

  // 重置動畫
  flashEl.classList.remove('active');
  void flashEl.offsetWidth; // 強制重繪
  flashEl.classList.add('active');

  setTimeout(() => {
    flashEl.classList.remove('active');
  }, 400);
}

/**
 * 高解析度截圖匯出核心函式
 * @param {THREE.WebGLRenderer} renderer 
 * @param {THREE.Scene} scene 
 * @param {THREE.Camera} camera 
 * @param {Object} [options] 
 * @param {number} [options.width=3840] 目標寬度 (預設 4K 3840px)
 * @param {number} [options.height=2160] 目標高度 (預設 4K 2160px)
 * @param {string} [options.fileName='WTC_Twin_Towers_Screenshot.png'] 匯出檔名
 * @param {Object} [options.postProcessing] 後製處理管線物件 (具備 render 與 resize 方法)
 * @param {Function} [options.onSuccess] 截圖完成回呼
 * @returns {Promise<void>}
 */
export async function captureScreenshot(renderer, scene, camera, options = {}) {
  const {
    width = 3840,
    height = 2160,
    fileName = 'WTC_Twin_Towers_Screenshot.png',
    postProcessing = window.wtcPostProcessing || null,
    onSuccess = null
  } = options;

  if (!renderer || !scene || !camera) {
    console.error('[Screenshot] 缺少必要渲染器或場景相機參數');
    return;
  }

  // 1. 觸發快門閃光
  triggerCameraFlash();

  // 2. 暫時隱藏 UI 元素
  const overlay = document.getElementById('ui-overlay');
  const hotspotsContainer = document.getElementById('hotspot-markers-container');
  const originalOverlayVisibility = overlay ? overlay.style.visibility : '';
  const originalHotspotsDisplay = hotspotsContainer ? hotspotsContainer.style.display : '';

  if (overlay) overlay.style.visibility = 'hidden';
  if (hotspotsContainer) hotspotsContainer.style.display = 'none';

  // 3. 備份當前渲染器、視窗尺寸與相機狀態
  const origWidth = window.innerWidth;
  const origHeight = window.innerHeight;
  const origPixelRatio = renderer.getPixelRatio();
  const origAspect = camera.aspect;

  try {
    // 4. 設定高解析度目標
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);

    if (postProcessing && typeof postProcessing.resize === 'function') {
      postProcessing.resize(width, height);
    }

    // 5. 執行高畫質渲染 (一律透過 composer 或直接 renderer 繪製最新幀)
    if (postProcessing && typeof postProcessing.render === 'function') {
      postProcessing.render();
    } else {
      renderer.render(scene, camera);
    }

    // 6. 讀取畫布內容並建立下載
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.style.display = 'none';
    downloadAnchor.download = fileName;
    downloadAnchor.href = dataUrl;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // 延遲移除 DOM 下載元素
    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
    }, 100);

    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  } catch (error) {
    console.error('[Screenshot] 截圖處理失敗:', error);
  } finally {
    // 7. 復原相機與渲染器設定
    camera.aspect = origAspect;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(origPixelRatio);
    renderer.setSize(origWidth, origHeight);

    if (postProcessing && typeof postProcessing.resize === 'function') {
      postProcessing.resize(origWidth, origHeight);
    }

    // 重新繪製一幀確保畫布與螢幕一致
    if (postProcessing && typeof postProcessing.render === 'function') {
      postProcessing.render();
    } else {
      renderer.render(scene, camera);
    }

    // 復原 UI 元素
    if (overlay) overlay.style.visibility = originalOverlayVisibility;
    if (hotspotsContainer) hotspotsContainer.style.display = originalHotspotsDisplay;
  }
}
