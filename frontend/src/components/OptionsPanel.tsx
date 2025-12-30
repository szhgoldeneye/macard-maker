import { useCardStore } from '../store/cardStore';
import type { CardOrientation, AspectRatio } from '../types';

export function OptionsPanel() {
  const {
    config,
    setOrientation,
    setAspectRatio,
    setShowBorder,
    setShowLogo,
    setShowQrCode,
  } = useCardStore();

  const orientations: { value: CardOrientation; label: string }[] = [
    { value: 'horizontal', label: '横版' },
    { value: 'vertical', label: '竖版' },
  ];

  const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '1:1', label: '1:1' },
  ];

  // 根据方向获取图标样式
  const getOrientationIcon = (orientation: CardOrientation) => {
    if (orientation === 'horizontal') {
      return (
        <svg className="w-5 h-4" viewBox="0 0 20 14" fill="currentColor">
          <rect x="0" y="0" width="20" height="14" rx="2" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-5" viewBox="0 0 14 20" fill="currentColor">
        <rect x="0" y="0" width="14" height="20" rx="2" />
      </svg>
    );
  };

  // 根据宽高比和方向计算图标尺寸
  const getAspectRatioStyle = (ratio: AspectRatio) => {
    const [w, h] = ratio.split(':').map(Number);
    const baseSize = 24;
    
    if (config.orientation === 'horizontal') {
      // 横版：宽 > 高
      const width = baseSize;
      const height = Math.round((baseSize * h) / w);
      return { width, height };
    } else {
      // 竖版：高 > 宽
      const height = baseSize;
      const width = Math.round((baseSize * h) / w);
      return { width, height };
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary-100">
      {/* 方向选择 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">方向</h3>
        <div className="flex gap-2">
          {orientations.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setOrientation(value)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                config.orientation === value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getOrientationIcon(value)}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 宽高比选择 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">宽高比</h3>
        <div className="flex flex-col gap-2">
          {aspectRatios.map(({ value, label }) => {
            const iconStyle = getAspectRatioStyle(value);
            return (
              <button
                key={value}
                onClick={() => setAspectRatio(value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  config.aspectRatio === value
                    ? 'bg-primary-50 border-2 border-primary-500 text-primary-700'
                    : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-6 flex items-center justify-center">
                  <div
                    className={`rounded border-2 ${
                      config.aspectRatio === value
                        ? 'border-primary-500 bg-primary-100'
                        : 'border-gray-300 bg-gray-200'
                    }`}
                    style={{
                      width: iconStyle.width,
                      height: iconStyle.height,
                    }}
                  />
                </div>
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 显示开关 */}
      <div className="space-y-4">
        <ToggleSwitch
          label="相纸边框"
          checked={config.showBorder}
          onChange={setShowBorder}
        />
        <ToggleSwitch
          label="学校标志"
          checked={config.showLogo}
          onChange={setShowLogo}
        />
        <ToggleSwitch
          label="分享码"
          checked={config.showQrCode}
          onChange={setShowQrCode}
        />
      </div>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
