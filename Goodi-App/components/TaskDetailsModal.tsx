
import React from 'react';
import { Task } from '../types';

interface TaskDetailsModalProps {
    task: Task;
    onClose: () => void;
    onComplete: (taskId: number) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onComplete }) => {
    const isImage = task.icon?.startsWith('data:image') || task.icon?.startsWith('/icon/') || task.icon?.startsWith('http');
    
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center animate-fade-in scale-95 transform transition-transform space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 bg-yellow-100/80 rounded-2xl inline-block">
                    {isImage ? <img src={task.icon} alt={task.text} className="w-16 h-16" /> : <span className="text-6xl">{task.icon}</span>}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800">
                    {task.text}
                </h2>
                
                <p className="text-gray-600">
                    {task.description}
                </p>

                <div className="bg-yellow-200/80 text-yellow-800 font-bold px-4 py-2 rounded-full inline-flex items-center">
                    <span>完成獎勵 +{task.points} 點</span>
                    <img src="https://api.iconify.design/twemoji/star.svg" alt="star" className="w-5 h-5 ml-1" />
                </div>
                
                <button
                    onClick={() => onComplete(task.id)}
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                >
                   我完成了！
                </button>

                 <button
                    onClick={onClose}
                    className="w-full bg-transparent text-gray-500 font-medium py-2 px-4 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                    還沒好
                </button>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
