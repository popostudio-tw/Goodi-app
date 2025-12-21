
import React, { useState, useMemo } from 'react';
import { Achievement } from '../types';
import { useUserData } from '../UserContext';
import html2canvas from 'html2canvas';
import '../components/Animations.css';

const AchievementCard: React.FC<{ achievement: Achievement; onClick: () => void; }> = ({ achievement, onClick }) => {
  const { icon, title, description, unlocked, isMastery } = achievement;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden border min-h-[140px] justify-start text-center ${unlocked ? (isMastery ? 'bg-amber-50/70 backdrop-blur-md border-yellow-300 shadow-md hover:shadow-lg hover:scale-105' : 'bg-white/60 backdrop-blur-md border-white/50 shadow-sm hover:shadow-md hover:scale-105') : 'bg-gray-200/50 backdrop-blur-sm border-white/30 opacity-80'}`}
    >
      {/* Glow effect for unlocked mastery */}
      {unlocked && isMastery && (
        <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
      )}

      <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full mb-2 transition-transform ${unlocked ? 'bg-white/80 shadow-sm scale-100' : 'bg-gray-300/50 scale-95 grayscale'}`}>
        <img src={icon} alt={title} className={`w-9 h-9 object-contain ${unlocked ? '' : 'opacity-50'}`} />
      </div>

      <div className="w-full relative z-10 px-1">
        <h3 className={`font-bold text-sm mb-1 leading-tight ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
          {title}
        </h3>
        <p className={`text-xs leading-snug line-clamp-2 ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

const VideoModal: React.FC<{ videoSrc: string; onClose: () => void }> = ({ videoSrc, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 z-10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <video src={videoSrc} controls autoPlay className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

const ShareAchievementModal: React.FC<{ achievement: Achievement; nickname: string; onClose: () => void }> = ({ achievement, nickname, onClose }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#FFFBF2', // Goodi's warm cream
      });
      const link = document.createElement('a');
      link.download = `Goodi_Achievement_${achievement.title}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 transform transition-all animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* The Card to be Captured */}
        <div
          ref={cardRef}
          className="aspect-[4/5] bg-[#FFFBF2] rounded-3xl p-8 flex flex-col items-center justify-between border-8 border-white shadow-inner relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-yellow-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-24 h-24 bg-green-200/30 rounded-full blur-xl"></div>

          <div className="text-center z-10 w-full">
            <p className="text-amber-700 font-black text-sm tracking-widest mb-1 uppercase">Achievement Unlocked</p>
            <div className="h-px bg-amber-200/50 w-full mb-6"></div>

            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-xl mb-6 border-4 border-amber-100">
              <img src={achievement.icon} className="w-14 h-14 object-contain" alt="Icon" />
            </div>

            <h3 className="text-3xl font-black text-slate-800 mb-2">{achievement.title}</h3>
            <p className="text-slate-500 font-medium px-4 leading-relaxed">{achievement.description}</p>
          </div>

          <div className="text-center z-10">
            <p className="text-xl font-black text-green-700 mb-1">{nickname}</p>
            <p className="text-gray-400 text-[10px] font-bold tracking-tighter uppercase">Proudly Powered by Goodi App</p>
            <div className="mt-2 flex items-center justify-center gap-1 opacity-40">
              <img src="https://static.wixstatic.com/media/ec806c_7b1f40d3524d45e6a3a0462c7d522b8a~mv2.png" className="w-4 h-4" alt="logo" />
              <span className="text-[10px] font-black text-slate-900 leading-none">GOODI</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors text-sm">
            再說吧
          </button>
          <button
            onClick={handleSaveImage}
            disabled={isGenerating}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? '正在生成...' : (
              <>
                <img src="https://api.iconify.design/solar/gallery-send-bold.svg" className="w-5 h-5 invert" />
                儲存榮耀
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AchievementsPage: React.FC = () => {
  const { userData } = useUserData();
  const { achievements, tasks, userProfile } = userData;
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [sharingAchievement, setSharingAchievement] = useState<Achievement | null>(null);

  // Generate dynamic Mastery Achievements from Tasks
  const masteryAchievements = useMemo(() => {
    return tasks
      .filter(t => t.category === '生活' || t.category === '家務')
      .map(t => {
        const isUnlocked = !!t.mastered;
        const progress = Math.min(t.consecutiveCompletions || 0, 21);
        return {
          id: `mastery_${t.id}`,
          title: `${t.text}大師`,
          description: isUnlocked ? '恭喜！你已經成為真正的大師！' : `連續完成 ${progress}/21 天`,
          icon: t.icon,
          unlocked: isUnlocked,
          isMastery: true,
          videoId: "https://video.wixstatic.com/video/ec806c_0aad9d677de244edbf8c44d351133f58/720p/mp4/file.mp4" // Placeholder video
        } as Achievement;
      });
  }, [tasks]);

  const allAchievements = [...achievements, ...masteryAchievements];
  const unlockedCount = allAchievements.filter(a => a.unlocked).length;
  const totalCount = allAchievements.length;

  const handleCardClick = (ach: Achievement) => {
    if (!ach.unlocked) return;
    if (ach.videoId) {
      setPlayingVideo(ach.videoId);
    } else {
      setSharingAchievement(ach);
    }
  };

  const handleShareClick = (e: React.MouseEvent, ach: Achievement) => {
    e.stopPropagation();
    setSharingAchievement(ach);
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto h-full flex flex-col pb-4">
      <div className="text-center bg-white/60 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-lg flex-shrink-0 border border-white/40">
        <h2 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-3">
          <img src="https://api.iconify.design/twemoji/trophy.svg" className="w-8 h-8" alt="Trophy" />
          成就獎章
        </h2>
        <div className="mt-3 inline-block bg-white/50 px-4 py-1 rounded-full border border-white/50 shadow-sm">
          <p className="text-slate-700 font-bold text-sm">
            已解鎖 {unlockedCount} / {totalCount} 個成就！
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Standard Achievements */}
          {achievements.map(ach => (
            <div key={ach.id} className="relative group">
              <AchievementCard achievement={ach} onClick={() => handleCardClick(ach)} />
              {ach.unlocked && (
                <button
                  onClick={(e) => handleShareClick(e, ach)}
                  className="absolute top-2 right-2 w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-indigo-600"
                >
                  <img src="https://api.iconify.design/solar/gallery-send-bold.svg" className="w-5 h-5 invert" />
                </button>
              )}
            </div>
          ))}

          {/* Mastery Section Divider */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4 mt-6 mb-2">
            <div className="flex items-center">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
              <h3 className="mx-4 font-black text-yellow-600 text-lg flex items-center gap-2 whitespace-nowrap">
                <img src="https://api.iconify.design/twemoji/crown.svg" className="w-5 h-5" alt="Crown" />
                任務大師挑戰
              </h3>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
            </div>
            <p className="text-center text-xs text-yellow-600/80 mt-1">連續 21 天完成任務，解鎖大師影片與 1.5 倍積分！</p>
          </div>

          {/* Dynamic Mastery Badges */}
          {masteryAchievements.map(ach => (
            <AchievementCard key={ach.id} achievement={ach} onClick={() => handleCardClick(ach)} />
          ))}
        </div>
      </div>

      {playingVideo && <VideoModal videoSrc={playingVideo} onClose={() => setPlayingVideo(null)} />}
      {sharingAchievement && (
        <ShareAchievementModal
          achievement={sharingAchievement}
          nickname={userProfile.nickname || '厲害的小朋友'}
          onClose={() => setSharingAchievement(null)}
        />
      )}
    </div>
  );
};

export default AchievementsPage;
