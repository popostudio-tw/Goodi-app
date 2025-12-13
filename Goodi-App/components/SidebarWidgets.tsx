// SidebarWidgets.tsx
import React, { useState, useEffect, useMemo } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { useUserData } from "../UserContext";
import TestScoreModal from "./TestScoreModal";

const WidgetCard: React.FC<{
  icon: string;
  title: string;
  children: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red";
  className?: string;
}> = ({ icon, title, children, color, className = "" }) => {
  const colorClasses = {
    blue: "bg-blue-50/40 border-blue-200/50 text-blue-900",
    green: "bg-green-50/40 border-green-200/50 text-green-900",
    yellow: "bg-yellow-50/40 border-yellow-200/50 text-yellow-900",
    red: "bg-red-50/40 border-red-200/50 text-red-900",
  };

  return (
    <div
      className={`p-4 rounded-2xl shadow-md border backdrop-blur-md transition-all hover:bg-white/70 ${
        color ? colorClasses[color] : "bg-white/60 border-white/40"
      } ${className}`}
    >
      <h3 className="font-bold text-lg mb-3 flex items-center">
        <img src={icon} alt="" className="w-7 h-7 mr-2 drop-shadow-sm" />
        {title}
      </h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
};

const LOGO_OPTIONS = [
  "https://static.wixstatic.com/media/ec806c_7b1f40d3524d45e6a3a0462c7d522b8a~mv2.png",
  "https://static.wixstatic.com/media/ec806c_0b0899d59d8544da9269e16ce8b12d25~mv2.png",
  "https://static.wixstatic.com/media/ec806c_0d8d9d4c54074b94b9fccb10e3c003d5~mv2.png",
  "https://static.wixstatic.com/media/ec806c_3f83758cf14647d2a1d6127f1a92b000~mv2.png",
];

const GreetingCard: React.FC = () => {
  const { userData } = useUserData();

  // ✅ 防呆：避免 userData 尚未 ready 時直接解構炸掉
  const nickname = userData?.userProfile?.nickname ?? "同學";
  const tasks = userData?.tasks ?? [];
  const remaining = tasks.filter((t: any) => !t.completed).length;

  const [logoUrl, setLogoUrl] = useState(LOGO_OPTIONS[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * LOGO_OPTIONS.length);
    setLogoUrl(LOGO_OPTIONS[randomIndex]);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早安";
    if (hour < 18) return "午安";
    return "晚安";
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-4 shadow-md border border-white/40">
      <img
        src={logoUrl}
        alt="Mascot"
        className="h-20 w-20 flex-shrink-0 object-contain drop-shadow-md"
      />
      <div>
        <p className="text-base font-semibold text-green-700">
          {getGreeting()}，{nickname}！
        </p>
        <h2 className="text-xl font-bold text-gray-800">嘿，進步囉！</h2>
        <p className="text-gray-600 text-sm">
          今天還有{" "}
          <span className="font-bold text-green-600">{remaining} 個</span>{" "}
          任務，加油！
        </p>
      </div>
    </div>
  );
};

const KeyEventsWidget: React.FC = () => {
  const { userData, handleAddKeyEvent, handleDeleteKeyEvent } = useUserData();
  const keyEvents = userData?.keyEvents ?? [];

  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const sortedEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return keyEvents
      .filter((e: any) => e.date >= today)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [keyEvents]);

  const handleAdd = () => {
    if (text.trim() && date) {
      handleAddKeyEvent(text, date);
      setText("");
      setDate("");
      setIsAdding(false);
    }
  };

  return (
    <WidgetCard icon="https://api.iconify.design/twemoji/pushpin.svg" title="重要紀事" color="red">
      <div className="space-y-3">
        {sortedEvents.length > 0 ? (
          <ul className="space-y-2">
            {sortedEvents.map((event: any) => {
              const isToday = event.date === new Date().toISOString().split("T")[0];
              return (
                <li
                  key={event.id}
                  className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-white/40"
                >
                  <div>
                    <div className={`text-xs font-bold ${isToday ? "text-red-600" : "text-gray-500"}`}>
                      {event.date.replace(/-/g, "/")}
                      {isToday && (
                        <span className="ml-1 bg-red-100 text-red-600 px-1 rounded text-[10px]">今天</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-800">{event.text}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteKeyEvent(event.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <img
                      src="https://api.iconify.design/solar/trash-bin-minimalistic-bold.svg"
                      className="w-4 h-4"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-2">目前沒有接下來的活動</p>
        )}

        {isAdding ? (
          <div className="bg-white/60 p-2 rounded-lg border border-red-100 space-y-2 animate-fade-in backdrop-blur-sm">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-1.5 border border-white/50 bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-200 transition-colors text-gray-800"
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如: 運動會"
              className="w-full p-1.5 border border-white/50 bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-200 transition-colors placeholder-gray-500 text-gray-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                新增
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-white/50 hover:bg-white/80 text-gray-600 py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/60"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border-2 border-dashed border-red-300/50 text-red-500/70 rounded-lg font-bold hover:bg-red-50/50 hover:text-red-500 transition-colors text-sm flex items-center justify-center gap-1 backdrop-blur-sm"
          >
            + 新增記事
          </button>
        )}
      </div>
    </WidgetCard>
  );
};

const ScoreWidget: React.FC = () => {
  const { userData, handleReportScore } = useUserData();
  const [showModal, setShowModal] = useState(false);

  const scoreHistory = userData?.scoreHistory ?? [];
  const lastScore = scoreHistory[0];

  return (
    <>
      <WidgetCard icon="https://api.iconify.design/twemoji/scroll.svg" title="成績單" color="blue">
        <div className="flex items-center justify-between">
          <div>
            {lastScore ? (
              <div className="text-sm">
                <p className="text-gray-500">上次成績</p>
                <p className="font-bold text-blue-600">
                  {lastScore.subject}: {lastScore.score}分
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">還沒有成績紀錄喔</p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <img
              src="https://api.iconify.design/solar/pen-new-square-bold.svg"
              className="w-3 h-3 invert"
            />
            回報成績
          </button>
        </div>
      </WidgetCard>

      {showModal && (
        <TestScoreModal
          onClose={() => setShowModal(false)}
          onReport={(details) => {
            handleReportScore(details);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

const DailyStats: React.FC = () => {
  const { userData } = useUserData();
  const transactions = userData?.transactions ?? [];

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = (timestamp: number) =>
      new Date(timestamp).toISOString().split("T")[0] === todayStr;

    const todaysTaskCompletions = transactions.filter(
      (t: any) => isToday(t.timestamp) && t.description.startsWith("完成任務:")
    );

    const proactive = todaysTaskCompletions.filter((t: any) => t.description.includes("(主動)")).length;
    const normal = todaysTaskCompletions.length - proactive;

    return { proactive, normal };
  }, [transactions]);

  return (
    <WidgetCard icon="https://api.iconify.design/twemoji/trophy.svg" title="今日戰績" className="bg-white/60">
      <div className="flex justify-around items-center text-center py-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black text-green-600 tabular-nums leading-none drop-shadow-sm">
            {stats.normal}
          </span>
          <div className="bg-green-500 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shadow-green-200">
            <img
              src="https://api.iconify.design/solar/check-circle-bold.svg"
              alt="完成"
              className="w-3.5 h-3.5 filter brightness-0 invert"
            />
            <span className="text-xs font-bold tracking-wide">完成</span>
          </div>
        </div>

        <div className="h-10 w-px bg-gray-400/30 mx-2" />

        <div className="flex items-center gap-3">
          <span className="text-4xl font-black text-blue-600 tabular-nums leading-none drop-shadow-sm">
            {stats.proactive}
          </span>
          <div className="bg-blue-600 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shadow-blue-200">
            <img
              src="https://api.iconify.design/solar/like-bold.svg"
              alt="主動"
              className="w-3.5 h-3.5 filter brightness-0 invert"
            />
            <span className="text-xs font-bold tracking-wide">主動</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

const AiYesterdaySummary: React.FC = () => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateYesterdaySummary = httpsCallable(functions, "generateYesterdaySummary");

    const fetchSummary = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const cacheKey = `goodi_summary_${yesterdayStr}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setSummary(cachedData);
        setIsLoading(false);
        return;
      }

      try {
        const res = await generateYesterdaySummary({ date: yesterdayStr });
        const text = (res.data as any)?.text || "昨天好像還沒有資料可以整理～";
        setSummary(text);
        localStorage.setItem(cacheKey, text);
      } catch (e) {
        console.error("generateYesterdaySummary failed:", e);
        setSummary("嗚～摘要生成失敗，等一下再試一次好嗎？");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <WidgetCard icon="https://api.iconify.design/twemoji/sparkles.svg" title="昨日小結" color="green">
      {isLoading ? <p>整理昨天的冒險中...</p> : <p>{summary}</p>}
    </WidgetCard>
  );
};

// ✅ 不碰任何 key 的安全版（先穩定上線；之後要真實歷史事件再搬到 Functions）
const TodayInHistory: React.FC = () => {
  const [event, setEvent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    const cacheKey = `history_static_${todayKey}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setEvent(cachedData);
      setIsLoading(false);
      return;
    }

    const month = today.getMonth() + 1;
    const day = today.getDate();
    const newEvent = `歷史上的今天（${month}月${day}日），世界各地都發生過很多重要的事。你也可以寫下「今天我做了什麼」，讓未來的自己回來看！`;

    setEvent(newEvent);
    localStorage.setItem(cacheKey, newEvent);
    setIsLoading(false);
  }, []);

  return (
    <WidgetCard icon="https://api.iconify.design/twemoji/spiral-calendar.svg" title="歷史的今天" color="yellow">
      {isLoading ? <p>載入中...</p> : <p>{event}</p>}
    </WidgetCard>
  );
};

const AnimalTrivia: React.FC = () => {
  const [fact, setFact] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const cacheKey = `trivia_static_${seed}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setFact(cachedData);
      setIsLoading(false);
      return;
    }

    const facts = [
      "你知道嗎？章魚有三顆心臟，而且牠們的血液是偏藍色的喔！",
      "你知道嗎？海豚睡覺時會讓大腦一半休息，所以牠們能邊游邊睡！",
      "你知道嗎？蜂鳥是唯一能往後飛的鳥，超像空中小直升機！",
    ];
    const newFact = facts[seed % facts.length];

    setFact(newFact);
    localStorage.setItem(cacheKey, newFact);
    setIsLoading(false);
  }, []);

  return (
    <WidgetCard icon="https://api.iconify.design/twemoji/paw-prints.svg" title="動物冷知識" color="green">
      {isLoading ? <p>載入中...</p> : <p>{fact}</p>}
    </WidgetCard>
  );
};

const SidebarWidgets: React.FC = () => {
  return (
    <div className="space-y-4 pb-4">
      <GreetingCard />
      <DailyStats />
      <AiYesterdaySummary />
      <ScoreWidget />
      <TodayInHistory />
      <AnimalTrivia />
      <KeyEventsWidget />
    </div>
  );
};

export default SidebarWidgets;
