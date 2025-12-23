import { useNavigate } from 'react-router-dom';

export const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                <div className="text-6xl mb-4">😔</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">付款已取消</h2>
                <p className="text-gray-600 mb-6">
                    您已取消 PayPal 付款流程
                </p>

                <div className="text-left bg-orange-50 p-4 rounded-xl mb-6">
                    <p className="text-sm text-gray-700 mb-2">
                        💡 <span className="font-semibold">提示：</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Premium 會員可以解鎖昨日總結、AI 週報和每日亮點等功能，陪伴您更好地了解孩子的成長！
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/premium')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        重新嘗試升級
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        返回首頁
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
