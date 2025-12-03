import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserData } from '../UserContext';

const DURATIONS: { [key: string]: number } = {
    '5分鐘': 5 * 60, '10分鐘': 10 * 60, '15分鐘': 15 * 60, '25分鐘': 25 * 60,
};
const DEFAULT_DURATION = 25 * 60;
type SoundOption = 'melody' | 'bell' | 'chord';
const SOUND_OPTIONS: { id: SoundOption, label: string }[] = [
    { id: 'melody', label: '旋律' },
    { id: 'bell', label: '響鈴' },
    { id: 'chord', label: '和弦' },
];

const FocusTimerPage: React.FC = () => {
  const { userData, handleFocusSessionComplete } = useUserData();

  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundOption>('melody');
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((sound: SoundOption) => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') audioContext.resume();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    switch (sound) {
        case 'melody': // C4-E4-G4
            playNote(261.63, now, 0.2);
            playNote(329.63, now + 0.2, 0.2);
            playNote(392.00, now + 0.4, 0.3);
            break;
        case 'bell': // C6
            playNote(1046.50, now, 0.8);
            break;
        case 'chord': // C4 major chord
            playNote(261.63, now, 0.5); // C4
            playNote(329.63, now, 0.5); // E4
            playNote(392.00, now, 0.5); // G4
            break;
    }
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft(time => time - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsCompleted(true);
      playSound(selectedSound);
      handleFocusSessionComplete(selectedDuration);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, selectedSound, selectedDuration, handleFocusSessionComplete, playSound]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsCompleted(false);
    setTimeLeft(selectedDuration);
  }, [selectedDuration]);

  const handleSoundSelection = (soundId: SoundOption) => {
    if (isActive) return;
    setSelectedSound(soundId);
    playSound(soundId);
  }

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const progress = ((selectedDuration - timeLeft) / selectedDuration) * 100;

  return (
    <div className="animate-fade-in h-full flex justify-center items-start p-2">
        {/* Main Card - Optimized Layout */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/50 p-6 w-full max-w-3xl flex flex-col items-center gap-1 relative">
             
             {/* Header moved inside/compact */}
            <div className="absolute top-4 left-6 text-gray-600 flex items-center gap-2 opacity-70">
                <img src="https://api.iconify.design/twemoji/stopwatch.svg" className="w-6 h-6" />
                <span className="font-bold">專注番茄鐘</span>
            </div>

            <div className="flex flex-row items-center justify-center w-full gap-8 md:gap-16 mt-4">
                {/* Left: Timer Circle */}
                <div className="flex-shrink-0">
                    <div className="relative w-64 h-64 drop-shadow-xl">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-white/40" strokeWidth="6" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"/>
                            <circle 
                                className="text-orange-500" 
                                strokeWidth="6" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (progress / 100) * 283} 
                                strokeLinecap="round" 
                                stroke="currentColor" 
                                fill="transparent" 
                                r="45" cx="50" cy="50" 
                                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {isCompleted ? (
                                <div className="animate-bounce">
                                    <img src="https://api.iconify.design/twemoji/party-popper.svg" alt="完成" className="w-24 h-24" />
                                </div>
                            ) : (
                                <span className="text-7xl font-bold text-gray-800 tracking-tight font-mono drop-shadow-sm">{formatTime(timeLeft)}</span>
                            )}
                            <p className="text-gray-600 text-base mt-2 font-bold bg-white/40 px-3 py-0.5 rounded-full">
                                {isCompleted ? "任務完成！" : (isActive ? "保持專注..." : "準備開始")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Controls Container */}
                <div className="flex-1 w-full space-y-4 flex flex-col justify-center max-w-xs">
                    {/* Duration Selection */}
                    <div className="grid grid-cols-2 gap-3 bg-white/40 p-3 rounded-2xl backdrop-blur-sm border border-white/50 shadow-inner">
                        {Object.entries(DURATIONS).map(([label, duration]) => {
                            const isSelected = selectedDuration === duration;
                            const mins = duration / 60;
                            const count = userData.focusSessionCounts?.[mins] || 0;
                            
                            return (
                                <button 
                                    key={label} 
                                    onClick={() => { if (!isActive) { setSelectedDuration(duration); setTimeLeft(duration); setIsCompleted(false); }}} 
                                    disabled={isActive} 
                                    className={`py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${isSelected && !isActive ? 'bg-orange-500 text-white shadow-md scale-105 ring-2 ring-orange-200' : 'text-gray-600 hover:bg-white/60 bg-white/30 border border-transparent'}`}
                                >
                                    <span className="font-bold text-sm mb-0.5">{label}</span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-gray-500'}`}>
                                        達成 {count} 次
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sound Selection */}
                    <div className="flex gap-1 bg-white/40 p-1.5 rounded-xl border border-white/50">
                        {SOUND_OPTIONS.map(({id, label}) => (
                            <button 
                                key={id} 
                                onClick={() => handleSoundSelection(id)} 
                                disabled={isActive} 
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedSound === id ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-white/30'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Main Action Buttons */}
                    <div className="flex gap-3 mt-2">
                        <button 
                            onClick={() => { if (!isCompleted) setIsActive(!isActive); }} 
                            disabled={isCompleted} 
                            className={`flex-1 py-4 rounded-2xl font-black text-white text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                            {isActive ? (
                                <><img src="https://api.iconify.design/solar/pause-bold.svg" className="w-6 h-6 invert" /> 暫停</>
                            ) : (
                                <><img src="https://api.iconify.design/solar/play-bold.svg" className="w-6 h-6 invert" /> 開始</>
                            )}
                        </button>
                        <button 
                            onClick={resetTimer} 
                            className="flex-shrink-0 px-5 py-4 rounded-2xl font-bold bg-white/70 border border-white/60 text-gray-700 text-lg shadow-md transition-all active:scale-95 hover:bg-white/90 flex items-center justify-center"
                        >
                            <img src="https://api.iconify.design/solar/restart-bold.svg" className="w-7 h-7 opacity-60" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm font-medium max-w-3xl w-full text-center shadow-sm mt-2">
                為了得到最佳體驗，僅在番茄鐘計時，僅在本畫面有效，跳離後番茄鐘中失效
            </div>
        </div>
    </div>
  );
};

export default FocusTimerPage;