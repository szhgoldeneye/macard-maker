import { useEffect, useState } from 'react';
import { useCardStore } from '../store/cardStore';
import { getHistory, deleteHistoryItem } from '../services/api';

export function HistoryPanel() {
  const { history, setHistory, removeHistoryItem, token } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 加载历史记录
  useEffect(() => {
    if (!token) return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const response = await getHistory();
        setHistory(response.items);
      } catch (err) {
        console.error('加载历史记录失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [token, setHistory]);

  // 删除历史记录
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      await deleteHistoryItem(id);
      removeHistoryItem(id);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 下载
  const handleDownload = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `贺卡_${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  if (!token) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-primary-100">
        <p className="text-center text-gray-500 text-sm py-4">登录后查看历史记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-primary-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">历史记录</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">暂无历史记录</p>
      ) : (
        <div className="relative">
          {/* 横向滚动容器 */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-transparent">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                className={`relative flex-shrink-0 w-24 cursor-pointer group transition-transform hover:scale-105 ${
                  selectedId === item.id ? 'ring-2 ring-primary-500 rounded-lg' : ''
                }`}
              >
                {/* 缩略图 */}
                <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt="历史贺卡"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 悬浮操作按钮 */}
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleDownload(item.image_url, e)}
                    className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="下载"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 bg-white/90 rounded-full hover:bg-red-100 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* 时间标签 */}
                <p className="text-xs text-gray-400 mt-1 text-center truncate">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* 滚动指示器 */}
          {history.length > 4 && (
            <div className="absolute right-0 top-0 bottom-8 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none" />
          )}
        </div>
      )}

      {/* 大图预览 */}
      {selectedId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setSelectedId(null)}
        >
          <div className="max-w-2xl max-h-[80vh] p-4">
            <img
              src={history.find((h) => h.id === selectedId)?.image_url}
              alt="大图预览"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

