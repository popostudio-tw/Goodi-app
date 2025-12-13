// src/pages/ParentModePage.tsx

import React, { useMemo, useState } from 'react';
import { ParentView, ZhuyinMode, JournalEntry } from '../types';
import { useUserData } from '../UserContext';

interface ParentModePageProps {
  onExit: () => void;
  // 這兩個是從 AppContent 傳進來的，可選，沒有傳就用目前 userData 裡的值
  currentZhuyinMode?: ZhuyinMode;
  onSetZhuyinMode?: (mode: ZhuyinMode) => void;
}

const ParentModePage: React.FC<ParentModePageProps> = ({
  onExit,
  currentZhuyinMode,
  onSetZhuyinMode,
}) => {
  const { userData } = useUserData();
  const [view, setView] = useState<ParentView>('dashboard');

  if (!userData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>讀取家長資料中…</p>
      </div>
    );
  }

  const { userProfile, journalEntries, zhuyinMode: storedZhuyinMode } = userData;

  const effectiveZhuyinMode: ZhuyinMode =
    currentZhuyinMode ?? storedZhuyinMode ?? 'auto';

  // 只抓「孩子發表」的訊息，最多 5 則
  const childMessages = useMemo(() => {
    const list = (journalEntries ?? []).filter(
      (e: JournalEntry) => e.author === 'user'
    );
    return list.slice(-5).reverse();
  }, [journalEntries]);

  const handleZhuyinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as ZhuyinMode;
    if (onSetZhuyinMode) {
      onSetZhuyinMode(mode);
    }
  };

  const renderTabContent = () => {
    if (view === 'dashboard') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* 左側：理念 / 訊息 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 教育理念卡片 */}
            <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-6 shadow-md relative backdrop-blur-sm">
              <h3 className="font-bold text-xl text-blue-800 mb-3">
                歡迎來到 Goodi 家長中心！
              </h3>
              <div className="space-y-3 text-sm text-blue-900/80 leading-relaxed">
                <p>
                  我們的核心理念，是幫助孩子透過有趣又有結構的方式，學習自我管理，
                  並在過程中培養自信與責任感。孩子本來就有成長的能力，只是需要一套好用的工具。
                </p>
                <p>在 Goodi，我們特別在意幾件事：</p>
                <ul className="list-disc list-inside space-y-2 pl-1">
                  <li>
                    <strong className="font-semibold">專注成長，堅持無廣告：</strong>
                    介面乾淨、不打擾孩子，讓注意力留在學習與生活上，而不是各種彈跳視窗。
                  </li>
                  <li>
                    <strong className="font-semibold">
                      家是一起生活的空間，不只是「幫忙」：
                    </strong>
                    在任務設計上，我們盡量避免「幫忙做家事」這種說法，
                    而是強調「一起完成」、「共同負責」，讓孩子感覺自己是家裡的一份子。
                  </li>
                  <li>
                    <strong className="font-semibold">
                      情緒比表現更重要：
                    </strong>
                    分數、進度固然重要，但我們更在乎孩子對自己的看法。
                    因此整個系統盡量用鼓勵、正向語氣，而不是只看成績好不好。
                  </li>
                </ul>
                <p>
                  我們希望，每位使用 Goodi 的家長，都能在這裡看見孩子成長的軌跡，
                  並且更輕鬆地陪伴他們練習自律、管理時間，和說出自己的感受。
                </p>
              </div>
            </div>

            {/* 孩子分享的訊息 */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-800">
                  孩子分享的訊息
                </h3>
              </div>
              {childMessages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  孩子還沒有分享任何心事喔！
                </p>
              ) : (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {childMessages.map((entry) => (
                    <li
                      key={entry.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <p className="text-sm text-slate-800 whitespace-pre-line">
                        {entry.content}
                      </p>
                      <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>
                          {entry.date} · {entry.category || '一般'}
                        </span>
                        {entry.mood && (
                          <span className="inline-flex items-center gap-1">
                            <span>{entry.mood}</span>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 右側：孩子資料 / 設定 */}
          <div className="space-y-4">
            {/* 孩子資料 */}
            <div className="bg-white/95 border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-base text-slate-800 mb-3">
                孩子資料
              </h3>
              <dl className="text-sm text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <dt className="text-slate-500">暱稱：</dt>
                  <dd className="font-semibold">
                    {userProfile?.nickname || '尚未設定'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">年齡：</dt>
                  <dd className="font-semibold">
                    {userProfile?.age ? `${userProfile.age} 歲` : '尚未填寫'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">目前方案：</dt>
                  <dd className="font-semibold">
                    {userProfile?.planLabel || 'Free'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 注音模式設定 */}
            <div className="bg-white/95 border border-indigo-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-base text-slate-800 mb-2">
                注音模式設定
              </h3>
              {onSetZhuyinMode ? (
                <>
                  <p className="text-xs text-slate-500 mb-3">
                    可依照孩子的熟悉程度，調整是否顯示注音提示。
                    「自動」會由系統依照年齡與使用情況做建議。
                  </p>
                  <select
                    value={effectiveZhuyinMode}
                    onChange={handleZhuyinChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                  >
                    <option value="auto">自動（系統判斷）</option>
                    <option value="show">顯示注音</option>
                    <option value="hide">隱藏注音</option>
                  </select>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  目前注音模式：
                  <span className="font-semibold ml-1">
                    {effectiveZhuyinMode === 'auto'
                      ? '自動'
                      : effectiveZhuyinMode === 'show'
                      ? '顯示注音'
                      : '隱藏注音'}
                  </span>
                </p>
              )}
            </div>

            {/* 系統提醒 */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              <div className="font-bold mb-1">小提醒</div>
              <p className="leading-relaxed">
                Goodi 仍在測試階段，建議您偶爾截圖或記錄孩子的重要成果，
                以防資料異常時還有備份可以保留唷。
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 其他父母分頁：先放簡單說明，之後再慢慢擴充
    if (view === 'tasks') {
      return (
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm text-sm text-slate-700">
          <p className="mb-2 font-semibold">任務管理</p>
          <p>
            後續會在這裡提供「批次調整任務、開關任務、調整積分」等進階功能。
            目前請先在主畫面的「每日任務」區塊直接操作即可。
          </p>
        </div>
      );
    }

    if (view === 'gachapon') {
      return (
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm text-sm text-slate-700">
          <p className="mb-2 font-semibold">扭蛋與獎勵設定</p>
          <p>
            之後會在這裡集中設定扭蛋機內容、實體獎勵兌換規則等。
            目前可先在「扭蛋」頁面體驗基本功能。
          </p>
        </div>
      );
    }

    if (view === 'rewards') {
      return (
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm text-sm text-slate-700">
          <p className="mb-2 font-semibold">成就與紀錄</p>
          <p>
            未來會在這裡整理孩子長期的成就與重大事件，例如完成幾次連續任務、
            特別努力的月份等等。目前可先透過主畫面的卡片查看簡易資訊。
          </p>
        </div>
      );
    }

    return null;
  };

  const parentTabs: { id: ParentView; label: string; icon: string }[] = [
    { id: 'dashboard', label: '主控台', icon: 'https://api.iconify.design/solar/home-2-bold.svg' },
    { id: 'tasks', label: '任務', icon: 'https://api.iconify.design/solar/checklist-minimalistic-bold.svg' },
    { id: 'gachapon', label: '扭蛋', icon: 'https://api.iconify.design/solar/gift-bold.svg' },
    { id: 'rewards', label: '獎勵', icon: 'https://api.iconify.design/solar/cup-star-bold.svg' },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 上方標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">
            家長管理中心
          </h1>
          <p className="text-sm text-slate-500">
            這裡是專門給家長使用的後台頁面，可以看到孩子的整體狀況，也能調整一些系統設定。
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          返回主畫面
        </button>
      </div>

      {/* 內部導覽列 */}
      <div className="flex flex-wrap gap-2 bg-white/70 border border-white/60 rounded-2xl p-2 shadow-sm">
        {parentTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <img src={tab.icon} alt="" className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 主內容 */}
      <div className="flex-1 overflow-y-auto pr-1 pb-2 rounded-2xl">
        {renderTabContent()}
      </div>
    </div>
  );
};

export { ParentModePage };
export default ParentModePage;
