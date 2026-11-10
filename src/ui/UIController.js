/**
 * UIController.js
 * 統一人機互動控制器與深色擬態介面事件管理
 *
 * 功能：
 * 1. 綁定動態氣候按鈕 (晴天/黃昏/夜晚/雨天) 與狀態同步。
 * 2. 綁定經典導覽視角 (全景/廣場/觀景台/天線) 與狀態同步。
 * 3. 綁定相機操控模式 (軌道檢視/第一人稱漫遊/退出漫遊)。
 * 4. 綁定特色功能開關 (X-Ray 透視/紀念光柱/3D 歷史熱點)。
 * 5. 綁定 4K 寫真截圖、UI 沉浸隱藏與全螢幕切換。
 * 6. 提供快捷鍵監聽 (Esc, H, X, T, U) 與玻璃擬態 Toast 通知系統。
 */

export class UIController {
  constructor(options = {}) {
    this.options = {
      onWeatherChange: null,
      onViewChange: null,
      onModeChange: null,
      onToggleXRay: null,
      onToggleTribute: null,
      onToggleHotspots: null,
      onScreenshot: null,
      ...options
    };

    this.toastContainer = null;
    this.initElements();
    this.bindEvents();
    this.initKeyboardShortcuts();
  }

  /**
   * 快取 DOM 元素
   */
  initElements() {
    this.overlay = document.getElementById('ui-overlay');
    this.toggleUiBtn = document.getElementById('btn-toggle-ui');
    this.fullscreenBtn = document.getElementById('btn-fullscreen');
    this.screenshotBtn = document.getElementById('btn-screenshot');

    // 氣候按鈕群
    this.weatherBtns = document.querySelectorAll('.weather-btn, #weather-controls button');

    // 視角按鈕群
    this.viewBtns = document.querySelectorAll('.view-btn, #preset-view-controls button');

    // 模式按鈕群與導覽條
    this.modeBtns = document.querySelectorAll('.mode-btn, #camera-mode-controls button');
    this.flyGuide = document.getElementById('first-person-guide');
    this.exitFlyBtn = document.getElementById('btn-exit-fly') || document.getElementById('btn-exit-walk');

    // 特色開關
    this.xraySwitch = document.getElementById('btn-toggle-xray');
    this.tributeSwitch = document.getElementById('btn-toggle-tribute');
    this.hotspotsSwitch = document.getElementById('btn-toggle-hotspots');

    // 熱點彈窗與關閉按鈕
    this.hotspotModal = document.getElementById('hotspot-modal');
    this.closeHotspotBtn = document.getElementById('btn-close-hotspot');

    // 建立 Toast 容器
    this.ensureToastContainer();
  }

  /**
   * 確保 Toast 容器存在
   */
  ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      if (this.overlay) {
        this.overlay.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
    this.toastContainer = container;
  }

  /**
   * 顯示精緻玻璃擬態 Toast 通知
   * @param {string} message 提示訊息
   * @param {'info'|'success'|'warning'} [type='info'] 類型
   * @param {number} [duration=3000] 顯示毫秒數
   */
  showToast(message, type = 'info', duration = 3000) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success' || message.includes('📸')) icon = '📸';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    // 進場微動畫
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // 定時自動退場
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * 綁定各介面按鈕事件
   */
  bindEvents() {
    // 1. UI 顯示 / 沉浸隱藏切換
    if (this.toggleUiBtn && this.overlay) {
      this.toggleUiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = this.overlay.classList.toggle('ui-hidden');
        this.showToast(isHidden ? '進入沉浸全景模式 (按 U 或右上角圖示復原)' : '已復原控制面板', 'info', 2000);
      });
    }

    // 2. 全螢幕切換
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // 3. 氣候切換
    this.weatherBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const weather = btn.dataset.weather || btn.id.replace('btn-weather-', '');
        this.setWeather(weather);
        if (typeof this.options.onWeatherChange === 'function') {
          this.options.onWeatherChange(weather);
        }
      });
    });

    // 4. 視角切換
    this.viewBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const view = btn.dataset.view || btn.id.replace('btn-view-', '');
        this.setView(view);
        if (typeof this.options.onViewChange === 'function') {
          this.options.onViewChange(view);
        }
      });
    });

    // 5. 相機漫遊模式切換
    this.modeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.dataset.mode || (btn.id === 'btn-mode-walk' ? 'fly' : 'orbit');
        this.setMode(mode);
        if (typeof this.options.onModeChange === 'function') {
          this.options.onModeChange(mode);
        }
      });
    });

    // 6. 退出第一人稱漫遊
    if (this.exitFlyBtn) {
      this.exitFlyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMode('orbit');
        if (typeof this.options.onModeChange === 'function') {
          this.options.onModeChange('orbit');
        }
      });
    }

    // 7. X-Ray 透視開關
    if (this.xraySwitch) {
      this.xraySwitch.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = this.xraySwitch.classList.toggle('active');
        this.xraySwitch.setAttribute('aria-checked', isActive ? 'true' : 'false');
        this.showToast(isActive ? '已啟用 X-Ray 內部鋼骨筒透視' : '已關閉 X-Ray 透視', 'info', 1800);
        if (typeof this.options.onToggleXRay === 'function') {
          this.options.onToggleXRay(isActive);
        }
      });
    }

    // 8. 紀念光柱開關
    if (this.tributeSwitch) {
      this.tributeSwitch.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = this.tributeSwitch.classList.toggle('active');
        this.tributeSwitch.setAttribute('aria-checked', isActive ? 'true' : 'false');
        this.showToast(isActive ? '已點亮 Tribute in Light 雙塔紀念光柱' : '已關閉紀念光柱', 'info', 1800);
        if (typeof this.options.onToggleTribute === 'function') {
          this.options.onToggleTribute(isActive);
        }
      });
    }

    // 9. 歷史熱點開關
    if (this.hotspotsSwitch) {
      this.hotspotsSwitch.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = this.hotspotsSwitch.classList.toggle('active');
        this.hotspotsSwitch.setAttribute('aria-checked', isActive ? 'true' : 'false');
        this.showToast(isActive ? '已開啟 3D 空間歷史地標標籤' : '已隱藏 3D 空間歷史標籤', 'info', 1800);
        if (typeof this.options.onToggleHotspots === 'function') {
          this.options.onToggleHotspots(isActive);
        }
      });
    }

    // 10. 截圖按鈕
    if (this.screenshotBtn) {
      this.screenshotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.options.onScreenshot === 'function') {
          this.options.onScreenshot();
        }
      });
    }

    // 11. 熱點彈窗關閉按鈕
    if (this.closeHotspotBtn && this.hotspotModal) {
      this.closeHotspotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hotspotModal.classList.add('hidden');
      });
    }

    // 12. 點擊彈窗外部空白處關閉
    window.addEventListener('click', (e) => {
      if (
        this.hotspotModal &&
        !this.hotspotModal.classList.contains('hidden') &&
        !this.hotspotModal.contains(e.target) &&
        !e.target.closest('.hotspot-pin')
      ) {
        this.hotspotModal.classList.add('hidden');
      }
    });
  }

  /**
   * 鍵盤全域快捷鍵
   */
  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // 避免於輸入框時觸發
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'Escape':
          if (this.hotspotModal && !this.hotspotModal.classList.contains('hidden')) {
            this.hotspotModal.classList.add('hidden');
          } else if (this.flyGuide && !this.flyGuide.classList.contains('hidden')) {
            this.setMode('orbit');
            if (typeof this.options.onModeChange === 'function') {
              this.options.onModeChange('orbit');
            }
          }
          break;

        case 'u':
        case 'U':
          if (this.toggleUiBtn) this.toggleUiBtn.click();
          break;

        case 'f':
        case 'F':
          if (this.fullscreenBtn) this.fullscreenBtn.click();
          break;

        case 'x':
        case 'X':
          if (this.xraySwitch) this.xraySwitch.click();
          break;

        case 't':
        case 'T':
          if (this.tributeSwitch) this.tributeSwitch.click();
          break;

        case 'h':
        case 'H':
          if (this.hotspotsSwitch) this.hotspotsSwitch.click();
          break;

        case '1':
          this.triggerWeatherByIndex(0);
          break;
        case '2':
          this.triggerWeatherByIndex(1);
          break;
        case '3':
          this.triggerWeatherByIndex(2);
          break;
        case '4':
          this.triggerWeatherByIndex(3);
          break;
        case '5':
          this.triggerViewByName('hudson');
          break;
        case '6':
          this.triggerViewByName('westst');
          break;
        case '7':
          this.triggerViewByName('wintergarden');
          break;
      }
    });
  }

  triggerWeatherByIndex(index) {
    if (this.weatherBtns && this.weatherBtns[index]) {
      this.weatherBtns[index].click();
    }
  }

  triggerViewByName(viewName) {
    const btn = document.getElementById(`btn-view-${viewName}`);
    if (btn) {
      btn.click();
    }
  }

  /**
   * 設定天氣按鈕高亮狀態
   */
  setWeather(weather) {
    this.weatherBtns.forEach((btn) => {
      const match =
        btn.dataset.weather === weather ||
        btn.id === `btn-weather-${weather}` ||
        btn.getAttribute('data-weather') === weather;
      if (match) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * 設定視角按鈕高亮狀態
   */
  setView(view) {
    this.viewBtns.forEach((btn) => {
      const match =
        btn.dataset.view === view ||
        btn.id === `btn-view-${view}` ||
        btn.getAttribute('data-view') === view;
      if (match) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 切換預設視角時自動切回軌道檢視模式按鈕
    this.setMode('orbit', false);
  }

  /**
   * 設定相機模式高亮與提示條顯示
   */
  setMode(mode, triggerCallback = true) {
    const isFly = mode === 'fly' || mode === 'walk';

    this.modeBtns.forEach((btn) => {
      const btnMode = btn.dataset.mode || (btn.id === 'btn-mode-walk' ? 'fly' : 'orbit');
      const isMatch = (isFly && (btnMode === 'fly' || btnMode === 'walk')) || (!isFly && btnMode === 'orbit');
      if (isMatch) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (this.flyGuide) {
      if (isFly) {
        this.flyGuide.classList.remove('hidden');
      } else {
        this.flyGuide.classList.add('hidden');
      }
    }
  }

  /**
   * 設定 X-Ray 開關狀態
   */
  setXRayActive(active) {
    if (this.xraySwitch) {
      if (active) {
        this.xraySwitch.classList.add('active');
        this.xraySwitch.setAttribute('aria-checked', 'true');
      } else {
        this.xraySwitch.classList.remove('active');
        this.xraySwitch.setAttribute('aria-checked', 'false');
      }
    }
  }

  /**
   * 設定紀念光柱開關狀態
   */
  setTributeActive(active) {
    if (this.tributeSwitch) {
      if (active) {
        this.tributeSwitch.classList.add('active');
        this.tributeSwitch.setAttribute('aria-checked', 'true');
      } else {
        this.tributeSwitch.classList.remove('active');
        this.tributeSwitch.setAttribute('aria-checked', 'false');
      }
    }
  }

  /**
   * 設定熱點標籤開關狀態
   */
  setHotspotsActive(active) {
    if (this.hotspotsSwitch) {
      if (active) {
        this.hotspotsSwitch.classList.add('active');
        this.hotspotsSwitch.setAttribute('aria-checked', 'true');
      } else {
        this.hotspotsSwitch.classList.remove('active');
        this.hotspotsSwitch.setAttribute('aria-checked', 'false');
      }
    }
  }
}

/**
 * 工廠函式：初始化 UI 控制器
 * @param {Object} options 
 * @returns {UIController}
 */
export function initUI(options) {
  return new UIController(options);
}
