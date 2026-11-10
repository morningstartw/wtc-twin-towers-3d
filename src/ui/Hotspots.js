/**
 * Hotspots.js
 * 3D 空間歷史標籤與互動導覽卡片系統
 *
 * 功能：
 * 1. 定義 4 大核心歷史與建築地標之 3D 空間座標。
 * 2. 每幀即時將 3D 世界座標投影至 2D 螢幕像素座標。
 * 3. 視錐邊界與相機背向剪裁過濾，確保標籤精準貼合結構。
 * 4. 點擊標籤彈出歷史卡片、支援關閉/ESC/背景點擊。
 * 5. 支援開關全域標籤顯示。
 */

import * as THREE from 'three';

/**
 * 4 大歷史核心地標定義
 */
export const HISTORICAL_HOTSPOTS = [
  {
    id: 'antenna',
    name: '北塔通訊天線',
    tag: '1 WTC • TELECOM MAST',
    title: '1 WTC 廣播與通訊天線',
    position: new THREE.Vector3(-70, 520, -70),
    description: '1978 年於北塔（1 WTC）屋頂加裝，高達 110 公尺（360 英尺），使北塔總高度達到 526.3 公尺。為紐約大都會區 10 家電視台與多家電台提供高空廣播發射服務。天線頂端設有航空障礙警示燈，在曼哈頓夜空中長年閃爍。',
    year: '1978 年加裝',
    location: '1 WTC 北塔頂部 (標高 526m)',
    icon: '📡',
    cameraPreset: 'antenna'
  },
  {
    id: 'deck',
    name: '南塔觀景台',
    tag: '2 WTC • OBSERVATION DECK',
    title: '2 WTC Top of the World 觀景台',
    position: new THREE.Vector3(70, 420, 70),
    description: '位於 2 WTC 頂層 107 樓室內與 110 樓露天天台，為當時全球最高之露天公共觀景台。天氣晴朗時能見度達 72 公里（45 英里），能遠眺自由女神像與紐約全景，每年吸引數百萬國際旅客參觀。',
    year: '1975 年開放',
    location: '2 WTC 南塔天台 (標高 420m)',
    icon: '🔭',
    cameraPreset: 'deck'
  },
  {
    id: 'arches',
    name: '三叉戟哥德尖拱',
    tag: 'STRUCTURAL • TRIDENT ARCHES',
    title: '山崎實三叉戟立柱 (Trident Arches)',
    position: new THREE.Vector3(-70, 18, -38),
    description: '日裔美籍建築師山崎實獨創的密柱筒體外框工法。外立面鋼柱在 1-6 樓基座處，每 3 根優雅匯聚為 1 根巨大樹狀三叉戟，形成兼具現代工業鋼構與古典新哥德尖拱的宏偉門廳，提供行人寬闊明亮的挑高入口。',
    year: '1973 年落成',
    location: '雙塔 1-6 樓基座立面',
    icon: '🏛️',
    cameraPreset: 'plaza'
  },
  {
    id: 'sphere',
    name: '克尼格天球',
    tag: 'PLAZA • THE SPHERE',
    title: '奧斯汀廣場《克尼格天球》雕塑',
    position: new THREE.Vector3(0, 7, 0),
    description: '德裔雕塑家弗里茨·克尼格（Fritz Koenig）創作的巨大青銅旋轉球體《Große Kugelkaryatide》，直徑達 7.6 公尺、重逾 25 噸。座落於雙塔中央 5 英畝廣場環形花崗岩噴泉中，象徵透過全球貿易促進世界和平。',
    year: '1971 年揭幕',
    location: '奧斯汀·J·托賓廣場中央',
    icon: '🌐',
    cameraPreset: 'plaza'
  },
  {
    id: 'wfc',
    name: '世界金融中心',
    tag: 'BATTERY PARK CITY • WFC',
    title: '世界金融中心 (Brookfield Place)',
    position: new THREE.Vector3(-230, 205, -60),
    description: '由知名後現代建築大師西薩·佩里（César Pelli）精心設計，包含四座冠以幾何銅綠屋頂（圓頂、金字塔、階梯稜台與平頂）的大廈，以及壯觀的冬季花園（Winter Garden）挑高玻璃拱頂中庭與哈德遜水岸休閒步道。',
    year: '1985–1988 年落成',
    location: '世貿中心西側水岸 (BPC)',
    icon: '🏛️',
    cameraPreset: 'wintergarden'
  },
  {
    id: 'marriott',
    name: 'WTC 3 萬豪酒店',
    tag: '3 WTC • MARRIOTT HOTEL',
    title: '3 WTC 萬豪世貿酒店 (Vista Hotel)',
    position: new THREE.Vector3(-42, 65, 42),
    description: '原名 Vista International Hotel，為雙塔西南側緊鄰的 22 層階梯狀鋼骨結構飯店，擁有 825 間客房。作為二戰後下曼哈頓興建的首座新型豪華飯店，直通雙塔大廳與地下商場，是連結世貿與西街的重要樞紐。',
    year: '1981 年開幕',
    location: '雙塔西南基座西街側',
    icon: '🏨',
    cameraPreset: 'westst'
  },
  {
    id: 'wtc7',
    name: 'WTC 7 梯形大廈',
    tag: '7 WTC • 47-STORY TOWER',
    title: '7 WTC 七號世貿大樓',
    position: new THREE.Vector3(-45, 185, -210),
    description: '坐落於維西街北側的 47 層摩天大樓，跨建於聯合愛迪生變電所上方。外牆採用醒目的紅花崗岩與幾何帷幕，三樓設有寬闊的戶外散步道高架天橋，跨越西街直達世貿主廣場。',
    year: '1987 年落成',
    location: '維西街北側 (47 層梯形塔)',
    icon: '🏢',
    cameraPreset: 'aerial'
  },
  {
    id: 'hudson-ferry',
    name: '哈德遜水岸渡輪',
    tag: 'HUDSON RIVER • HARBOR FERRY',
    title: '哈德遜河水岸與客運渡輪',
    position: new THREE.Vector3(-450, 8, 50),
    description: '哈德遜河下曼哈頓水岸碼頭（WFC Ferry Terminal）是紐約繁華的客運渡輪網絡核心樞紐，雙體渡輪日夜頻繁往返新澤西與曼哈頓。開闊的水面視野是遠眺世貿雙塔巨柱天際線與世界金融中心水岸大廈群的最佳景點。',
    year: '1989 年碼頭啟用',
    location: '哈德遜河客運水域與碼頭',
    icon: '⛴️',
    cameraPreset: 'hudson'
  }
];

/**
 * 創建熱點標籤管理器
 * @param {THREE.Scene} scene 3D 場景
 * @param {THREE.Camera} camera 相機
 * @param {HTMLElement} domContainer 標籤掛載 DOM 容器
 * @param {Function} [onFocusLocation] 點擊標籤時之相機對焦回呼
 */
export function createHotspots(scene, camera, domContainer, onFocusLocation) {
  const container = domContainer || document.getElementById('hotspot-markers-container');
  let visible = true;
  const tempVec = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const toCamera = new THREE.Vector3();

  // 取得彈窗元素
  const modal = document.getElementById('hotspot-modal');
  const tagEl = document.getElementById('hotspot-tag');
  const titleEl = document.getElementById('hotspot-title');
  const descEl = document.getElementById('hotspot-description');
  const yearEl = document.getElementById('hotspot-year');
  const locEl = document.getElementById('hotspot-location');
  const closeBtn = document.getElementById('btn-close-hotspot');
  const flyBtn = document.getElementById('btn-hotspot-fly');

  let currentModalData = null;

  // 生成 HTML 標籤
  const hotspotItems = HISTORICAL_HOTSPOTS.map((data) => {
    const el = document.createElement('div');
    el.className = 'hotspot-pin';
    el.setAttribute('data-id', data.id);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('title', `${data.name} - 點擊查看歷史`);

    el.innerHTML = `
      <span class="pin-dot"></span>
      <span class="pin-icon">${data.icon}</span>
      <span class="pin-label">${data.name}</span>
    `;

    // 點擊事件
    const handleClick = (e) => {
      e.stopPropagation();
      openModal(data);
      if (typeof onFocusLocation === 'function') {
        onFocusLocation(data);
      }
    };

    el.addEventListener('click', handleClick);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    });

    if (container) {
      container.appendChild(el);
    }

    return {
      data,
      element: el,
      position: data.position.clone()
    };
  });

  /**
   * 開啟歷史卡片彈窗
   */
  function openModal(data) {
    if (!modal) return;
    currentModalData = data;
    if (tagEl) tagEl.textContent = data.tag;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description;
    if (yearEl) yearEl.textContent = data.year;
    if (locEl) locEl.textContent = data.location;
    modal.classList.remove('hidden');
  }

  /**
   * 關閉歷史卡片彈窗
   */
  function closeModal() {
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // 關閉按鈕事件
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  // 彈窗內一鍵平滑飛往該景點視角按鈕
  if (flyBtn) {
    flyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentModalData && typeof onFocusLocation === 'function') {
        onFocusLocation(currentModalData);
      }
    });
  }

  // ESC 鍵關閉卡片
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  /**
   * 每幀更新 3D 空間投影至螢幕 2D 座標
   */
  function update() {
    if (!container) return;

    if (!visible) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.getWorldDirection(camDir);

    for (let i = 0; i < hotspotItems.length; i++) {
      const item = hotspotItems[i];

      // 檢查是否在相機前方 (在世界座標中，相機到物體向量與相機視向內積需 > 0)
      toCamera.copy(item.position).sub(camera.position);
      if (toCamera.dot(camDir) <= 0) {
        item.element.style.display = 'none';
        continue;
      }

      tempVec.copy(item.position);

      // 投影至正規化設備座標 (NDC: [-1, 1])
      tempVec.project(camera);

      // 檢驗是否在可視視錐邊界內
      const inFrustum =
        tempVec.z <= 1.0 &&
        tempVec.x >= -1.05 &&
        tempVec.x <= 1.05 &&
        tempVec.y >= -1.05 &&
        tempVec.y <= 1.05;

      if (!inFrustum) {
        item.element.style.display = 'none';
      } else {
        item.element.style.display = 'flex';
        // 轉換為螢幕像素座標 (0,0 在左上角)
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-(tempVec.y * 0.5) + 0.5) * height;

        // 以 transform 定位以達最佳 GPU 渲染效能
        item.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
      }
    }
  }

  /**
   * 切換全域熱點標籤可見性
   */
  function setVisible(v) {
    visible = !!v;
    if (container) {
      container.style.display = visible ? 'block' : 'none';
    }
    if (!visible) {
      closeModal();
    }
  }

  /**
   * 取得當前可見性
   */
  function isVisible() {
    return visible;
  }

  return {
    update,
    setVisible,
    isVisible,
    openModal,
    closeModal,
    hotspots: hotspotItems
  };
}
