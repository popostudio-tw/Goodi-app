
import React from 'react';
import { ScoreEntry } from '../types';

interface ScoreReportProps {
    scores: ScoreEntry[];
}

const ScoreReport: React.FC<ScoreReportProps> = ({ scores }) => {
    if (scores.length === 0) {
        return (
            <div className="mt-6 bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
                <h3 className="font-bold text-lg mb-2 text-gray-700 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    成績報告
                </h3>
                <p className="text-sm text-gray-500 text-center py-4">目前還沒有成績回報喔！</p>
            </div>
        );
    }

    return (
        <div className="mt-6 bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
            <h3 className="font-bold text-lg mb-3 text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                成績報告
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {scores.map((entry) => (
                    <div key={entry.id} className="bg-teal-50/60 backdrop-blur-sm p-3 rounded-lg text-teal-800 border border-teal-200/60 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{entry.subject} - {entry.testType}</p>
                            <p className="text-xs text-teal-600">{entry.date}</p>
                        </div>
                        <div className="text-xl font-bold">{entry.score}分</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScoreReport;
