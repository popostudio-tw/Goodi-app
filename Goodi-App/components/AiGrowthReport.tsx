
import React, { useState, useEffect } from 'react';
import { useUserData } from '../UserContext';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Helper: 取得週次 key（例如 2024-W51）
function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

const Modal: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}> = ({ children, onClose, title }) => (
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-6 max-w-lg w-full transform transition-all animate-fade-in scale-95"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-700">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-2xl leading-none"
        >
          &times;
        </button>
      </div>
      {children}
    </div>
  </div>
);

const AiGrowthReport: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userData } = useUserData();
  const { currentUser } = useAuth();
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 理论上这里只会在登入后被打开，但为了安全多一道保护
  if (!userData || !currentUser) {
    return (
      <Modal onClose={onClose} title="Goodi 成長報告">
        <div className="p-6 text-center text-gray-600">
          資料尚未載入完成，請稍後再試。
        </div>
      </Modal>
    );
  }

  const { userProfile } = userData;

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);

      try {
        // 1. 取得本週週次 key
        const weekKey = getWeekKey();

        // 2. 優先從 Firestore 讀取快取
        const reportDoc = await getDoc(
          doc(db, 'users', currentUser.uid, 'weeklyReports', weekKey)
        );

        if (reportDoc.exists()) {
          const data = reportDoc.data();
          setReport(data.content || '');
          setIsLoading(false);
          return;
        }

        // 3. 若無快取，顯示提示（不再即時生成，節省 API）
        setReport('📅 本週成長報告尚未生成\n\n報告會在每週六凌晨自動生成，屆時您登入即可查看！\n\n在等待的同時，繼續陪伴孩子一起成長吧！🌟');
        setIsLoading(false);

      } catch (error) {
        console.error('AI Growth Report fetch failed:', error);
        setReport('抱歉，讀取報告時發生錯誤。請稍後再試。');
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [currentUser.uid]);

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-800">$1</strong>')
      .replace(/^- (.*$)/gm, '<li class="list-disc ml-4">$1</li>')
      .replace(/<\/li><br \/>/g, '</li>')
      .replace(/\n/g, '<br />');

    return (
      <div
        className="prose prose-sm max-w-none space-y-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <Modal onClose={onClose} title={`${userProfile.nickname} 的 AI 成長報告`}>
      <div className="max-h-[60vh] overflow-y-auto pr-2 text-base leading-relaxed text-gray-600 custom-scrollbar">
        {isLoading ? (
          <div className="text-center p-8">
            <img
              src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
              alt="Loading..."
              className="w-16 h-16 mx-auto animate-bounce"
            />
            <p className="mt-4 font-semibold text-gray-600">
              Goodi 正在讀取報告...
            </p>
          </div>
        ) : (
          renderMarkdown(report)
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          關閉
        </button>
      </div>
    </Modal>
  );
};

export default AiGrowthReport;
