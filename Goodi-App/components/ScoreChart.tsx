import React, { useMemo, useCallback } from 'react';
import { ScoreEntry, Subject } from '../types';

interface ScoreChartProps {
    scores: ScoreEntry[];
}

const COLORS: Record<Subject, string> = {
    '國語': '#3b82f6', // blue-500
    '英語': '#14b8a6', // teal-500
    '數學': '#ef4444', // red-500
    '社會': '#f97316', // orange-500
    '自然': '#84cc16', // lime-500
};

const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
    if (scores.length < 2) {
        return <div className="text-center p-8 text-gray-500">成績紀錄少於兩筆，尚無法繪製圖表。</div>;
    }

    // Optimize: Prevent function recreation on re-renders, though React.memo handles the main prevention.
    const handleExportToCSV = useCallback(() => {
        if (scores.length === 0) return;
        
        const headers = ["id", "date", "subject", "testType", "score"];
        const csvRows = [
            headers.join(','),
            ...scores.map(s => [s.id, `"${s.date}"`, s.subject, s.testType, s.score].join(','))
        ];
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "goodi_score_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [scores]);

    const PADDING = 40;
    const WIDTH = 600;
    const HEIGHT = 250;
    const VIEW_WIDTH = WIDTH + PADDING * 2;
    const VIEW_HEIGHT = HEIGHT + PADDING * 2;

    // Optimize: Memoize expensive calculations for sorted scores and derived data
    // to prevent re-calculation on every render.
    const { sortedScores, uniqueDates, subjects, dataBySubject } = useMemo(() => {
        const sorted = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const dates = [...new Set(sorted.map(s => s.date))];
        const subjs = [...new Set(sorted.map(s => s.subject))];

        const bySubject = subjs.reduce((acc, subject) => {
            acc[subject] = sorted.filter(s => s.subject === subject);
            return acc;
        }, {} as Record<Subject, ScoreEntry[]>);

        return {
            sortedScores: sorted,
            uniqueDates: dates,
            subjects: subjs,
            dataBySubject: bySubject
        };
    }, [scores]);

    const getX = (date: string) => {
        const index = uniqueDates.indexOf(date);
        return PADDING + (index / (uniqueDates.length - 1)) * WIDTH;
    };

    const getY = (score: number) => {
        return PADDING + HEIGHT - (score / 100) * HEIGHT;
    };
    

    return (
        <div>
            <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="w-full h-auto">
                {/* Y-axis grid lines and labels */}
                {[0, 20, 40, 60, 80, 100].map(score => (
                    <g key={score}>
                        <line x1={PADDING} y1={getY(score)} x2={PADDING + WIDTH} y2={getY(score)} stroke="#e5e7eb" />
                        <text x={PADDING - 10} y={getY(score) + 5} textAnchor="end" fill="#6b7280" fontSize="12">{score}</text>
                    </g>
                ))}

                {/* X-axis labels */}
                {uniqueDates.map(date => (
                     <text key={date} x={getX(date)} y={PADDING + HEIGHT + 20} textAnchor="middle" fill="#6b7280" fontSize="12">
                        {new Date(date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                    </text>
                ))}

                {/* Data paths and points */}
                {Object.entries(dataBySubject).map(([subject, data]) => {
                    const scoresData = data as ScoreEntry[];
                    if (scoresData.length === 0) return null;
                    const pathD = scoresData
                        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(point.date)} ${getY(point.score)}`)
                        .join(' ');
                    
                    return (
                        <g key={subject}>
                            <path d={pathD} fill="none" stroke={COLORS[subject as Subject]} strokeWidth="2" />
                            {scoresData.map(point => (
                                <circle key={point.id} cx={getX(point.date)} cy={getY(point.score)} r="4" fill={COLORS[subject as Subject]} />
                            ))}
                        </g>
                    )
                })}
            </svg>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2">
                {subjects.map(subject => (
                    <div key={subject} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: COLORS[subject] }}></div>
                        <span className="text-sm text-gray-600">{subject}</span>
                    </div>
                ))}
            </div>
            <div className="text-right mt-4">
                <button onClick={handleExportToCSV} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-700">匯出成Excel</button>
            </div>
        </div>
    );
};

// Optimize: Wrap in React.memo to prevent expensive SVG re-renders when parent state changes but scores remain the same.
export default React.memo(ScoreChart);
