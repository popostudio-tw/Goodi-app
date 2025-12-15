
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Plan, ScoreEntry, ParentView, GachaponPrize, UserProfile, Subject, TestType, Reward, KeyEvent } from '../types';
import PlanSelector from '../components/PlanSelector';
import SharedMessages from '../components/SharedMessages';
import PaymentModal from '../components/PaymentModal';
import ParentWishes from '../components/ParentWishes';
import ScoreChart from '../components/ScoreChart';
import { GoogleGenAI, Type } from "@google/genai";
import { FirebaseGenAI } from '../services/firebaseAI';
import AiGrowthReport from '../components/AiGrowthReport';
import { useUserData, commonTasksData } from '../UserContext';
import LegalModal from '../components/LegalModal';
import { checkAiUsageLimit, recordAiUsage, AI_USAGE_CONFIGS, getRemainingUses } from '../utils/aiUsageLimits';

const ICON_LIST = [
  'https://api.iconify.design/twemoji/toothbrush.svg',
  'https://api.iconify.design/twemoji/bed.svg',
  'https://api.iconify.design/twemoji/t-shirt.svg',
  'https://api.iconify.design/twemoji/broom.svg',
  'https://api.iconify.design/twemoji/soap.svg',
  'https://api.iconify.design/twemoji/basket.svg',
  'https://api.iconify.design/twemoji/books.svg',
  'https://api.iconify.design/twemoji/pencil.svg',
  'https://api.iconify.design/twemoji/open-book.svg',
  'https://api.iconify.design/twemoji/green-apple.svg',
  'https://api.iconify.design/twemoji/bicycle.svg',
  'https://api.iconify.design/twemoji/musical-note.svg',
  'https://api.iconify.design/twemoji/artist-palette.svg',
  'https://api.iconify.design/twemoji/dog-face.svg',
  'https://api.iconify.design/twemoji/seedling.svg',
  'https://api.iconify.design/twemoji/game-die.svg',
  'https://api.iconify.design/twemoji/speaking-head.svg',
  'https://api.iconify.design/twemoji/light-bulb.svg',
  'https://api.iconify.design/twemoji/recycling-symbol.svg',
  'https://api.iconify.design/twemoji/alarm-clock.svg',
  'https://api.iconify.design/twemoji/cooked-rice.svg',
  'https://api.iconify.design/twemoji/house-with-garden.svg',
  'https://api.iconify.design/twemoji/robot.svg',
  'https://api.iconify.design/twemoji/globe-showing-americas.svg',
];

// --- Reusable Modal Component ---
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; maxWidth?: string }> = ({ children, onClose, title, maxWidth = "max-w-lg" }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 md:pt-20" onClick={onClose}>
    <div
      className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl w-full ${maxWidth} border border-white/50 flex flex-col max-h-[85vh] relative overflow-hidden animate-fade-in scale-100 transition-all`}
      onClick={e => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-100/50 flex-shrink-0 flex justify-between items-center bg-white/40 backdrop-blur-md z-30 relative">
        <h2 className="text-xl font-bold text-slate-700 text-center flex-grow pl-8">{title}</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200/50 transition-colors">
          <img src="https://api.iconify.design/solar/close-circle-bold.svg" className="w-7 h-7 text-gray-500 opacity-60" />
        </button>
      </div>
      <div className="flex flex-col flex-grow min-h-0 relative z-0 p-4 overflow-hidden">
        {children}
      </div>
    </div>
  </div>
);

// --- Icon Picker ---
const IconPicker: React.FC<{ selectedIcon: string; onSelect: (icon: string) => void; }> = ({ selectedIcon, onSelect }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-600 mb-2">選擇圖示</h4>
    <div className="grid grid-cols-6 md:grid-cols-8 gap-2 bg-white/50 p-2 rounded-lg border border-white/50 backdrop-blur-sm">
      {ICON_LIST.map(icon => (
        <button
          key={icon}
          type="button"
          onClick={() => onSelect(icon)}
          className={`p-1.5 rounded-md flex items-center justify-center transition-all ${selectedIcon === icon ? 'bg-blue-500 ring-2 ring-white shadow-md' : 'hover:bg-white/60'}`}
        >
          <img src={icon} alt="" className="w-8 h-8" />
        </button>
      ))}
    </div>
  </div>
);

// --- New AI Task Suggestion Modal ---
const AiTaskSuggestModal: React.FC<{
  ai: GoogleGenAI;
  userAge: number | null;
  existingTasks: Task[];
  onClose: () => void;
  onImport: (tasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
}> = ({ ai, userAge, existingTasks, onClose, onImport }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTasks, setSuggestedTasks] = useState<Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!userAge) {
        setError("無法獲取孩子年齡，請先設定。");
        setIsLoading(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const cacheKey = `aiTaskSuggestCache_${userAge}_v3`; // Updated cache key for 5 tasks
      const cachedDataRaw = localStorage.getItem(cacheKey);

      if (cachedDataRaw) {
        try {
          const cachedData = JSON.parse(cachedDataRaw);
          if (cachedData.date === todayStr && Array.isArray(cachedData.suggestions)) {
            setSuggestedTasks(cachedData.suggestions);
            setIsLoading(false);
            return; // Use cached data
          }
        } catch (e) {
          console.error("Failed to parse AI suggestion cache", e);
        }
      }

      try {
        const schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "任務的名稱" },
              points: { type: Type.NUMBER, description: "獎勵積分 (1-3分)" },
              category: { type: Type.STRING, description: "任務類別 ('生活', '家務', '學習')" },
              icon: { type: Type.STRING, description: `從提供的列表中選擇一個最適合的圖示 URL: ${ICON_LIST.slice(0, 5).join(', ')}...` },
              description: { type: Type.STRING, description: "給孩子的簡短鼓勵描述" },
            },
            required: ['text', 'points', 'category', 'icon', 'description']
          }
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `你是一位兒童發展專家。請為一位 ${userAge} 歲的孩子，推薦 5 個適合他/她年齡的、鼓勵積極主動與責任感的任務。任務類別必須是 '生活', '家務', 或 '學習'。任務的 'icon' 欄位必須從以下列表中選擇一個最符合的 URL: [${ICON_LIST.join(', ')}]。請確保任務名稱是獨一無二的。`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const parsedTasks = JSON.parse(response.text);
        setSuggestedTasks(parsedTasks);
        localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, suggestions: parsedTasks }));
      } catch (err) {
        console.error("AI suggestion error:", err);
        setError("無法獲取 AI 建議，請稍後再試。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [userAge, ai]);

  const filteredSuggestedTasks = useMemo(() => {
    const existingTaskTexts = new Set(existingTasks.map(t => t.text));
    return suggestedTasks.filter(task => !existingTaskTexts.has(task.text));
  }, [suggestedTasks, existingTasks]);

  const handleToggleSelect = (taskText: string) => {
    const originalIndex = suggestedTasks.findIndex(t => t.text === taskText);
    if (originalIndex === -1) return;

    setSelectedTasks(prev =>
      prev.includes(originalIndex) ? prev.filter(i => i !== originalIndex) : [...prev, originalIndex]
    );
  };

  const handleImport = () => {
    const tasksToImport = selectedTasks.map(index => suggestedTasks[index]);
    onImport(tasksToImport);
    onClose();
  };

  const categoryColor = (category: Task['category']) => {
    switch (category) {
      case '生活': return 'bg-blue-500';
      case '家務': return 'bg-green-500';
      case '學習': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }

  return (
    <Modal onClose={onClose} title={`AI 任務建議 (${userAge}歲)`} maxWidth="max-w-2xl">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar min-h-0 space-y-4 pb-2">
          {isLoading && <div className="text-center p-8">載入建議中...</div>}
          {error && <div className="text-center p-8 text-red-500">{error}</div>}
          {!isLoading && !error && filteredSuggestedTasks.map((task) => {
            const originalIndex = suggestedTasks.findIndex(t => t.text === task.text);
            const isSelected = selectedTasks.includes(originalIndex);
            return (
              <div
                key={task.text}
                onClick={() => handleToggleSelect(task.text)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border backdrop-blur-sm ${isSelected ? 'bg-blue-50/60 border-blue-400' : 'bg-white/40 border-white/50 hover:bg-white/60'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white"
                />
                <img src={task.icon} alt="" className="w-8 h-8 mx-3" />
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{task.text} (+{task.points})</p>
                    <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${categoryColor(task.category)}`}>{task.category}</span>
                  </div>
                  <p className="text-sm text-gray-500">{task.description}</p>
                </div>
              </div>
            );
          })}
          {!isLoading && !error && filteredSuggestedTasks.length === 0 && (
            <div className="text-center p-3 pt-3 text-gray-500">
              <p>太棒了！AI 建議的任務你都已經加進行事曆了！</p>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 pt-3 mt-auto border-t border-gray-200/50 flex-shrink-0 z-10 bg-white/40 backdrop-blur-md rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200/80 rounded-lg font-bold text-gray-700 backdrop-blur-sm hover:bg-gray-300/80">取消</button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selectedTasks.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 font-bold shadow-md hover:bg-blue-600 transition-colors"
          >
            匯入 {selectedTasks.length} 個任務
          </button>
        </div>
      </div>
    </Modal>
  );
};

// --- New AI Goal Task Generator Modal ---
const AiGoalTaskGeneratorModal: React.FC<{
  ai: GoogleGenAI;
  userAge: number | null;
  onClose: () => void;
  onImport: (tasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
}> = ({ ai, userAge, onClose, onImport }) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  const handleGenerate = async () => {
    if (!goal.trim() || !userAge) {
      setError("請輸入目標並確保已設定孩子年齡。");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedTasks([]);
    setSelectedTasks([]);

    try {
      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "任務的名稱" },
            points: { type: Type.NUMBER, description: "獎勵積分 (1-3分)" },
            category: { type: Type.STRING, description: "任務類別 ('生活', '家務', '學習')" },
            icon: { type: Type.STRING, description: `從提供的列表中選擇一個最適合的圖示 URL` },
            description: { type: Type.STRING, description: "給孩子的簡短鼓勵描述" },
          },
          required: ['text', 'points', 'category', 'icon', 'description']
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `作為一名兒童發展專家，請為一位 ${userAge} 歲的孩子，圍繞「${goal}」這個目標，設計 5 個具體、可行的任務。任務類別必須是 '生活', '家務', 或 '學習'。任務的 'icon' 欄位必須從以下列表中選擇最符合的 URL: [${ICON_LIST.join(', ')}]。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      const parsedTasks = JSON.parse(response.text);
      setGeneratedTasks(parsedTasks);
      setSelectedTasks(parsedTasks.map((_: any, index: number) => index)); // Select all by default

    } catch (err) {
      console.error("AI goal generation error:", err);
      setError("無法生成任務，請嘗試更換目標或稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedTasks(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleImport = () => {
    const tasksToImport = selectedTasks.map(index => generatedTasks[index]);
    onImport(tasksToImport);
    onClose();
  };

  return (
    <Modal onClose={onClose} title="AI 智慧任務產生器" maxWidth="max-w-4xl">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 flex-grow min-h-0">
          {/* Left Panel: Input Area & Controls */}
          <div className="flex-shrink-0 md:w-1/3 flex flex-col gap-4 h-full">
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-4">
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                <p className="text-xs text-gray-600 mb-2 leading-relaxed font-medium">
                  想培養孩子什麼能力？<br />
                  輸入目標，AI 幫你設計專屬任務清單！
                </p>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="例如：更有責任感、學會時間管理..."
                    className="w-full p-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 shadow-inner h-20 resize-none transition-all text-sm"
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-2 text-center bg-red-50 p-1.5 rounded-lg">{error}</p>}
              </div>

              <div className="hidden md:flex flex-col items-center justify-center p-4 opacity-60 flex-grow">
                <img src="https://api.iconify.design/twemoji/light-bulb.svg" className="w-12 h-12 mb-2" />
                <p className="text-xs text-gray-500 text-center">提示：越具體的目標，生成的任務越精準喔！</p>
              </div>
            </div>

            {/* Buttons Area - Moved Here */}
            <div className="flex-shrink-0 flex flex-col gap-3 pt-3 border-t border-white/30">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !goal.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <img src="https://api.iconify.design/solar/magic-stick-3-bold.svg" className="w-5 h-5 text-white" style={{ filter: 'brightness(0) invert(1)' }} />
                )}
                <span>{isLoading ? '生成中...' : '開始生成任務'}</span>
              </button>

              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold backdrop-blur-sm transition-colors text-sm">取消</button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedTasks.length === 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl disabled:bg-gray-300 font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:shadow-none text-sm"
                >
                  匯入 {selectedTasks.length > 0 ? `(${selectedTasks.length})` : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: List Area */}
          <div className="flex-grow md:w-2/3 flex flex-col min-h-0 bg-white/30 rounded-2xl border border-white/40 overflow-hidden relative shadow-inner">
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar space-y-2">
              {generatedTasks.length > 0 ? (
                generatedTasks.map((task, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleSelect(index)}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border backdrop-blur-sm ${selectedTasks.includes(index) ? 'bg-blue-50/90 border-blue-400 shadow-sm' : 'bg-white/60 border-white/40 hover:bg-white/80'}`}
                  >
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center mr-3 transition-colors ${selectedTasks.includes(index) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                      {selectedTasks.includes(index) && <img src="https://api.iconify.design/solar/check-bold.svg" className="w-4 h-4 text-white" />}
                    </div>
                    <img src={task.icon} alt="" className="w-10 h-10 mr-3 p-1 bg-white/50 rounded-lg" />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-800 truncate">{task.text}</p>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">+{task.points}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <img src="https://api.iconify.design/twemoji/clipboard.svg" className="w-16 h-16 mb-4 grayscale" />
                  <p className="text-lg font-medium">任務列表將顯示在這裡</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};


// --- Task Form (for Add/Edit) ---
const TaskForm: React.FC<{ task?: Task; onSave: (task: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => void; onCancel: () => void; }> = ({ task, onSave, onCancel }) => {
  const [text, setText] = useState(task?.text || '');
  const [points, setPoints] = useState(task?.points || 2);
  const [category, setCategory] = useState<Task['category']>(task?.category || '生活');
  const [icon, setIcon] = useState(task?.icon || ICON_LIST[0]);
  const [description, setDescription] = useState(task?.description || '');
  const [startDate, setStartDate] = useState(task?.dateRange?.start || '');
  const [endDate, setEndDate] = useState(task?.dateRange?.end || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isSpecialTask = category === '特殊' || category === '每週';

    // Create base task object without initializing dateRange to undefined
    const taskData: any = {
      text,
      points,
      category,
      icon,
      description,
      isSpecial: isSpecialTask,
    };

    if (category === '特殊') {
      if ((startDate && !endDate) || (!startDate && endDate)) {
        alert('請同時設定開始與結束日期，或兩者皆不設定。');
        return;
      }
      if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
          alert('開始日期不能晚於結束日期！');
          return;
        }
        taskData.dateRange = { start: startDate, end: endDate };
      }
    }
    onSave(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <div className="relative">
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="任務名稱" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="任務描述" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="points" className="block text-sm font-medium text-red-500 font-semibold mb-1">分數</label>
            <input id="points" type="number" value={points} onChange={e => setPoints(parseInt(e.target.value))} className="p-2 border border-gray-300 bg-white rounded-lg w-full focus:ring-2 focus:ring-blue-500" required min="1" />
          </div>
          <select id="category" value={category} onChange={e => setCategory(e.target.value as Task['category'])} className="p-2 border border-gray-300 bg-white rounded-lg w-full focus:ring-2 focus:ring-blue-500">
            <option value="生活">生活</option>
            <option value="家務">家務</option>
            <option value="學習">學習</option>
            <option value="每週">每週</option>
            <option value="特殊">特殊</option>
          </select>
        </div>

        {category === '特殊' && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-white/40 rounded-lg border border-white/50 backdrop-blur-sm">
            <div>
              <label className="text-sm font-medium text-gray-600">開始日期 (選填)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">結束日期 (選填)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}

        <IconPicker selectedIcon={icon} onSelect={setIcon} />
      </div>

      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200/50 flex-shrink-0">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200/80 rounded-lg font-bold text-gray-700 backdrop-blur-sm">取消</button>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold shadow-md">儲存</button>
      </div>
    </form>
  );
};

// --- Gachapon Prize Form ---
const GachaponPrizeForm: React.FC<{ prize?: GachaponPrize; onSave: (prize: Omit<GachaponPrize, 'id'>) => void; onCancel: () => void; totalPrizes: number; }> = ({ prize, onSave, onCancel, totalPrizes }) => {
  const [name, setName] = useState(prize?.name || '');
  const [rarity, setRarity] = useState<GachaponPrize['rarity']>(prize?.rarity || '普通');
  const [percentage, setPercentage] = useState(prize?.percentage || (totalPrizes > 0 ? Math.round(100 / (totalPrizes + 1)) : 100));
  const [icon, setIcon] = useState(prize?.icon || ICON_LIST[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, rarity, percentage, icon });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="獎品名稱" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" required />

        <IconPicker selectedIcon={icon} onSelect={setIcon} />

        <div className="grid grid-cols-2 gap-4">
          <select value={rarity} onChange={e => setRarity(e.target.value as GachaponPrize['rarity'])} className="p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="普通">普通</option>
            <option value="稀有">稀有</option>
            <option value="史詩">史詩</option>
            <option value="傳說">傳說</option>
          </select>
          <div className="relative">
            <input type="number" value={percentage} onChange={e => setPercentage(parseInt(e.target.value))} placeholder="百分比" className="w-full p-2 border border-gray-300 bg-white rounded-lg pr-8 focus:ring-2 focus:ring-blue-500" required min="0" max="100" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500">提示：儲存後，系統將自動調整所有獎項的機率總和至 100%。</p>
      </div>
      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200/50 flex-shrink-0">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200/80 rounded-lg font-bold text-gray-700 backdrop-blur-sm">取消</button>
        <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold shadow-md">儲存</button>
      </div>
    </form>
  );
};

const RewardForm: React.FC<{ reward?: Reward; onSave: (reward: Omit<Reward, 'id'>) => void; onCancel: () => void; }> = ({ reward, onSave, onCancel }) => {
  const [name, setName] = useState(reward?.name || '');
  const [description, setDescription] = useState(reward?.description || '');
  const [cost, setCost] = useState(reward?.cost || 10);
  const [icon, setIcon] = useState(reward?.icon || ICON_LIST[0]);
  const [action, setAction] = useState<Reward['action']>(reward?.action || 'add_to_inventory');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, cost, icon, action, costType: 'tokens' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="獎勵名稱" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="獎勵描述" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        <IconPicker selectedIcon={icon} onSelect={setIcon} />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={cost} onChange={e => setCost(parseInt(e.target.value))} placeholder="代幣成本" className="p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" required min="1" />
          <select value={action} onChange={e => setAction(e.target.value as Reward['action'])} className="p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="add_to_inventory">加入背包</option>
            <option value="add_ticket">增加扭蛋券</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200/50 flex-shrink-0">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200/80 rounded-lg font-bold text-gray-700 backdrop-blur-sm">取消</button>
        <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold shadow-md">儲存</button>
      </div>
    </form>
  );
};


const ScoreEditModal: React.FC<{ score: ScoreEntry, onSave: (score: ScoreEntry) => void, onClose: () => void }> = ({ score, onSave, onClose }) => {
  const [currentScore, setCurrentScore] = useState(score);
  const subjects: Subject[] = ['國語', '英語', '數學', '社會', '自然'];
  const testTypes: TestType[] = ['小考', '大考'];

  const handleSave = () => {
    onSave(currentScore);
  }

  return (
    <Modal onClose={onClose} title="編輯成績">
      <div className="space-y-4">
        <input type="date" value={currentScore.date} onChange={e => setCurrentScore(s => ({ ...s, date: e.target.value }))} className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        <select value={currentScore.subject} onChange={e => setCurrentScore(s => ({ ...s, subject: e.target.value as Subject }))} className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500">
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={currentScore.testType} onChange={e => setCurrentScore(s => ({ ...s, testType: e.target.value as TestType }))} className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500">
          {testTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="number" value={currentScore.score} onChange={e => setCurrentScore(s => ({ ...s, score: parseInt(e.target.value, 10) }))} min="0" max="100" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200/80 rounded-lg backdrop-blur-sm">取消</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md">儲存</button>
        </div>
      </div>
    </Modal>
  );
}

const ScoreManagement: React.FC<{ scores: ScoreEntry[], setScores: (scores: ScoreEntry[]) => void }> = ({ scores, setScores }) => {
  const [editingScore, setEditingScore] = useState<ScoreEntry | null>(null);

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除這筆成績嗎？')) {
      setScores(scores.filter(s => s.id !== id));
    }
  };

  const handleSave = (updatedScore: ScoreEntry) => {
    setScores(scores.map(s => s.id === updatedScore.id ? updatedScore : s));
    setEditingScore(null);
  };

  return (
    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
      {editingScore && <ScoreEditModal score={editingScore} onSave={handleSave} onClose={() => setEditingScore(null)} />}
      {scores.map(score => (
        <div key={score.id} className="bg-white/50 backdrop-blur-sm p-3 rounded-lg flex justify-between items-center border border-white/60">
          <div>
            <span className="font-semibold">{new Date(score.date).toLocaleDateString()} - {score.subject} ({score.testType})</span>
            <span className="ml-4 text-lg font-bold">{score.score} 分</span>
          </div>
          <div className="space-x-3">
            <button onClick={() => setEditingScore(score)} className="font-semibold text-blue-600 hover:underline">編輯</button>
            <button onClick={() => handleDelete(score.id)} className="font-semibold text-red-600 hover:underline">刪除</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const UserProfileEditor: React.FC<{ profile: UserProfile; onSave: (profile: UserProfile) => void; }> = ({ profile, onSave }) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [age, setAge] = useState<string>(profile.age?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave({ ...profile, nickname, age: age ? parseInt(age, 10) : null });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNickname(profile.nickname);
    setAge(profile.age?.toString() || '');
  };

  if (!isEditing) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-md p-4 flex flex-col h-full border border-white/40">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">孩子資料</h3>
          <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-white/50 text-gray-700 rounded-lg font-semibold text-sm backdrop-blur-sm border border-white/60 hover:bg-white/80">編輯</button>
        </div>
        <div className="flex-grow space-y-2">
          <p className="text-gray-800"><span className="font-semibold">暱稱：</span>{profile.nickname}</p>
          <p className="text-gray-800"><span className="font-semibold">年齡：</span>{profile.age ? `${profile.age} 歲` : '未設定'}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">AI 任務建議會根據孩子的年齡做推薦喔！</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-md p-4 h-full flex flex-col border border-white/40">
      <h3 className="text-xl font-bold mb-3">編輯孩子資料</h3>
      <div className="space-y-3 flex-grow">
        <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="暱稱" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="年齡" min="1" max="18" className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end space-x-2 mt-3">
        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200/80 rounded-lg backdrop-blur-sm">取消</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md">儲存</button>
      </div>
    </div>
  );
};

const HabitFreezeManager: React.FC<{ frozenDates: string[]; setFrozenDates: (dates: string[]) => void; }> = ({ frozenDates, setFrozenDates }) => {
  const [date, setDate] = useState('');

  const handleAdd = () => {
    if (date && !frozenDates.includes(date)) {
      const newDates = [...frozenDates, date].sort();
      setFrozenDates(newDates);
      setDate('');
    }
  };

  const handleFreezeToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!frozenDates.includes(todayStr)) {
      const newDates = [...frozenDates, todayStr].sort();
      setFrozenDates(newDates);
    }
  };

  const handleRemove = (dateToRemove: string) => {
    setFrozenDates(frozenDates.filter(d => d !== dateToRemove));
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50">
      <h3 className="text-xl font-bold mb-2">習慣凍結日</h3>
      <p className="text-sm text-gray-500 mb-4">若因出遊等特殊狀況無法完成習慣任務，可設定凍結日，當天將不會中斷連續紀錄。</p>
      <div className="flex gap-2 mb-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-grow p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleFreezeToday} className="bg-orange-500 text-white font-semibold px-4 rounded-lg hover:bg-orange-600 shadow-md">凍結今日</button>
        <button onClick={handleAdd} className="bg-blue-500 text-white font-semibold px-4 rounded-lg hover:bg-blue-600 shadow-md">新增</button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
        {frozenDates.map(d => (
          <div key={d} className="bg-white/50 backdrop-blur-sm p-2 rounded-lg flex justify-between items-center text-sm border border-white/60">
            <span>{d}</span>
            <button onClick={() => handleRemove(d)} className="text-red-500 hover:text-red-700 font-bold">X</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const EducationalPhilosophyCard: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-6 shadow-md relative backdrop-blur-sm">
    <h3 className="font-bold text-xl text-blue-800 mb-3">歡迎來到 Goodi 家長中心！</h3>
    <div className="space-y-3 text-sm text-blue-900/80">
      <p>我們的核心理念是幫助孩子透過有趣的方式，學習自我管理，並培養自信與責任感。我們相信，孩子們天生就有成長的潛力，他們只是需要一套好用的「工具」來引導。</p>
      <p>在 Goodi，我們堅持幾個重要的原則：</p>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li><strong className="font-semibold">專注成長，堅持無廣告</strong>：我們承諾提供一個純淨的環境，讓孩子能專心於學習與成長，不受任何廣告干擾。</li>
        <li><strong className="font-semibold">家是共同的空間，不是單方面的責任</strong>：我們認為家務不應只是父母（或特定一方）的義務，而是所有家庭成員共同維護環境的展現。因此，我們避免使用「幫忙」做家事這類字眼，而是強調「共同參與」與「責任共享」，藉此培養孩子的歸屬感與對家庭的責任心。</li>
        <li><strong className="font-semibold">鼓勵自主，而非控制</strong>：Goodi 是一個引導工具，而非監控系統。我們的目標是激發孩子內在的動力，讓他們學會為自己的選擇負責。</li>
        <li><strong className="font-semibold">傾聽比監控更重要</strong>：當您在「心事樹洞」收到孩子的負面情緒警示時，這是一個珍貴的溝通機會。我們鼓勵您放下手機，用真誠的關心去了解孩子的感受。這份信任，是 Goodi 最想為您和孩子建立的橋樑。</li>
      </ul>
      <p className="mt-4 font-medium text-blue-800">我們都是第一次為人父母，在這條與孩子共同成長的路上，願我們都能越來越好。</p>
    </div>
    <button onClick={onDismiss} className="mt-4 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-md">我了解了</button>
  </div>
);

const PointAdjuster: React.FC<{
  currentPoints: number;
  onAdjust: (amount: number, reason: string) => void;
}> = ({ currentPoints, onAdjust }) => {
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');

  const handleAdjust = (multiplier: 1 | -1) => {
    const numAmount = parseInt(amount, 10);
    if (!isNaN(numAmount) && numAmount > 0) {
      onAdjust(numAmount * multiplier, reason);
      setAmount('10');
      setReason('');
    } else {
      alert('請輸入有效的正整數積分！');
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50">
      <h3 className="text-xl font-bold mb-3">手動調整積分</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-gray-600">調整原因 (選填)</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="例如：特別獎勵" className="w-full mt-1 p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">調整積分</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" className="w-full mt-1 p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button onClick={() => handleAdjust(1)} className="w-full bg-green-500 text-white font-semibold py-2.5 rounded-lg hover:bg-green-600 shadow-md">增加積分</button>
        <button onClick={() => handleAdjust(-1)} className="w-full bg-red-500 text-white font-semibold py-2.5 rounded-lg hover:bg-red-600 shadow-md">扣除積分</button>
      </div>
      <p className="text-center text-gray-500 mt-4">目前積分: <span className="text-2xl text-blue-600 font-bold">{currentPoints}</span></p>
    </div>
  );
}

const Dashboard: React.FC<{
  scoreHistory: ScoreEntry[],
  setScoreHistory: (scores: ScoreEntry[]) => void,
  sharedMessages: string[],
  wishes: string[],
  userProfile: UserProfile,
  onUpdateUserProfile: (profile: UserProfile) => void,
  frozenHabitDates: string[],
  setFrozenHabitDates: (dates: string[]) => void,
  onShowAiReport: () => void,
  currentPlan: Plan,
  keyEvents: KeyEvent[];
  onAddKeyEvent: (text: string, date: string) => void;
  onDeleteKeyEvent: (id: number) => void;
}> = ({ scoreHistory, setScoreHistory, sharedMessages, wishes, userProfile, onUpdateUserProfile, frozenHabitDates, setFrozenHabitDates, onShowAiReport, currentPlan, keyEvents, onAddKeyEvent, onDeleteKeyEvent }) => {
  const { userData, handleDismissParentIntro, handleManualPointAdjustment } = useUserData();
  const [showIntro, setShowIntro] = useState(!userData.parentIntroDismissed);
  const handleDismiss = () => {
    setShowIntro(false);
    handleDismissParentIntro();
  };

  return (
    <div className="space-y-6">
      {showIntro && <EducationalPhilosophyCard onDismiss={handleDismiss} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SharedMessages messages={sharedMessages} />
        </div>
        <div className="lg:col-span-1">
          <UserProfileEditor profile={userProfile} onSave={onUpdateUserProfile} />
        </div>
      </div>
      <PointAdjuster currentPoints={userData.points} onAdjust={handleManualPointAdjustment} />
      <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-6 relative border border-white/50">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
          <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="" className="w-6 h-6" />
          AI 智慧助理
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          讓 Goodi AI 分析孩子的進度，為您產生一份精簡的成長週報，並提供個人化的鼓勵建議。
        </p>
        <button
          onClick={onShowAiReport}
          disabled={currentPlan !== 'paid499'}
          className="w-full bg-indigo-500 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
        >
          {currentPlan !== 'paid499' && <img src="https://api.iconify.design/solar/lock-keyhole-minimalistic-bold.svg" alt="lock" className="w-4 h-4 mr-1.5 inline-block invert" />}
          生成 AI 成長報告
        </button>
        {currentPlan !== 'paid499' && <p className="text-xs text-center text-gray-500 mt-2">此功能限高級方案</p>}
      </div>
      <HabitFreezeManager frozenDates={frozenHabitDates} setFrozenDates={setFrozenHabitDates} />
      <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50">
        <h3 className="text-xl font-bold mb-4">成績紀錄</h3>
        <ScoreChart scores={scoreHistory} />
        <ScoreManagement scores={scoreHistory} setScores={setScoreHistory} />
      </div>
      <ParentWishes wishes={wishes} />
    </div>
  );
};

const SubNav: React.FC<{ activeView: ParentView; setView: (view: ParentView) => void; }> = ({ activeView, setView }) => {
  const views: { id: ParentView, label: string, icon: string, color: string }[] = [
    { id: 'dashboard', label: '主控台', icon: 'https://api.iconify.design/twemoji/bar-chart.svg', color: 'bg-blue-500/90 backdrop-blur-sm' },
    { id: 'tasks', label: '任務', icon: 'https://api.iconify.design/twemoji/memo.svg', color: 'bg-green-500/90 backdrop-blur-sm' },
    { id: 'gachapon', label: '扭蛋', icon: 'https://static.wixstatic.com/media/ec806c_06542b0096b548309242e2a2406200e4~mv2.png', color: 'bg-purple-500/90 backdrop-blur-sm' },
    { id: 'rewards', label: '獎勵', icon: 'https://api.iconify.design/twemoji/wrapped-gift.svg', color: 'bg-yellow-500/90 backdrop-blur-sm' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {views.map(view => (
        <button key={view.id} onClick={() => setView(view.id)} className={`p-4 rounded-xl text-white font-bold text-xl flex items-center justify-center transition-transform hover:scale-105 shadow-lg ${view.color} ${activeView === view.id ? 'ring-2 ring-offset-1 ring-white/60 scale-105' : ''}`}>
          <img src={view.icon} alt={view.label} className="w-9 h-9 mr-3 filter drop-shadow-md object-contain" /> {view.label}
        </button>
      ))}
    </div>
  );
};

const TaskManagement: React.FC<{
  tasks: Task[];
  userProfile: UserProfile;
  currentPlan: Plan;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => void;
  onAddMultipleTasks: (tasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
  onOverwriteTasks: (tasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  isLocked: boolean;
  commonTasks: any[]; // Adjust type if needed
  ai: GoogleGenAI;
}> = ({ tasks, userProfile, currentPlan, onAddTask, onAddMultipleTasks, onOverwriteTasks, onEditTask, onDeleteTask, isLocked, commonTasks, ai }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const [showAiGoal, setShowAiGoal] = useState(false);

  const handleAiSuggestClick = () => {
    const limitCheck = checkAiUsageLimit('taskSuggester', AI_USAGE_CONFIGS.taskSuggester);
    if (!limitCheck.allowed) {
      alert(limitCheck.reason);
      return;
    }
    recordAiUsage('taskSuggester');
    setShowAiSuggest(true);
  };

  const handleAiGoalClick = () => {
    const limitCheck = checkAiUsageLimit('goalTaskGenerator', AI_USAGE_CONFIGS.goalTaskGenerator);
    if (!limitCheck.allowed) {
      alert(limitCheck.reason);
      return;
    }
    recordAiUsage('goalTaskGenerator');
    setShowAiGoal(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => {
    if (editingTask) {
      onEditTask({ ...editingTask, ...taskData });
      setEditingTask(null);
    } else {
      onAddTask(taskData);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setIsAdding(true)} disabled={isLocked} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-300">新增任務</button>
        <button onClick={handleAiSuggestClick} disabled={isLocked} className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-300 flex items-center gap-2">
          AI 推薦
          <span className="text-xs opacity-75">({getRemainingUses('taskSuggester', AI_USAGE_CONFIGS.taskSuggester.dailyLimit)}/5)</span>
        </button>
        <button onClick={handleAiGoalClick} disabled={isLocked} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-300 flex items-center gap-2">
          AI 目標生成
          <span className="text-xs opacity-75">({getRemainingUses('goalTaskGenerator', AI_USAGE_CONFIGS.goalTaskGenerator.dailyLimit)}/5)</span>
        </button>
      </div>

      {isAdding && (
        <Modal onClose={() => setIsAdding(false)} title="新增任務">
          <TaskForm onSave={handleSaveTask} onCancel={() => setIsAdding(false)} />
        </Modal>
      )}

      {editingTask && (
        <Modal onClose={() => setEditingTask(null)} title="編輯任務">
          <TaskForm task={editingTask} onSave={handleSaveTask} onCancel={() => setEditingTask(null)} />
        </Modal>
      )}

      {showAiSuggest && (
        <AiTaskSuggestModal
          ai={ai}
          userAge={userProfile.age}
          existingTasks={tasks}
          onClose={() => setShowAiSuggest(false)}
          onImport={onAddMultipleTasks}
        />
      )}

      {showAiGoal && (
        <AiGoalTaskGeneratorModal
          ai={ai}
          userAge={userProfile.age}
          onClose={() => setShowAiGoal(false)}
          onImport={onAddMultipleTasks}
        />
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map(task => (
          <div key={task.id} className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={task.icon} className="w-8 h-8" alt="" />
              <div>
                <p className="font-bold">{task.text}</p>
                <p className="text-xs text-gray-500">{task.category} | {task.points} 分</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingTask(task)} disabled={isLocked} className="text-blue-500 font-bold disabled:text-gray-300">編輯</button>
              <button onClick={() => onDeleteTask(task.id)} disabled={isLocked} className="text-red-500 font-bold disabled:text-gray-300">刪除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GachaponManagement: React.FC<{
  prizes: GachaponPrize[];
  setPrizes: (prizes: GachaponPrize[]) => void;
  isLocked: boolean;
}> = ({ prizes, setPrizes, isLocked }) => {
  const [editingPrize, setEditingPrize] = useState<GachaponPrize | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = (prizeData: Omit<GachaponPrize, 'id'>) => {
    let newPrizes = [...prizes];
    if (editingPrize) {
      newPrizes = newPrizes.map(p => p.id === editingPrize.id ? { ...p, ...prizeData } : p);
      setEditingPrize(null);
    } else {
      newPrizes.push({ ...prizeData, id: Date.now() });
      setIsAdding(false);
    }

    // Normalize percentages
    const total = newPrizes.reduce((sum, p) => sum + p.percentage, 0);
    if (total > 0 && total !== 100) {
      newPrizes = newPrizes.map(p => ({ ...p, percentage: Math.round(p.percentage / total * 100) }));
    }
    setPrizes(newPrizes);
  };

  const handleDelete = (id: number) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setIsAdding(true)} disabled={isLocked} className="bg-pink-500 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-300">新增獎品</button>

      {(isAdding || editingPrize) && (
        <Modal onClose={() => { setIsAdding(false); setEditingPrize(null); }} title={isAdding ? '新增獎品' : '編輯獎品'}>
          <GachaponPrizeForm
            prize={editingPrize || undefined}
            onSave={handleSave}
            onCancel={() => { setIsAdding(false); setEditingPrize(null); }}
            totalPrizes={prizes.length}
          />
        </Modal>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {prizes.map(prize => (
          <div key={prize.id} className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={prize.icon} className="w-8 h-8" alt="" />
              <div>
                <p className="font-bold">{prize.name}</p>
                <p className="text-xs text-gray-500">{prize.rarity} | {prize.percentage}%</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingPrize(prize)} disabled={isLocked} className="text-blue-500 font-bold disabled:text-gray-300">編輯</button>
              <button onClick={() => handleDelete(prize.id)} disabled={isLocked} className="text-red-500 font-bold disabled:text-gray-300">刪除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RewardManagement: React.FC<{
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  isLocked: boolean;
}> = ({ rewards, setRewards, isLocked }) => {
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = (rewardData: Omit<Reward, 'id'>) => {
    let newRewards = [...rewards];
    if (editingReward) {
      newRewards = newRewards.map(r => r.id === editingReward.id ? { ...r, ...rewardData } : r);
      setEditingReward(null);
    } else {
      newRewards.push({ ...rewardData, id: Date.now() });
      setIsAdding(false);
    }
    setRewards(newRewards);
  };

  const handleDelete = (id: number) => {
    setRewards(rewards.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setIsAdding(true)} disabled={isLocked} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-300">新增獎勵</button>

      {(isAdding || editingReward) && (
        <Modal onClose={() => { setIsAdding(false); setEditingReward(null); }} title={isAdding ? '新增獎勵' : '編輯獎勵'}>
          <RewardForm
            reward={editingReward || undefined}
            onSave={handleSave}
            onCancel={() => { setIsAdding(false); setEditingReward(null); }}
          />
        </Modal>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {rewards.map(reward => (
          <div key={reward.id} className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={reward.icon} className="w-8 h-8" alt="" />
              <div>
                <p className="font-bold">{reward.name}</p>
                <p className="text-xs text-gray-500">{reward.cost} 代幣</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingReward(reward)} disabled={isLocked} className="text-blue-500 font-bold disabled:text-gray-300">編輯</button>
              <button onClick={() => handleDelete(reward.id)} disabled={isLocked} className="text-red-500 font-bold disabled:text-gray-300">刪除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ParentModePageProps {
  onExit: () => void;
}

const ReferralProgramCard: React.FC<{ count: number; onRefer: () => void; userProfile: UserProfile; }> = ({ count, onRefer, userProfile }) => {
  const [copied, setCopied] = useState(false);

  const referralCode = useMemo(() => {
    const nickname = userProfile.nickname.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const randomPart = String(Date.now()).slice(-4);
    return `GOODI-${nickname || 'USER'}${randomPart}`;
  }, [userProfile.nickname]);

  const referralLink = "https://goodi.app/join";
  const textToCopy = `快來試試 Goodi 這個超棒的 App！\n\n我的推薦碼：${referralCode}\n點擊連結下載：${referralLink}\n\n使用我的推薦碼，我們都可以獲得「進階方案一週」的獎勵喔！`;

  const handleRefer = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      onRefer();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col border border-white/50">
      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
        <img src="https://api.iconify.design/twemoji/red-heart.svg" alt="" className="w-6 h-6" />
        分享 Goodi，解鎖方案！
      </h3>
      <div className="text-sm text-gray-600 mb-4 flex-grow">
        <p className="mb-2">邀請朋友加入 Goodi，當他們使用你的推薦碼註冊時，**您和朋友都可以免費體驗**</p>
        <p className="font-bold text-blue-600 text-base">進階方案 1 週！</p>
      </div>
      <div className="mt-4 text-center p-3 border-2 border-dashed border-gray-300/50 rounded-lg bg-white/30 backdrop-blur-sm">
        <p className="text-sm text-gray-500">已成功推薦 {count} 人 (此為模擬)</p>
        <p className="font-mono text-lg font-bold text-gray-800 tracking-widest">{referralCode}</p>
      </div>
      <button onClick={handleRefer} className="mt-4 w-full bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-md">
        {copied ? '推薦訊息已複製！' : '複製推薦訊息'}
      </button>
    </div>
  );
};

const FeedbackCard: React.FC<{ onSubmit: (text: string) => void }> = ({ onSubmit }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    const subject = encodeURIComponent('Goodi App Feedback & Wish');
    const body = encodeURIComponent(feedback.trim());
    window.location.href = `mailto:popo.studio@msa.hinet.net?subject=${subject}&body=${body}`;

    onSubmit(feedback.trim());
    setFeedback('');
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50">
      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
        <img src="https://api.iconify.design/twemoji/writing-hand.svg" alt="" className="w-6 h-6" />
        意見反饋 & 許願池
      </h3>
      <p className="text-sm text-gray-600 mb-3">您的建議是我們進步的動力！有任何想法或希望增加的功能嗎？</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="我希望 Goodi 可以有..."
          className="w-full h-24 p-2 border border-gray-300 bg-white rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500"
        />
        <button type="submit" className="w-full bg-purple-500 text-white font-semibold py-2.5 rounded-lg hover:bg-purple-600 transition-colors shadow-md">
          送出建議
        </button>
      </form>
    </div>
  );
};


const ParentModePage: React.FC<ParentModePageProps> = ({ onExit }) => {
  const {
    userData,
    updateUserData,
    handleAddTask,
    handleAddMultipleTasks,
    handleOverwriteTasks,
    handleEditTask,
    handleDeleteTask,
    handleSetGachaponPrizes,
    handleSetShopRewards,
    handleSetScoreHistory,
    handleUpdateUserProfile,
    handleSetFrozenHabitDates,
    handleReferral,
    handleFeedbackSubmit,
    handleAddKeyEvent,
    handleDeleteKeyEvent
  } = useUserData();

  const {
    plan: currentPlan,
    scoreHistory,
    sharedMessages,
    wishes,
    tasks,
    gachaponPrizes,
    shopRewards,
    userProfile,
    frozenHabitDates,
    referralCount,
    planTrialEndDate,
    keyEvents
  } = userData;

  const setPlan = (plan: Plan) => updateUserData({ plan });

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [view, setView] = useState<ParentView>('dashboard');
  const [showAiReport, setShowAiReport] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'copyright' | null>(null);
  const ai = useMemo(() => new FirebaseGenAI(), []);

  const isTrialActive = planTrialEndDate && new Date(planTrialEndDate) > new Date();
  // If user is on free plan but trial is active, treat as paid199 (Advanced)
  const effectivePlan = (isTrialActive && currentPlan === 'free') ? 'paid199' : currentPlan;

  const handlePlanSelection = (plan: Plan) => {
    console.log('[ParentMode] Plan selected:', plan);
    if (plan === 'free') {
      updateUserData({ plan: 'free' });
      addToast('已切換至免費方案');
    } else {
      setSelectedPlanForPayment(plan);
    }
  };

  const handlePaymentConfirm = () => {
    if (selectedPlanForPayment) {
      console.log('[ParentMode] Payment confirmed for:', selectedPlanForPayment);
      updateUserData({ plan: selectedPlanForPayment });
      addToast('方案升級成功！', 'celebrate');
    }
    setSelectedPlanForPayment(null);
  };

  const renderView = () => {
    const isLocked = effectivePlan === 'free';
    switch (view) {
      case 'tasks': return <TaskManagement
        tasks={tasks}
        userProfile={userProfile}
        currentPlan={effectivePlan}
        onAddTask={handleAddTask}
        onAddMultipleTasks={handleAddMultipleTasks}
        onOverwriteTasks={handleOverwriteTasks}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        isLocked={isLocked}
        commonTasks={commonTasksData}
        ai={ai} />;
      case 'gachapon': return <GachaponManagement prizes={gachaponPrizes} setPrizes={handleSetGachaponPrizes} isLocked={isLocked} />;
      case 'rewards': return <RewardManagement rewards={shopRewards} setRewards={handleSetShopRewards} isLocked={isLocked} />;
      case 'dashboard':
      default:
        return <Dashboard
          scoreHistory={scoreHistory}
          setScoreHistory={handleSetScoreHistory}
          sharedMessages={sharedMessages}
          wishes={wishes}
          userProfile={userProfile}
          onUpdateUserProfile={handleUpdateUserProfile}
          frozenHabitDates={frozenHabitDates}
          setFrozenHabitDates={handleSetFrozenHabitDates}
          onShowAiReport={() => setShowAiReport(true)}
          currentPlan={effectivePlan}
          keyEvents={keyEvents}
          onAddKeyEvent={handleAddKeyEvent}
          onDeleteKeyEvent={handleDeleteKeyEvent}
        />;
    }
  }

  return (
    <>
      {selectedPlanForPayment && <PaymentModal plan={selectedPlanForPayment} onConfirm={handlePaymentConfirm} onCancel={() => setSelectedPlanForPayment(null)} />}
      {showAiReport && <AiGrowthReport onClose={() => setShowAiReport(false)} />}
      {showLegalModal && <LegalModal type={showLegalModal} onClose={() => setShowLegalModal(null)} />}
      <div className="animate-fade-in space-y-6 h-full pb-8">
        <div className="text-center py-4">
          <h2 className="text-4xl font-black text-slate-800 drop-shadow-sm">家長管理中心</h2>
        </div>

        <SubNav activeView={view} setView={setView} />

        {renderView()}

        <PlanSelector currentPlan={effectivePlan} onSelectPlan={handlePlanSelection} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <ReferralProgramCard userProfile={userProfile} count={referralCount} onRefer={handleReferral} />
          <FeedbackCard onSubmit={handleFeedbackSubmit} />
        </div>

        <button
          onClick={onExit}
          className="mt-4 w-full bg-gray-500/90 backdrop-blur-sm text-white font-bold py-4 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-md text-lg"
        >
          退出家長管理
        </button>

        <footer className="mt-8 text-center text-xs text-gray-500">
          <button onClick={() => setShowLegalModal('privacy')} className="hover:underline">隱私權說明</button>
          <span className="mx-2">|</span>
          <button onClick={() => setShowLegalModal('copyright')} className="hover:underline">版權說明</button>
          <p className="mt-1">© 2024 Goodi App. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export { ParentModePage };
