import React, { useState, useEffect, useMemo } from 'react';
import { useUserData } from '../UserContext';
import { callGemini } from '../src/services/aiClient';
import { ScoreEntry, Transaction, JournalEntry, Task } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../AuthContext';

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
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
    >
        <div
            className="bg-[#FFFDF5] border border-white/50 rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-2xl w-full transform transition-all animate-in fade-in zoom-in duration-300 relative"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100/50 rounded-2xl flex items-center justify-center shadow-inner">
                        <img
                            src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
                            alt="Goodi"
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
                        <p className="text-sm font-medium text-slate-500">本週成長足跡與觀察報告</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="bg-white/50 hover:bg-white/80 transition-all w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 text-2xl shadow-sm border border-white"
                >
                    &times;
                </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar space-y-8" id="report-content">
                {children}
            </div>
        </div>
    </div>
);

const WeeklyReport: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userData } = useUserData();
    const { currentUser } = useAuth();
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [cachedStats, setCachedStats] = useState<{ tasksCompleted: number; scoresReported: number; journalEntries: number } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportExists, setReportExists] = useState(false);

    if (!userData || !currentUser) return null;

    const { nickname } = userData.userProfile;

    // 計算本地統計數據（用於顯示，但不影響快取讀取）
    const stats = useMemo(() => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        const weeklyTasks = userData.transactions.filter(t =>
            t.timestamp >= sevenDaysAgo && t.description.startsWith('完成任務')
        );

        const weeklyScores = userData.scoreHistory.filter(s =>
            new Date(s.date).getTime() >= sevenDaysAgo
        );

        const weeklyJournals = userData.journalEntries.filter(j =>
            j.author === 'user' && new Date(j.date).getTime() >= sevenDaysAgo
        );

        return { weeklyTasks, weeklyScores, weeklyJournals };
    }, [userData]);

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
                    if (data.stats) {
                        setCachedStats(data.stats);
                    }
                    setReportExists(true);
                    setIsLoading(false);
                    return;
                }

                setReportExists(false);

                // 3. 若無快取，顯示提示
                setReport('');
                setIsLoading(false);

            } catch (error) {
                console.error("Weekly Report fetch failed", error);
                setReport('抱歉，讀取週報時發生錯誤。請稍後再試。');
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [currentUser.uid]);

    // 手動觸發週報生成
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const triggerReport = httpsCallable(functions, 'triggerWeeklyReport');
            await triggerReport({});

            // 重新讀取報告
            const weekKey = getWeekKey();
            const reportDoc = await getDoc(
                doc(db, 'users', currentUser.uid, 'weeklyReports', weekKey)
            );

            if (reportDoc.exists()) {
                const data = reportDoc.data();
                setReport(data.content || '');
                if (data.stats) {
                    setCachedStats(data.stats);
                }
                setReportExists(true);
            }
        } catch (error) {
            console.error("Manual report generation failed", error);
            setReport('抱歉，生成週報時發生錯誤。請稍後再試。');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('report-content');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#FFFDF5',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('report-content');
                    if (el) {
                        el.style.maxHeight = 'none';
                        el.style.overflow = 'visible';
                        el.style.padding = '40px';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`Goodi_週報_${nickname}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        } catch (error) {
            console.error('PDF export failed', error);
            alert('PDF 匯出失敗，請稍後再試。');
        } finally {
            setIsExporting(false);
        }
    };

    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const processBold = (input: string) => {
            const parts = input.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-black text-slate-800">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        return (
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-noto">
                {text.split('\n').map((line, i) => {
                    if (line.startsWith('###')) {
                        return (
                            <h3 key={i} className="text-xl font-black text-green-700 mt-8 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-sm"></span>
                                {processBold(line.replace('###', '').trim())}
                            </h3>
                        );
                    }
                    if (line.startsWith('-')) {
                        return (
                            <div key={i} className="flex gap-2 mb-2 ml-2">
                                <span className="text-green-500 font-bold">•</span>
                                <span className="flex-1">{processBold(line.replace('-', '').trim())}</span>
                            </div>
                        );
                    }
                    if (line.trim() === '') return <div key={i} className="h-2" />;
                    return <p key={i} className="mb-4 text-slate-600 font-medium">{processBold(line)}</p>;
                })}
            </div>
        );
    };

    return (
        <Modal onClose={onClose} title={`${nickname} 的精彩週報`}>
            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-5 rounded-[2rem] shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-2 text-2xl">🌟</div>
                    <span className="text-3xl font-black text-green-700">{cachedStats?.tasksCompleted ?? stats.weeklyTasks.length}</span>
                    <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest">任務達成</span>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-[2rem] shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-2 text-2xl">📈</div>
                    <span className="text-3xl font-black text-blue-700">{cachedStats?.scoresReported ?? stats.weeklyScores.length}</span>
                    <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">成績進步</span>
                </div>
                <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-[2rem] shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-2 text-2xl">🌱</div>
                    <span className="text-3xl font-black text-amber-700">{cachedStats?.journalEntries ?? stats.weeklyJournals.length}</span>
                    <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">心情點滴</span>
                </div>
            </div>

            <div className="bg-white/80 rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/50 min-h-[400px]">
                {isLoading || isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <img
                            src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
                            alt="Goodi"
                            className="w-20 h-20 object-contain animate-bounce mb-6 opacity-80"
                        />
                        <div className="flex gap-2 mb-4">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-150"></div>
                        </div>
                        <p className="text-slate-500 font-bold max-w-xs leading-relaxed">
                            {isGenerating ? 'Goodi 正在為您撰寫週報...' : `Goodi 正在用心回憶 ${nickname} 本週每一個精彩的瞬間...`}
                        </p>
                    </div>
                ) : !reportExists ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <img
                            src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
                            alt="Goodi"
                            className="w-24 h-24 object-contain mb-6 opacity-70"
                        />
                        <h3 className="text-xl font-black text-slate-700 mb-3">📅 本週報告尚未生成</h3>
                        <p className="text-slate-500 mb-6 max-w-sm leading-relaxed">
                            週報會在每週六凌晨自動生成，<br />
                            屆時您登入即可查看！🌟<br />
                            <span className="text-xs text-slate-400 mt-2 block">在等待的同時，繼續陪伴孩子一起成長吧！</span>
                        </p>
                    </div>
                ) : (
                    renderMarkdown(report)
                )}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 pb-6">
                <button
                    onClick={onClose}
                    className="px-16 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-black text-lg shadow-xl shadow-green-200 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 border-b-4 border-green-800/20"
                >
                    <span>收下這份喜悅</span>
                    <span className="text-2xl">🦖</span>
                </button>
                {report && (
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="text-slate-400 hover:text-blue-500 font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        {isExporting ? '檔案準備中...' : '下載 PDF 報告永久收藏'}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default WeeklyReport;
