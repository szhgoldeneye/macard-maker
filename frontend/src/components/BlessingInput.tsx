import { useState } from 'react';
import { useCardStore } from '../store/cardStore';
import { generateText } from '../services/api';

export function BlessingInput() {
  const {
    blessingText,
    setBlessingText,
    isGeneratingText,
    setIsGeneratingText,
  } = useCardStore();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGeneratingText(true);
    setError(null);
    try {
      const response = await generateText();
      setBlessingText(response.text);
    } catch (err) {
      setError('生成失败，请重试');
      console.error('生成祝福语失败:', err);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleClear = () => {
    setBlessingText('');
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">祝福语 / 寄语</h3>
      
      <textarea
        value={blessingText}
        onChange={(e) => setBlessingText(e.target.value)}
        placeholder="输入祝福语..."
        className="w-full h-28 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-gray-700 text-sm leading-relaxed"
      />
      
      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleGenerate}
          disabled={isGeneratingText}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-gold-500 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {isGeneratingText ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              自动生成
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          清空
        </button>
      </div>
    </div>
  );
}
