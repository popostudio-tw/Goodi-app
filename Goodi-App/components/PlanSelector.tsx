
import React from 'react';
import { Plan } from '../types';

const PlanCard: React.FC<{
    title: string;
    price: string;
    priceSub?: string;
    features: string[];
    plan: Plan;
    currentPlan: Plan;
    onSelectPlan: (plan: Plan) => void;
    highlight: boolean;
}> = ({ title, price, priceSub, features, plan, currentPlan, onSelectPlan, highlight }) => {
    const isCurrent = plan === currentPlan;

    // Determine card classes based on plan type and state
    const baseClasses = 'border rounded-2xl p-6 transition-all duration-300 flex flex-col shadow-lg relative backdrop-blur-md';
    let planClasses = '';

    if (highlight) {
        // The most recommended plan (Premium)
        planClasses = 'bg-yellow-50/80 border-yellow-400 shadow-2xl shadow-yellow-200/60 -translate-y-2';
    } else if (plan === 'free') {
        // De-emphasize the free plan
        planClasses = 'bg-white/40 border-gray-200/60';
    } else {
        // Standard paid plan (Advanced)
        planClasses = 'bg-white/70 border-gray-200/60 hover:shadow-xl hover:-translate-y-1';
    }

    if (isCurrent) {
        // Style for the currently selected plan, overrides other styles
        planClasses = 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-500 ring-offset-2 ring-offset-transparent';
    }
    
    // Parse features to handle check/cross marks
    const featureList = features.map(feature => {
        const isIncluded = feature.startsWith("✔️");
        const isExcluded = feature.startsWith("❌");
        let text = feature;
        if (isIncluded || isExcluded) {
            text = feature.substring(2).trim();
        }
        return { text, included: isIncluded || !isExcluded };
    });

    return (
        <div className={`${baseClasses} ${planClasses}`}>
            {highlight && !isCurrent && <div className="absolute text-center bg-yellow-400 text-yellow-900 font-bold py-1 px-3 rounded-full top-0 right-4 -translate-y-1/2 shadow-md">推薦</div>}
            
            <h3 className="text-2xl font-bold text-gray-800 text-center mt-2">{title}</h3>
            <div className="my-4 text-center">
                 {priceSub ? (
                    <>
                        <p className="text-3xl font-bold text-gray-800">{price}</p>
                        <p className="text-sm text-gray-500 mt-1">{priceSub}</p>
                    </>
                ) : (
                    <p className="text-5xl font-extrabold text-gray-900">{price}</p>
                )}
            </div>
            <ul className="space-y-3 text-base mb-8 flex-grow">
                {featureList.map((feature, index) => {
                    const isHighlightedFeature = plan === 'paid499' && (feature.text === '讓孩子自訂學習任務' || feature.text === '樹洞');
                    return (
                    <li key={index} className="flex items-start">
                         <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                            {feature.included ? (
                                <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                         <span className={`ml-2 flex-1 ${feature.included ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'} flex items-center`}>
                            {feature.text}
                            {isHighlightedFeature && <img src="https://api.iconify.design/twemoji/sparkles.svg" alt="推薦" className="w-4 h-4 ml-1.5" />}
                        </span>
                    </li>
                )})}
            </ul>
            <button 
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent}
                className={`w-full font-bold py-3 px-4 rounded-lg transition-colors shadow-md text-lg 
                ${isCurrent ? 'bg-gray-400 text-white cursor-not-allowed' 
                : highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
                {isCurrent ? '目前方案' : '選擇方案'}
            </button>
        </div>
    )
}

interface PlanSelectorProps {
  currentPlan: Plan;
  onSelectPlan: (plan: Plan) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ currentPlan, onSelectPlan }) => {
    return (
        <div className="space-y-6 mt-8 border-2 border-dashed border-blue-300/50 rounded-2xl p-4 md:p-6 bg-white/30 backdrop-blur-sm">
            <h3 className="font-bold text-2xl text-gray-700 text-center">升級方案</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-2">
                <PlanCard
                    title="免費方案"
                    price="NT$ 0"
                    features={[
                        "✔️ 每日任務", "✔️ 神秘扭蛋機", "✔️ 獎品錢包", 
                        "❌ 修改每日任務", "❌ 修改扭蛋機獎品", "❌ 家長管理(基礎)", "❌ 番茄鐘", "❌ 讓孩子自訂學習任務",
                        "❌ 成就徽章", "❌ 樹洞", "❌ 親子時光", "❌ 習慣養成任務", "❌ 所有紀錄功能", "❌ AI 輔助撰寫"
                    ]}
                    plan="free"
                    currentPlan={currentPlan}
                    onSelectPlan={onSelectPlan}
                    highlight={false}
                />
                <PlanCard
                    title="進階方案"
                    price="NT$ 49/月"
                    priceSub="NT$ 199/一次性"
                    features={[
                        "✔️ 每日任務", "✔️ 神秘扭蛋機", "✔️ 獎品錢包", 
                        "✔️ 修改每日任務", "✔️ 修改扭蛋機獎品", "✔️ 家長管理(基礎)", "✔️ 番茄鐘", "❌ 讓孩子自訂學習任務",
                        "❌ 成就徽章", "❌ 樹洞", "❌ 親子時光", "❌ 習慣養成任務", "❌ 所有紀錄功能", "❌ AI 輔助撰寫"
                    ]}
                    plan="paid199"
                    currentPlan={currentPlan}
                    onSelectPlan={onSelectPlan}
                    highlight={false}
                />
                <PlanCard
                    title="高級方案"
                    price="NT$ 99/月"
                    priceSub="NT$ 499/一次性"
                    features={[
                        "✔️ 每日任務", "✔️ 神秘扭蛋機", "✔️ 獎品錢包", 
                        "✔️ 修改每日任務", "✔️ 修改扭蛋機獎品", "✔️ 家長管理(基礎)", "✔️ 番茄鐘", "✔️ 讓孩子自訂學習任務",
                        "✔️ 成就徽章", "✔️ 樹洞", "✔️ 親子時光", "✔️ 習慣養成任務", "✔️ 所有紀錄功能", "✔️ AI 輔助撰寫"
                    ]}
                    plan="paid499"
                    currentPlan={currentPlan}
                    onSelectPlan={onSelectPlan}
                    highlight={true}
                />
            </div>
      </div>
    );
};

export default PlanSelector;
