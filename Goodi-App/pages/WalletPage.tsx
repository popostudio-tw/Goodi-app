
import React, { useState, useMemo } from 'react';
import { InventoryItem, Transaction } from '../types';
import { useUserData } from '../UserContext';

type WalletTab = 'inventory' | 'ledger';

const getTransactionIcon = (description: string) => {
    if (description.includes('完成任務')) return 'https://api.iconify.design/twemoji/star.svg';
    if (description.includes('購買獎勵')) return 'https://api.iconify.design/twemoji/wrapped-gift.svg';
    if (description.includes('積分兌換')) return 'https://api.iconify.design/twemoji/money-bag.svg';
    if (description.includes('神奇扭蛋機')) return 'https://api.iconify.design/twemoji/robot.svg';
    if (description.includes('專注番茄鐘')) return 'https://api.iconify.design/twemoji/stopwatch.svg';
    if (description.includes('分享給家人的事')) return 'https://api.iconify.design/twemoji/speaking-head.svg';
    if (description.includes('親子時光')) return 'https://api.iconify.design/twemoji/red-heart.svg';
    return 'https://api.iconify.design/twemoji/spiral-notepad.svg';
};

const groupTransactionsByDate = (transactions: Transaction[]) => {
    return transactions.reduce((groups, tx) => {
        const date = new Date(tx.timestamp).toLocaleDateString('zh-TW');
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
    }, {} as { [key: string]: Transaction[] });
};

interface WalletPageProps {
    onUseItem: (itemId: number) => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ onUseItem }) => {
    const { userData } = useUserData();
    const { inventory, transactions } = userData;
    const [activeTab, setActiveTab] = useState<WalletTab>('inventory');

    const InventoryView = () => {
        const handleRedemption = (itemId: number, itemName: string) => {
            // 添加警告提示
            const confirmMessage = `⚠️ 重要提醒\n\n請務必請家長執行兌換！\n\n一旦兌換了「${itemName}」，此獎勵將永久消失。\n\n確定要繼續嗎？`;

            if (window.confirm(confirmMessage)) {
                onUseItem(itemId);
            }
        };

        return (
            <div>
                {inventory.length > 0 ? inventory.map((item: InventoryItem) => {
                    const isTimeCoupon = item.action === 'parent_child_time';
                    return (
                        <div key={item.id} className={`bg-white/60 backdrop-blur-md p-4 rounded-xl shadow-md flex justify-between items-center transition-opacity border border-white/50 mb-3 ${item.used ? 'opacity-60' : ''}`}>
                            <div className="flex items-center space-x-4">
                                <img src={item.description} alt={item.name} className="h-12 w-12 object-contain" />
                                <div><p className="font-bold text-lg text-gray-800">{item.name}</p><p className="text-sm text-gray-500">獲得時間：{new Date(item.timestamp).toLocaleDateString()}</p></div>
                            </div>
                            <button
                                onClick={() => isTimeCoupon ? onUseItem(item.id) : handleRedemption(item.id, item.name)}
                                disabled={item.used}
                                className={`font-bold py-2 px-5 rounded-lg text-base transition-colors ${item.used ? 'bg-gray-300 text-gray-600' : isTimeCoupon ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            >
                                {item.used ? '已使用' : (isTimeCoupon ? '開始計時' : '兌換')}
                            </button>
                        </div>
                    )
                }) : <div className="text-center text-gray-500 py-12"><img src="https://api.iconify.design/twemoji/school-backpack.svg" alt="背包是空的" className="w-24 h-24 mx-auto mb-4" /><p className="text-xl">你的獎品背包是空的喔！</p></div>}
            </div>
        );
    };

    const LedgerView = () => {
        const groupedTransactions = useMemo(() => groupTransactionsByDate(transactions), [transactions]);
        return transactions.length === 0 ? <div className="text-center text-gray-500 py-12"><img src="https://api.iconify.design/twemoji/open-book.svg" alt="沒有紀錄" className="w-24 h-24 mx-auto mb-4" /><p className="text-xl">目前沒有任何紀錄。</p></div> :
            <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([date, txs]: [string, Transaction[]]) => (
                    <div key={date}><h3 className="font-bold text-gray-500 mb-2">{date}</h3><div className="space-y-3">{txs.map(tx => (
                        <div key={tx.id} className="bg-white/60 backdrop-blur-md p-3 rounded-xl shadow-sm flex items-center border border-white/50">
                            <div className="w-12 h-12 bg-white/40 rounded-lg flex items-center justify-center mr-4 border border-white/30"><img src={getTransactionIcon(tx.description)} alt="" className="w-8 h-8" /></div>
                            <div className="flex-grow"><p className="font-semibold text-gray-800 text-base">{tx.description}</p><p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</p></div>
                            <p className={`font-bold text-lg ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.replace(' 積分', '🌟').replace(' 代幣', '🪙')}</p>
                        </div>))}</div>
                    </div>))}
            </div>;
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
            <h2 className="text-4xl font-black text-slate-800 text-center">我的背包</h2>
            <div className="bg-slate-100/40 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-inner space-y-6 border border-white/40">
                <div className="flex bg-white/40 rounded-lg p-1 space-x-1 shadow-inner backdrop-blur-sm">
                    <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-3 text-lg font-bold rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-white/80 shadow text-blue-600' : 'text-gray-500'}`}>我的獎品</button>
                    <button onClick={() => setActiveTab('ledger')} className={`flex-1 py-3 text-lg font-bold rounded-md transition-colors ${activeTab === 'ledger' ? 'bg-white/80 shadow text-blue-600' : 'text-gray-500'}`}>我的帳本</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2">{activeTab === 'inventory' ? <InventoryView /> : <LedgerView />}</div>
            </div>
        </div>
    );
};

export default WalletPage;
