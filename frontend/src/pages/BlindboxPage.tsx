import { useState, useCallback, useEffect, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Hongbao } from '../components/Hongbao';
import confetti from 'canvas-confetti';
import QRCodeStyling from 'qr-code-styling';
import './BlindboxPage.css';

// 二维码 URL
const QR_CODE_URL = import.meta.env.VITE_QR_CODE_URL || 'https://macard.ecnu.edu.cn';

type Step = 
  | 'home'
  | 'growing'      // 红包变大 + 粒子汇聚
  | 'shaking'      // 振动蓄力
  | 'maxSize'      // 突变最大
  | 'flapOpen'     // 封口打开
  | 'cardPeek'     // 卡片探出
  | 'cardOut'      // 卡片弹出 + 彩带
  | 'result';      // 完成

// 首页少量粒子配置
const homeParticlesOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 15 },
    color: { value: ['#f4d03f', '#ffeaa7', '#fff'] },
    shape: { type: 'circle' as const },
    opacity: { value: { min: 0.2, max: 0.6 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: 0.5,
      direction: 'top' as const,
      outModes: { default: 'out' as const },
      random: true
    },
    twinkle: { particles: { enable: true, frequency: 0.03, opacity: 1 } }
  },
  detectRetina: true
};

// 背景烟花配置
const fireworksOptions = {
  fullScreen: { enable: false },
  detectRetina: true,
  particles: {
    number: { value: 20 },
    color: { value: ['#f4d03f', '#ffeaa7', '#fff'] },
    shape: { type: 'circle' as const },
    opacity: { value: { min: 0.3, max: 0.8 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: 1,
      direction: 'top' as const,
      outModes: { default: 'out' as const },
      random: true
    },
    twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1 } }
  }
};

// 预加载图片并返回尺寸
function preloadImage(url: string): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = url;
  });
}

// API 调用
async function generateCardImage(): Promise<{ url: string; width: number; height: number }> {
  const response = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '' })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '网络错误' }));
    throw new Error(error.detail || '生成图片失败');
  }
  
  const data = await response.json();
  // 通过代理加载外部图片，避免跨域问题
  const proxyUrl = `/api/ai/image-proxy?url=${encodeURIComponent(data.image_url)}`;
  // 预加载图片，等下载完成后返回尺寸
  return preloadImage(proxyUrl);
}

export function BlindboxPage() {
  const [step, setStep] = useState<Step>('home');
  const [size, setSize] = useState(200);
  const [isOpen, setIsOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardOffset, setCardOffset] = useState(0);
  const [cardImage, setCardImage] = useState('');
  const [hongbaoY, setHongbaoY] = useState(0);
  const [particlesReady, setParticlesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardFullyOut, setCardFullyOut] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);  // 全屏预览图片
  const [normalHongbaoY, setNormalHongbaoY] = useState(0);  // 保存正常状态的红包位置
  const [fullOutHongbaoY, setFullOutHongbaoY] = useState(0);  // 保存完全弹出时的红包位置
  const [normalCardOffset, setNormalCardOffset] = useState(0);  // 保存正常状态的卡片偏移
  
  const particlesRef = useRef<HTMLDivElement>(null);
  const particleIntervalsRef = useRef<number[]>([]);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  // 初始化粒子引擎
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  // 初始化 confetti canvas
  useEffect(() => {
    if (confettiCanvasRef.current && !confettiInstanceRef.current) {
      confettiInstanceRef.current = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: false
      });
    }
  }, []);

  // 彩带喷发
  const fireConfettiEffect = useCallback(() => {
    const myConfetti = confettiInstanceRef.current;
    if (!myConfetti) return;
    
    const colors = ['#f4d03f', '#e74c3c', '#ff6b6b', '#ffeaa7', '#fff', '#c0392b', '#fdcb6e'];
    
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.4 },
      angle: 90,
      startVelocity: 60,
      gravity: 0.8,
      colors,
      shapes: ['square', 'circle'],
      scalar: 1.2
    });
    
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.3, y: 0.5 },
        angle: 60,
        startVelocity: 50,
        colors,
        shapes: ['square', 'circle']
      });
    }, 100);
    
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.7, y: 0.5 },
        angle: 120,
        startVelocity: 50,
        colors,
        shapes: ['square', 'circle']
      });
    }, 100);
  }, []);

  // 汇聚粒子效果
  const startConvergeParticles = useCallback(() => {
    const container = particlesRef.current;
    if (!container) {
      return;
    }
    
    container.innerHTML = '';
    particleIntervalsRef.current.forEach(id => clearTimeout(id));
    particleIntervalsRef.current = [];
    
    const colors = ['#f4d03f', '#ffeaa7', '#fdcb6e', '#fff', '#f39c12'];
    let spawnRate = 80;
    let batchSize = 15;
    let minDuration = 1.5;
    
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'converge-particle';
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 160 + Math.random() * 80;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;
      const size = 2 + Math.random() * 4;
      const duration = minDuration + Math.random() * 0.8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        left: calc(50% + ${startX}px);
        top: calc(50% + ${startY}px);
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        --move-x: ${-startX}px;
        --move-y: ${-startY}px;
        animation: convergeToCenter ${duration}s ease-in forwards;
      `;
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration * 1000);
    };
    
    const accelerate = () => {
      for (let i = 0; i < batchSize; i++) createParticle();
      
      if (spawnRate > 30) spawnRate *= 0.85;
      if (batchSize < 30) batchSize += 0.6;
      if (minDuration > 0.4) minDuration *= 0.94;
      
      const id = window.setTimeout(accelerate, spawnRate);
      particleIntervalsRef.current.push(id);
    };
    
    accelerate();
  }, []);

  const stopConvergeParticles = useCallback(() => {
    particleIntervalsRef.current.forEach(id => clearTimeout(id));
    particleIntervalsRef.current = [];
    if (particlesRef.current) particlesRef.current.innerHTML = '';
  }, []);

  // 平滑变大动画（加速曲线）
  const animateSize = useCallback((from: number, to: number, duration: number, onShake?: number) => {
    return new Promise<void>(resolve => {
      const startTime = performance.now();
      let shakeTriggered = false;
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeInQuad: 加速曲线
        const eased = progress * progress;
        const currentSize = from + (to - from) * eased;
        setSize(currentSize);
        
        // 到达指定大小时开始振动（只触发一次）
        if (onShake && currentSize >= onShake && !shakeTriggered) {
          shakeTriggered = true;
          setShaking(true);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }, []);

  // 缓慢变大动画（减速曲线，可取消），用于等待 API 期间
  const slowGrowRef = useRef<{ cancel: () => void } | null>(null);
  const currentSizeRef = useRef(200);
  
  const startSlowGrow = useCallback((from: number, to: number, duration: number) => {
    return new Promise<number>(resolve => {
      const startTime = performance.now();
      let cancelled = false;
      
      const animate = (now: number) => {
        if (cancelled) {
          resolve(currentSizeRef.current);
          return;
        }
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad: 减速曲线，速度越来越慢
        const eased = 1 - (1 - progress) * (1 - progress);
        const currentSize = from + (to - from) * eased;
        currentSizeRef.current = currentSize;
        setSize(currentSize);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(currentSize);
        }
      };
      
      slowGrowRef.current = {
        cancel: () => {
          cancelled = true;
        }
      };
      
      requestAnimationFrame(animate);
    });
  }, []);

  // 开始流程
  const handleStart = useCallback(async () => {
    // 确保从初始状态开始
    setSize(200);
    currentSizeRef.current = 200;
    setShaking(false);
    setError(null);
    
    // 等一帧确保渲染
    await new Promise(r => requestAnimationFrame(() => r(undefined)));
    
    // Step 1: 红包开始变大 + 粒子汇聚 + 同时调用 API
    setStep('growing');
    setGlowing(true);
    
    // 延迟启动粒子，确保 DOM 已渲染
    setTimeout(() => startConvergeParticles(), 50);
    
    // 同时开始调用 API 和动画
    let apiResolved = false;
    const apiPromise = generateCardImage()
      .then(result => {
        setCardImage(result.url);
        apiResolved = true;
        // API 返回后取消缓慢变大动画
        slowGrowRef.current?.cancel();
        return result;
      })
      .catch(err => {
        console.error('生成图片失败:', err);
        apiResolved = true;
        slowGrowRef.current?.cancel();
        // 失败时使用占位图
        const fallbackUrl = `https://picsum.photos/seed/${Date.now()}/720/1280`;
        setCardImage(fallbackUrl);
        setError(err.message || '生成图片失败，使用默认图片');
        return { url: fallbackUrl, width: 720, height: 1280 };
      });
    
    // Step 1: 平滑加速变大：200 -> 280，在280时开始振动
    await animateSize(200, 280, 800, 280);
    currentSizeRef.current = 280;
    setShaking(true);

    // Step 2: 如果 API 还没返回，继续缓慢变大 280 -> 320（减速曲线）
    if (!apiResolved) {
      await startSlowGrow(280, 320, 3000);  // 3秒内缓慢变大到320
    }

    // 等待 API 返回（如果还没完成）
    const imageResult = await apiPromise;

    // Step 3: API 返回后，固定 200ms 变大到最大
    setStep('maxSize');
    await animateSize(currentSizeRef.current, 400, 200);
    
    // 根据图片尺寸动态计算位置
    const hongbaoWidth = 400;
    const hongbaoHeight = hongbaoWidth * 1.4;  // 560px
    const cardWidth = hongbaoWidth * 0.9;  // 360px
    const cardHeight = cardWidth * (imageResult.height / imageResult.width);
    const overlap = 50;  // 红包遮挡图片底部的像素
    // 图片垂直居中，红包下移到只遮挡图片底部一点点
    const finalCardOffset = -cardHeight + overlap - hongbaoHeight * 0.1;
    const normalY = cardHeight / 2 - overlap + hongbaoHeight / 2;
    // 完全弹出：红包完全不遮挡图片（红包顶部在图片底部下方）
    const fullOutY = cardHeight / 2 + hongbaoHeight / 2 + 20;  // 额外 20px 间距
    
    // 保存位置值供切换使用
    setNormalHongbaoY(normalY);
    setFullOutHongbaoY(fullOutY);
    setNormalCardOffset(finalCardOffset);
    setCardFullyOut(false);

    // Step 4: 封口打开（停止振动和粒子）
    setStep('flapOpen');
    setShaking(false);
    stopConvergeParticles();
    setIsOpen(true);
    
    await new Promise(r => setTimeout(r, 100));

    // Step 5: 卡片探出（用 cardMaxHeight 限制显示范围）
    setStep('cardPeek');
    setCardVisible(true);
    setCardOffset(-80);
    
    await new Promise(r => setTimeout(r, 80));

    // Step 6: 卡片爆发弹出 + 红包下移 + 礼花（同时进行）
    setStep('result');
    fireConfettiEffect();
    setCardOffset(finalCardOffset);
    setHongbaoY(normalY);
    setGlowing(false);
  }, [startConvergeParticles, stopConvergeParticles, fireConfettiEffect, animateSize, startSlowGrow]);

  // 切换卡片完全弹出/正常状态
  const toggleCardFullyOut = useCallback(() => {
    if (step !== 'result') return;
    setCardFullyOut(prev => {
      const newState = !prev;
      // 红包下移时，图片需要往上移动相同距离来保持垂直居中
      const hongbaoMoveDelta = fullOutHongbaoY - normalHongbaoY;
      setHongbaoY(newState ? fullOutHongbaoY : normalHongbaoY);
      setCardOffset(newState ? normalCardOffset - hongbaoMoveDelta : normalCardOffset);
      return newState;
    });
  }, [step, fullOutHongbaoY, normalHongbaoY, normalCardOffset]);

  // 重新开始（新的惊喜）- 直接从粒子汇聚开始
  const handleReset = useCallback(async () => {
    // 先重置状态
    stopConvergeParticles();
    setIsOpen(false);
    setShaking(false);
    setGlowing(false);
    setCardVisible(false);
    setCardOffset(0);
    setHongbaoY(0);
    setCardImage('');
    setSize(200);
    setError(null);
    setCardFullyOut(false);
    
    // 等待状态更新完成
    await new Promise(r => setTimeout(r, 50));
    
    // 开始新的动画
    handleStart();
  }, [stopConvergeParticles, handleStart]);

  // 保存图片 - 用 canvas 合成完整图片
  const handleSave = useCallback(async () => {
    if (!cardImage) return;
    
    try {
      // 加载原图
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = cardImage;
      });
      
      // 加载页脚图片
      const footerImg = new Image();
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve;
        footerImg.onerror = reject;
        footerImg.src = '/backgrounds/ecnu-name.png';
      });
      
      // 按比例计算尺寸（基于 360px 宽度下的尺寸）
      const scale = img.width / 360;
      const footerHeight = Math.round(36 * scale);
      // 二维码放在页脚内，不凸出
      const qrSize = Math.round(32 * scale);
      const qrBoxSize = footerHeight;  // 和页脚一样高
      const padding = Math.round(12 * scale);
      
      const canvasWidth = img.width;
      const canvasHeight = img.height;  // 不延长，叠加在图片上
      
      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d')!;
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 绘制页脚背景（深红半透明，叠加在图片底部）
      const footerY = canvasHeight - footerHeight;
      const gradient = ctx.createLinearGradient(0, footerY, 0, canvasHeight);
      gradient.addColorStop(0, 'rgba(139, 26, 26, 0.85)');
      gradient.addColorStop(1, 'rgba(107, 21, 21, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, footerY, canvasWidth, footerHeight);
      
      // 二维码位置（在页脚右侧）
      const qrX = canvasWidth - qrBoxSize;
      const qrY = footerY;  // 和页脚顶部对齐
      
      // 绘制页脚文字图片（居左）
      const footerImgHeight = Math.round(24 * scale);
      const footerImgWidth = footerImg.width * (footerImgHeight / footerImg.height);
      const footerImgY = footerY + (footerHeight - footerImgHeight) / 2;
      ctx.drawImage(footerImg, padding, footerImgY, footerImgWidth, footerImgHeight);
      
      // 生成圆点风格二维码
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const qrCode = new QRCodeStyling({
        width: qrSize,
        height: qrSize,
        data: QR_CODE_URL,
        type: 'canvas',
        dotsOptions: {
          color: '#f4d03f',
          type: 'dots',
        },
        backgroundOptions: {
          color: 'transparent',
        },
        cornersSquareOptions: {
          type: 'dot',
        },
        cornersDotOptions: {
          type: 'dot',
        },
      });
      
      qrCode.append(tempDiv);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 获取二维码 canvas，居中放置在页脚右侧
      const qrCanvas = tempDiv.querySelector('canvas');
      if (qrCanvas) {
        const qrDrawX = qrX + (qrBoxSize - qrSize) / 2;
        const qrDrawY = qrY + (qrBoxSize - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrDrawX, qrDrawY, qrSize, qrSize);
      }
      tempDiv.remove();
      
      // 绘制 "AI生成" 胶囊标签（图片左上角）
      const fontSize = Math.round(10 * scale);
      const labelPaddingH = Math.round(8 * scale);
      const labelPaddingV = Math.round(3 * scale);
      const labelText = 'AI生成';
      ctx.font = `${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(labelText).width;
      const labelWidth = textWidth + labelPaddingH * 2;
      const labelHeight = fontSize + labelPaddingV * 2;
      const labelX = Math.round(8 * scale);
      const labelY = Math.round(8 * scale);
      const labelRadius = Math.round(10 * scale);
      
      // 绘制胶囊背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelWidth, labelHeight, labelRadius);
      ctx.fill();
      
      // 绘制文字
      ctx.fillStyle = 'rgba(180, 60, 60, 0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, labelX + labelPaddingH, labelY + labelPaddingV + fontSize * 0.85);
      
      // 转为图片并显示预览
      const dataUrl = canvas.toDataURL('image/png', 1);
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error('合成图片失败:', err);
      alert('合成图片失败，请重试');
    }
  }, [cardImage]);

  const isAnimating = step !== 'home';

  return (
    <div className="blindbox-page">
      {/* 礼花 canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />
      
      {/* 背景 */}
      <div className="blindbox-bg">
        <img className="cloud cloud-1" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-2" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-3" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-4" src="/backgrounds/cloud-small.png" alt="" />
        {/* 背景烟花 */}
        {particlesReady && (
          <Particles
            id="fireworks"
            className="fireworks-bg"
            options={fireworksOptions}
          />
        )}
      </div>

      {/* 首页 */}
      {step === 'home' && (
        <div className="page page-home">
          <h1 className="title">贺年卡</h1>
          <div className="hongbao-wrapper" onClick={handleStart}>
            {/* 首页少量粒子效果 */}
            {particlesReady && (
              <Particles
                id="home-particles"
                className="home-particles"
                options={homeParticlesOptions}
              />
            )}
            <Hongbao size={200} />
          </div>
          <button className="btn-primary" onClick={handleStart}>
            装入新年祝福
          </button>
        </div>
      )}

      {/* 动画进行中 */}
      {isAnimating && (
        <div className="page page-loading">
          {/* 粒子容器 - 在红包上层 */}
          <div ref={particlesRef} className="particles-container" />
          <div 
            className="hongbao-animated"
            style={{ transform: `translateY(${hongbaoY}px)` }}
          >
            <Hongbao
              size={size}
              isOpen={isOpen}
              shaking={shaking}
              glowing={glowing}
              cardImage={cardImage}
              cardVisible={cardVisible}
              cardOffset={cardOffset}
              transitionDuration={400}
              onCardClick={step === 'result' ? toggleCardFullyOut : undefined}
              cardMaxHeight={step === 'result' ? undefined : size * 1.4 * 0.9 - cardOffset}
            />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {/* 结果页按钮 - 完全弹出模式下隐藏 */}
      {step === 'result' && !cardFullyOut && (
        <div className="result-buttons">
          <button className="btn-primary" onClick={handleSave}>保存图片</button>
          <button className="btn-secondary" onClick={handleReset}>新的惊喜</button>
        </div>
      )}

      {/* 全屏预览 - 方便长按保存 */}
      {previewImage && (
        <div className="preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="贺年卡" />
            <p className="preview-tip">长按图片保存到相册</p>
            <button className="preview-close" onClick={() => setPreviewImage(null)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

