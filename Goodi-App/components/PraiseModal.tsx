
import React, { useState } from 'react';
import { useUserData } from '../UserContext';

interface PraiseModalProps {
    taskInfo: {taskId: number, isProactive: boolean};
    onClose: () => void;
}

const PraiseModal: React.FC<PraiseModalProps> = ({ taskInfo, onClose }) => {
    const { handlePraiseSubmit } = useUserData();
    const [praiseText, setPraiseText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (praiseText.trim()) {
            handlePraiseSubmit(taskInfo.taskId, taskInfo.isProactive, praiseText.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                <img src="https://api.iconify.design/twemoji/star-struck.svg" alt="分享稱讚" className="w-16 h-16 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-800">分享老師的稱讚</h2>
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <textarea value={praiseText} onChange={(e) => setPraiseText(e.target.value)} placeholder="老師說..." className="w-full h-28 p-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-green-400" required />
                    <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md">分享</button>
                </form>
                <button onClick={onClose} className="w-full bg-transparent text-gray-500 font-medium py-2 hover:bg-gray-100/50 rounded-lg">取消</button>
            </div>
        </div>
    );
};

export default PraiseModal;
