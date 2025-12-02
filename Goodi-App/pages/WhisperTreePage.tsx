import React, { useState, useEffect, useRef } from 'react';
import { useUserData } from '../UserContext';

const WhisperTreePage: React.FC = () => {
  const { userData, handleAddEntry, updateUserData } = useUserData();
  const { journalEntries, sharedMessages } = userData;
  const [newEntryText, setNewEntryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareWithParent, setShareWithParent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [journalEntries, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntryText.trim() && !isLoading) {
      setIsLoading(true);
      const textToSubmit = newEntryText;
      if (shareWithParent) {
        updateUserData({ sharedMessages: [textToSubmit, ...sharedMessages] });
      }
      setNewEntryText('');
      setShareWithParent(false);
      await handleAddEntry(textToSubmit);
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col lg:flex-row gap-4 overflow-hidden p-1 items-start justify-center">
      {/* Left Panel: Info Card - Only visible on large screens */}
      <div className="hidden lg:flex lg:w-1/4 flex-col justify-center pt-4">
         <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full border border-white/30 flex flex-col items-center text-center">
            <div className="bg-gradient-to-b from-green-100 to-emerald-200 p-4 rounded-full mb-4 shadow-inner">
                 <img src="https://api.iconify.design/twemoji/deciduous-tree.svg" alt="Tree" className="w-20 h-20 object-contain drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black text-emerald-800 mb-2">
                心事樹洞
            </h2>
            <p className="text-emerald-700/80 text-sm leading-relaxed font-medium">
                不管開心或難過，Goodi 都會在這裡陪你。把你的秘密告訴樹洞吧！
            </p>
         </div>
      </div>
      
      {/* Right Panel: Chat Interface - Reduced Height */}
      <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-[2rem] shadow-xl overflow-hidden border border-white/40 relative w-full max-w-3xl h-[65vh] max-h-[550px] lg:self-start mt-2 lg:mt-4">
          {/* Header for Mobile */}
          <div className="lg:hidden p-3 border-b border-white/20 flex items-center gap-3 bg-white/20 backdrop-blur-sm shrink-0">
               <div className="bg-green-100 p-1.5 rounded-full">
                    <img src="https://api.iconify.design/twemoji/deciduous-tree.svg" alt="Tree" className="w-6 h-6" />
               </div>
               <span className="font-bold text-emerald-900 text-lg">心事樹洞</span>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
            {journalEntries.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-emerald-800/60">
                    <div className="bg-white/20 p-6 rounded-full mb-4 backdrop-blur-sm">
                        <img src="https://api.iconify.design/solar/chat-round-line-duotone.svg" className="w-12 h-12 text-emerald-700" />
                    </div>
                    <p className="text-emerald-900 font-medium bg-white/40 px-4 py-2 rounded-xl backdrop-blur-md text-sm">還沒有任何心事喔，說點什麼吧？</p>
                </div>
            )}
            {journalEntries.map(entry => (
               <div key={entry.id} className={`flex items-end gap-2 ${entry.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {entry.author === 'goodi' && (
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border-2 border-white/50">
                          <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="Goodi" className="w-5 h-5 object-contain" />
                      </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[75%] p-2.5 rounded-2xl shadow-sm text-sm leading-relaxed backdrop-blur-sm transition-all hover:shadow-md ${
                      entry.author === 'user' 
                      ? 'bg-emerald-500/90 text-white rounded-br-none' 
                      : 'bg-white/80 text-slate-800 rounded-bl-none border border-white/60'
                  }`}>
                    <p>{entry.text}</p>
                  </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-end gap-2 justify-start">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border-2 border-white/50">
                        <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="Goodi" className="w-5 h-5 object-contain" />
                   </div>
                  <div className="p-2.5 rounded-2xl bg-white/80 text-slate-800 rounded-bl-none shadow-sm border border-white/60">
                    <div className="flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Area */}
          <div className="p-3 bg-gradient-to-t from-white/40 to-transparent shrink-0">
            <form onSubmit={handleSubmit} className="relative">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                    <input
                      value={newEntryText}
                      onChange={(e) => setNewEntryText(e.target.value)}
                      placeholder="今天心情怎麼樣？"
                      className="flex-grow p-2 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-500 font-medium text-sm"
                      disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !newEntryText.trim()} 
                        className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 disabled:bg-slate-300 transition-transform active:scale-95 shadow-md shrink-0"
                    >
                        <img src="https://api.iconify.design/solar/plain-bold.svg" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
                    </button>
                </div>
                <div className="mt-1 flex justify-end">
                    <label className="flex items-center text-xs font-bold text-emerald-800 bg-white/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/60 transition-colors backdrop-blur-sm shadow-sm border border-white/30">
                        <input 
                            type="checkbox" 
                            checked={shareWithParent} 
                            onChange={(e) => setShareWithParent(e.target.checked)} 
                            className="h-3 w-3 mr-1.5 text-emerald-500 rounded border-emerald-300 focus:ring-emerald-500" 
                        />
                        分享給爸媽
                    </label>
                </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default WhisperTreePage;