
import React from 'react';

interface SharedMessagesProps {
    messages: string[];
}

const SharedMessages: React.FC<SharedMessagesProps> = ({ messages }) => {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 h-full flex flex-col border border-white/50">
            <h3 className="font-bold text-lg mb-3 text-gray-700 flex items-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V14a1 1 0 001 1h1a1 1 0 001-1v-2a1 1 0 00-1-1H9" />
                </svg>
                孩子分享的訊息
            </h3>
            {messages.length > 0 ? (
                <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {messages.map((msg, index) => {
                        const isAlert = msg.startsWith('【安全警示】');
                        return (
                            <div key={index} className={`p-3 rounded-lg border backdrop-blur-sm ${isAlert ? 'bg-red-50/80 text-red-800 border-red-200/60' : 'bg-indigo-50/60 text-indigo-800 border-indigo-200/60'}`}>
                                <p className="text-sm">
                                    {isAlert 
                                        ? <><span className="font-bold">【安全警示】</span>{msg.replace('【安全警示】', '')}</>
                                        : `"${msg}"`
                                    }
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                    <p>孩子還沒有分享任何心事喔！</p>
                </div>
            )}
        </div>
    );
};

export default SharedMessages;
