
import React, { useState } from 'react';
import { Subject, TestType } from '../types';

interface TestScoreModalProps {
    onClose: () => void;
    onReport: (details: { subject: Subject; testType: TestType; score: number }) => void;
}

const subjects: Subject[] = ['國語', '英語', '數學', '社會', '自然'];
const testTypes: TestType[] = ['小考', '大考'];

const TestScoreModal: React.FC<TestScoreModalProps> = ({ onClose, onReport }) => {
    const [subject, setSubject] = useState<Subject | null>(null);
    const [testType, setTestType] = useState<TestType | null>(null);
    const [score, setScore] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const scoreNum = parseInt(score, 10);
        if (subject && testType && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
            onReport({ subject, testType, score: scoreNum });
            onClose();
        } else {
            // Basic validation feedback
            alert("請確實選擇科目、考試類型，並輸入 0-100 的分數！");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center animate-fade-in scale-95 transform transition-transform space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 bg-yellow-100/80 rounded-2xl inline-block">
                    <img src="https://api.iconify.design/twemoji/memo.svg" alt="分享成績" className="w-16 h-16" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800">
                    分享成績
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="font-bold text-gray-700">科目</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {subjects.map(s => (
                                <button type="button" key={s} onClick={() => setSubject(s)} className={`p-2 rounded-lg transition-colors text-sm ${subject === s ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-bold text-gray-700">考試類型</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           {testTypes.map(t => (
                                <button type="button" key={t} onClick={() => setTestType(t)} className={`p-2 rounded-lg transition-colors ${testType === t ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{t}</button>
                           ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="score" className="font-bold text-gray-700">分數</label>
                        <input
                            type="number"
                            id="score"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            min="0"
                            max="100"
                            placeholder="請輸入分數"
                            className="w-full mt-2 p-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                    >
                       分享成績
                    </button>
                </form>

                 <button
                    onClick={onClose}
                    className="w-full bg-transparent text-gray-500 font-medium py-2 px-4 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                    取消
                </button>
            </div>
        </div>
    );
};

export default TestScoreModal;
