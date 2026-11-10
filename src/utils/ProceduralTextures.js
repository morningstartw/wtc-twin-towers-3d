/**
 * ProceduralTextures.js
 * 程式化紋理與材質生成器
 *
 * 專為紐約世界貿易中心 (WTC) 雙塔與奧斯汀·J·托賓廣場設計的程序化紋理生成系統：
 * 1. createWindowTexture(isNight): 110 層雙塔密柱窗戶貼圖 (白天金屬反射 / 夜間辦公室隨機燈光)
 * 2. createPlazaPavingTexture(): 奧斯汀廣場經典同心圓放射狀花崗岩石磚鋪面貼圖
 * 3. createWaterBumpTexture(): 噴泉水池微波漣漪凹凸 (Bump) 貼圖
 */

import * as THREE from 'three';

/**
 * 跨環境安全建立 Canvas 實例
 * @param {number} width 
 * @param {number} height 
 * @returns {HTMLCanvasElement|OffscreenCanvas}
 */
function createSafeCanvas(width, height) {
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  throw new Error('Canvas execution environment is not available');
}

/**
 * 簡易 PRNG 隨機數生成器 (含種子以確保紋理可重現或自訂)
 */
function createPRNG(seed = 1973) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 1. 雙塔外牆窗戶立面貼圖生成器 (110 層雙塔外觀)
 *
 * 山崎實 (Minoru Yamasaki) 經典設計：
 * - 密集垂直鋁合金立柱 (外骨骼鋼柱，約 48cm 寬)
 * - 狹窄採光窗戶 (約 48cm 寬，防止高空眩暈感)
 * - 各樓層間結構層橫樑 (Spandrel plates)
 *
 * @param {boolean} [isNight=false] - 是否為夜間模式 (開啟 35-40% 暖黃與冷白辦公室燈光)
 * @param {Object} [options={}] - 自訂選項
 * @param {number} [options.width=1024] - 紋理寬度
 * @param {number} [options.height=1024] - 紋理高度
 * @param {number} [options.columns=60] - 寬度方向柱列數 (WTC 單面約 59-60 根立柱)
 * @param {number} [options.floors=110] - 高度方向樓層數 (WTC 110 層樓)
 * @param {number} [options.lightRatio=0.38] - 夜間亮燈比例 (預設約 38%)
 * @param {number} [options.seed=19730911] - 隨機種子 (1973 完工落成)
 * @returns {THREE.CanvasTexture}
 */
export function createWindowTexture(isNight = false, options = {}) {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const columns = options.columns || 60;
  const floors = options.floors || 110;
  const lightRatio = options.lightRatio !== undefined ? options.lightRatio : 0.38;
  const seed = options.seed !== undefined ? options.seed : 19730911;

  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  // 清空底色
  if (isNight) {
    ctx.fillStyle = '#06090e'; // 夜間深邃外廓底色
  } else {
    ctx.fillStyle = '#14171d'; // 日間深灰鋼構底色
  }
  ctx.fillRect(0, 0, width, height);

  const colWidth = width / columns;
  const floorHeight = height / floors;

  // 柱身與玻璃寬度劃分 (立柱佔 46%，窗戶採光開口佔 54%)
  const mullionWidth = colWidth * 0.46;
  const glassWidth = colWidth - mullionWidth;

  // 結構層 (Spandrel) 與窗戶高度劃分 (結構鋼樑佔 32%，玻璃高佔 68%)
  const spandrelHeight = floorHeight * 0.32;
  const glassHeight = floorHeight - spandrelHeight;

  // 夜間燈光色彩庫 (模擬金融/貿易大樓各層不同的室內光源：暖白、金黃、白熾、高科技冷白)
  const nightLightColors = [
    { color: '#ffe9a0', halo: 'rgba(255, 233, 160, 0.45)' }, // 溫暖柔黃 (常見辦公室)
    { color: '#ffd56b', halo: 'rgba(255, 213, 107, 0.50)' }, // 琥珀金光 (晚間加班主管室)
    { color: '#fff9e6', halo: 'rgba(255, 249, 230, 0.40)' }, // 亮麗暖白
    { color: '#e8f4fc', halo: 'rgba(232, 244, 252, 0.35)' }, // 現代冷螢光白 (電腦機房)
    { color: '#ffc87a', halo: 'rgba(255, 200, 122, 0.45)' }  // 鎢絲溫暖黃光
  ];

  // 預先計算夜間亮燈地圖 (讓同一層樓的辦公室具有群集性 cluster，更符合真實商業大樓加班特徵)
  const litMap = new Uint8Array(columns * floors);
  if (isNight) {
    for (let f = 0; f < floors; f++) {
      let c = 0;
      while (c < columns) {
        // 隨機決定是否啟動一個加班辦公室區塊 (2 至 5 間相連窗戶)
        if (prng() < lightRatio * 0.75) {
          const clusterSize = Math.floor(prng() * 4) + 2;
          const end = Math.min(c + clusterSize, columns);
          for (let k = c; k < end; k++) {
            litMap[f * columns + k] = 1;
          }
          c = end;
        } else {
          // 單獨隨機點亮
          if (prng() < lightRatio * 0.35) {
            litMap[f * columns + c] = 1;
          }
          c++;
        }
      }
    }
  }

  // --- 繪製窗戶玻璃與室內光 ---
  for (let f = 0; f < floors; f++) {
    const yTop = f * floorHeight;
    const yGlass = yTop + spandrelHeight;

    for (let c = 0; c < columns; c++) {
      const xLeft = c * colWidth;
      const xGlass = xLeft + mullionWidth;

      if (isNight) {
        const isLit = litMap[f * columns + c] === 1;

        if (isLit) {
          // 點亮的辦公室窗戶
          const colorObj = nightLightColors[Math.floor(prng() * nightLightColors.length)];
          const brightness = 0.75 + prng() * 0.25;

          // 核心燈光
          ctx.fillStyle = colorObj.color;
          ctx.globalAlpha = brightness;
          ctx.fillRect(xGlass, yGlass, glassWidth, glassHeight);

          // 百葉窗陰影 (部分點亮窗戶具有半開百葉窗質感)
          if (prng() > 0.4) {
            ctx.fillStyle = 'rgba(20, 20, 20, 0.45)';
            const blindLines = 2 + Math.floor(prng() * 3);
            const lineSpacing = glassHeight / (blindLines + 1);
            for (let b = 1; b <= blindLines; b++) {
              ctx.fillRect(xGlass, yGlass + b * lineSpacing, glassWidth, 0.75);
            }
          }

          // 窗外微光光暈 (外溢到立柱邊緣)
          ctx.fillStyle = colorObj.halo;
          ctx.globalAlpha = 0.25;
          ctx.fillRect(xGlass - 0.75, yGlass, glassWidth + 1.5, glassHeight);
          ctx.globalAlpha = 1.0;
        } else {
          // 未亮燈的窗戶 (深夜深藍色暗反射)
          const darkTone = Math.floor(8 + prng() * 8);
          ctx.fillStyle = `rgb(${darkTone}, ${darkTone + 4}, ${darkTone + 10})`;
          ctx.fillRect(xGlass, yGlass, glassWidth, glassHeight);
        }
      } else {
        // 白天模式：深色青銅鍍膜反射建築玻璃
        const glassShade = 24 + Math.floor(prng() * 12);
        // 輕微漸層模擬天光反射
        const glassGrad = ctx.createLinearGradient(xGlass, yGlass, xGlass, yGlass + glassHeight);
        glassGrad.addColorStop(0, `rgb(${glassShade + 6}, ${glassShade + 12}, ${glassShade + 22})`);
        glassGrad.addColorStop(1, `rgb(${glassShade}, ${glassShade + 4}, ${glassShade + 10})`);

        ctx.fillStyle = glassGrad;
        ctx.fillRect(xGlass, yGlass, glassWidth, glassHeight);

        // 白天部分窗戶百葉窗拉下反光 (奶白/象牙米色百葉)
        if (prng() < 0.22) {
          const blindH = glassHeight * (0.2 + prng() * 0.6);
          ctx.fillStyle = 'rgba(215, 218, 222, 0.75)';
          ctx.fillRect(xGlass, yGlass, glassWidth, blindH);
          // 百葉窗條紋
          ctx.strokeStyle = 'rgba(120, 125, 132, 0.5)';
          ctx.lineWidth = 0.6;
          for (let by = yGlass + 1.5; by < yGlass + blindH; by += 1.8) {
            ctx.beginPath();
            ctx.moveTo(xGlass, by);
            ctx.lineTo(xGlass + glassWidth, by);
            ctx.stroke();
          }
        }
      }
    }
  }

  // --- 繪製樓層結構橫樑 (Spandrel Plates) ---
  for (let f = 0; f < floors; f++) {
    const yTop = f * floorHeight;

    if (isNight) {
      ctx.fillStyle = '#0a0d13';
      ctx.fillRect(0, yTop, width, spandrelHeight);
      // 深色縫隙線
      ctx.fillStyle = '#040608';
      ctx.fillRect(0, yTop + spandrelHeight - 0.8, width, 0.8);
    } else {
      // 白天陽極氧化青銅/鋁合金結構樑橫帶
      const spandrelGrad = ctx.createLinearGradient(0, yTop, 0, yTop + spandrelHeight);
      spandrelGrad.addColorStop(0, '#424853');
      spandrelGrad.addColorStop(0.5, '#353a44');
      spandrelGrad.addColorStop(1, '#252930');

      ctx.fillStyle = spandrelGrad;
      ctx.fillRect(0, yTop, width, spandrelHeight);

      // 上下結構接縫陰影線
      ctx.fillStyle = 'rgba(15, 18, 22, 0.75)';
      ctx.fillRect(0, yTop, width, 0.8);
      ctx.fillRect(0, yTop + spandrelHeight - 0.8, width, 0.8);
    }
  }

  // --- 繪製垂直立柱外骨骼 (Vertical Aluminum Mullions) ---
  for (let c = 0; c < columns; c++) {
    const xLeft = c * colWidth;

    if (isNight) {
      // 夜間立柱為暗色剪影，邊緣略有環境微光
      ctx.fillStyle = '#11151c';
      ctx.fillRect(xLeft, 0, mullionWidth, height);

      // 立柱邊緣極細高光
      ctx.fillStyle = 'rgba(70, 85, 105, 0.2)';
      ctx.fillRect(xLeft + 0.5, 0, 0.8, height);
    } else {
      // 白天標誌性銀灰亮面鋁合金外立柱 (具立體斜角高光與陰影)
      const mullionGrad = ctx.createLinearGradient(xLeft, 0, xLeft + mullionWidth, 0);
      mullionGrad.addColorStop(0.0, '#78828f'); // 左側受光斜角
      mullionGrad.addColorStop(0.25, '#d0d7de'); // 立柱正中央高光亮面
      mullionGrad.addColorStop(0.75, '#b0b8c2'); // 鋁合金本體灰
      mullionGrad.addColorStop(1.0, '#596370'); // 右側背光溝槽陰影

      ctx.fillStyle = mullionGrad;
      ctx.fillRect(xLeft, 0, mullionWidth, height);

      // 立柱中心外凸凸稜高光細線
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(xLeft + mullionWidth * 0.35, 0, 0.8, height);

      // 與玻璃交界的陰影凹槽
      ctx.fillStyle = 'rgba(20, 24, 30, 0.7)';
      ctx.fillRect(xLeft + mullionWidth - 0.8, 0, 0.8, height);
    }
  }

  // 封裝為 Three.js CanvasTexture 並配置高品質 Mipmap 與色彩空間
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

/**
 * 2. 奧斯汀·J·托賓廣場大理石/花崗岩放射同心圓鋪面貼圖生成器
 *
 * 歷史特徵：
 * 奧斯汀廣場圍繞著著名雕塑《球體》(The Sphere) 與圓形噴泉，
 * 地面以多層放射狀同心圓環與交錯輻射線鋪設，採用粉紅花崗岩、深炭灰玄武岩與暖白花崗岩磚塊。
 *
 * @param {Object} [options={}] - 自訂選項
 * @param {number} [options.width=1024] - 紋理寬度
 * @param {number} [options.height=1024] - 紋理高度
 * @param {number} [options.rings=36] - 同心圓環數量
 * @param {number} [options.spokes=72] - 放射輻射線條數
 * @param {number} [options.seed=1973] - 隨機種子
 * @returns {THREE.CanvasTexture}
 */
export function createPlazaPavingTexture(options = {}) {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const rings = options.rings || 36;
  const spokes = options.spokes || 72;
  const seed = options.seed !== undefined ? options.seed : 1973;

  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const prng = createPRNG(seed);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy);

  // 廣場花崗岩四種典型石材色系 (粉紅花崗岩、深炭灰、銀灰花崗岩、米暖灰)
  const graniteColors = [
    { r: 122, g: 90, b: 82 },   // 經典粉紅花崗岩 (Pink Granite)
    { r: 58, g: 62, b: 70 },    // 深炭灰石磚 (Dark Charcoal Granite)
    { r: 142, g: 148, b: 156 }, // 銀灰花崗岩 (Light Silver Gray)
    { r: 104, g: 98, b: 90 },   // 暖米灰花崗岩 (Warm Buff Gray)
    { r: 84, g: 89, b: 98 }     // 中灰板岩 (Medium Slate)
  ];

  // 填補底色 (深色花崗岩)
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, width, height);

  // 計算各圓環半徑
  const ringStep = maxRadius / rings;

  // 繪製放射狀同心圓板塊
  for (let r = 0; r < rings; r++) {
    const innerR = r * ringStep;
    const outerR = (r + 1) * ringStep;

    // 隨半徑遞增調整輻射分塊數，確保外圍磚塊弧長自然
    const currentSpokes = r < 6 ? Math.floor(spokes / 3) : (r < 18 ? Math.floor(spokes / 2) : spokes);
    const angleStep = (Math.PI * 2) / currentSpokes;

    // 每環主要石材基調
    const ringBaseColor = graniteColors[r % graniteColors.length];

    for (let s = 0; s < currentSpokes; s++) {
      const startAngle = s * angleStep;
      const endAngle = (s + 1) * angleStep;

      // 單塊石磚細微色差 (天然採石場微變)
      const colorJitter = (prng() - 0.5) * 28;
      const red = Math.min(255, Math.max(20, Math.round(ringBaseColor.r + colorJitter)));
      const green = Math.min(255, Math.max(20, Math.round(ringBaseColor.g + colorJitter * 0.9)));
      const blue = Math.min(255, Math.max(20, Math.round(ringBaseColor.b + colorJitter * 0.8)));

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      // 石磚接縫勾勒 (黑色暗溝細縫)
      ctx.strokeStyle = '#181a1f';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // 注入天然花崗岩微粒噪點 (石英、長石、黑雲母雜質顆粒)
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    // 鹽粒與胡椒顆粒噪點
    const noise = (prng() - 0.5) * 32;

    // 偶爾出現高反光白石英或黑雲母暗斑
    const crystal = prng();
    let crystalOffset = 0;
    if (crystal > 0.985) {
      crystalOffset = 45; // 白石英斑點
    } else if (crystal < 0.015) {
      crystalOffset = -35; // 黑雲母斑點
    }

    data[idx] = Math.min(255, Math.max(0, data[idx] + noise + crystalOffset));
    data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise + crystalOffset));
    data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise + crystalOffset));
  }

  ctx.putImageData(imgData, 0, 0);

  // 再次繪製幾何同心圓強調線 (奧斯汀廣場中央巨型同心圓石環飾帶)
  ctx.strokeStyle = 'rgba(240, 242, 245, 0.35)';
  ctx.lineWidth = 2.0;
  for (let accentR = 4; accentR < rings; accentR += 6) {
    ctx.beginPath();
    ctx.arc(cx, cy, accentR * ringStep, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 封裝為 CanvasTexture
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

/**
 * 3. 噴泉水池微波漣漪凹凸 (Bump / Normal) 貼圖生成器
 *
 * 用於奧斯汀廣場中央圓形水池與噴泉水面，生成具備多頻疊加的自然同心擴散水波與風吹微浪。
 * 生成出來的貼圖支援直接作為 MeshStandardMaterial.bumpMap 使用，
 * 並且貼圖物件具備 updateRipples(time) 方法以支援在動態渲染循環中更新波動。
 *
 * @param {Object} [options={}] - 自訂選項
 * @param {number} [options.width=512] - 紋理寬度
 * @param {number} [options.height=512] - 紋理高度
 * @param {number} [options.waveFrequency=0.15] - 漣漪基頻
 * @returns {THREE.CanvasTexture}
 */
export function createWaterBumpTexture(options = {}) {
  const width = options.width || 512;
  const height = options.height || 512;
  const baseFreq = options.waveFrequency || 0.15;

  const canvas = createSafeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const cx = width / 2;
  const cy = height / 2;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  /**
   * 計算特定時間相位下的水波高度並寫入 ImageData
   * @param {number} t - 時間偏移量 (秒)
   */
  function renderWaterPattern(t = 0) {
    for (let y = 0; y < height; y++) {
      const dy = y - cy;
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const r = Math.sqrt(dx * dx + dy * dy);

        // 1. 同心向外擴散的噴泉漣漪 (兩組不同相位與頻率)
        const waveCenter1 = Math.sin(r * baseFreq - t * 4.2);
        const waveCenter2 = Math.sin(r * (baseFreq * 1.85) - t * 6.5) * 0.5;

        // 2. 風向交錯微波 (模擬戶外廣場風吹形成的斜向行進波)
        const waveWind1 = Math.sin(dx * 0.08 + dy * 0.06 - t * 2.8) * Math.cos(dx * 0.05 - dy * 0.07 + t * 2.1) * 0.5;
        const waveWind2 = Math.sin((dx + dy) * 0.12 + t * 3.5) * 0.25;

        // 3. 高頻微細擾動噪點
        const microRipple = Math.sin(r * 0.5 + (dx - dy) * 0.1 - t * 8.0) * 0.15;

        // 疊加高度 [-1, 1] 區間
        const combined = (waveCenter1 + waveCenter2 + waveWind1 + waveWind2 + microRipple) / 2.4;

        // 轉為 0-255 灰階高程圖 (Bump 凹凸值)
        const gray = Math.floor(Math.min(255, Math.max(0, (combined * 0.5 + 0.5) * 255)));

        const idx = (y * width + x) * 4;
        data[idx] = gray;     // R
        data[idx + 1] = gray; // G
        data[idx + 2] = gray; // B
        data[idx + 3] = 255;  // A
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // 初始渲染第一幀 (t = 0)
  renderWaterPattern(0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  // 附加動態漣漪更新介面，方便後續模組即時動畫化水池
  texture.updateRipples = function updateRipples(timeInSeconds) {
    renderWaterPattern(timeInSeconds);
    texture.needsUpdate = true;
  };

  return texture;
}

export default {
  createWindowTexture,
  createPlazaPavingTexture,
  createWaterBumpTexture
};
