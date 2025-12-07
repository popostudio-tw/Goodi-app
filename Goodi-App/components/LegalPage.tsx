
import React from 'react';

// We are re-using the same legal content object. 
// In a real-world scenario, you might want to fetch this from a single source.
const legalContent = {
    privacy: {
        title: '隱私權說明',
        content: `
            <p class="mb-4"><strong>最後更新日期：2024年7月25日</strong></p>
            <p class="mb-4">歡迎使用 Goodi App！我們非常重視您與您孩子的隱私權。本隱私權政策旨在說明我們如何收集、使用、分享及保護您的個人資訊。</p>
            
            <h3 class="font-bold text-lg mt-6 mb-2">1. 我們收集的資訊</h3>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>您提供的資訊：</strong>當您註冊時，我們會記錄您孩子的暱稱、年齡（選填），以及您設定的家長密碼（加密儲存）。</li>
                <li><strong>App 使用資訊：</strong>我們會記錄孩子完成的任務、獲得的積分與代幣、兌換的獎勵、扭蛋紀錄、成就解鎖狀態、心事樹洞內容等。</li>
                <li><strong>AI 互動資訊：</strong>當您使用 AI 相關功能（如 AI 任務建議、成長報告、心事樹洞回覆）時，相關的輸入與輸出內容可能會被處理以提供服務。</li>
            </ul>

            <h3 class="font-bold text-lg mt-6 mb-2">2. 我們如何使用資訊</h3>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li>提供並個人化 App 體驗。</li>
                <li>追蹤孩子的進度，並提供家長相關報告。</li>
                <li>透過 AI 模型提供智慧建議與互動回覆。</li>
                <li>分析使用數據以改善我們的服務。</li>
                <li>心事樹洞內容會經過 AI 安全模型掃描，若偵測到潛在的風險（如霸凌、自傷等），系統會將該訊息標示並分享至家長管理中心，以提醒您關心孩子的狀況。</li>
            </ul>

            <h3 class="font-bold text-lg mt-6 mb-2">3. 資訊分享</h3>
            <p class="mb-4">我們承諾，絕不會將您或您孩子的個人資訊出售、出租或交易給任何第三方。資訊僅在以下情況分享：</p>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>家長：</strong>孩子的活動紀錄與被標示的分享訊息，僅會在家長管理中心顯示。</li>
                <li><strong>服務提供商：</strong>我們使用 Google Gemini API 提供 AI 功能。您的輸入內容將被傳送至 Google 進行處理，其使用方式將遵循 Google 的隱私權政策。</li>
                <li><strong>法律要求：</strong>若基於法律要求或為保護我們的權利，我們可能必須揭露您的資訊。</li>
            </ul>

            <h3 class="font-bold text-lg mt-6 mb-2">4. 您的權利</h3>
            <p class="mb-4">根據中華民國《個人資料保護法》，您有權查詢、閱覽、複製、補充、更正、停止處理利用或刪除您與您孩子的個人資料。您可以透過我們的聯絡方式行使上述權利。</p>

            <h3 class="font-bold text-lg mt-6 mb-2">5. 聯絡我們</h3>
            <p>如果您對本隱私權政策有任何疑問，歡迎隨時透過電子郵件與我們聯繫：popo.studio@msa.hinet.net</p>
        `
    },
    terms: { // Changed 'copyright' to 'terms' to match the URL path
        title: '服務條款 (版權說明)',
        content: `
            <p class="mb-4"><strong>最後更新日期：2024年7月25日</strong></p>
            
            <h3 class="font-bold text-lg mt-6 mb-2">1. 應用程式內容</h3>
            <p class="mb-4">Goodi 應用程式內的所有內容，包括但不限於文字、圖形、Logo、圖示、圖像、音檔、以及軟體，均為 Goodi App 或其內容供應商的財產，並受到中華民國及國際版權法的保護。</p>

            <h3 class="font-bold text-lg mt-6 mb-2">2. 商標</h3>
            <p class="mb-4">「Goodi」以及相關的圖形和 Logo 是 Goodi App 的商標。未經我們事先書面同意，不得使用這些商標。</p>
            
            <h3 class="font-bold text-lg mt-6 mb-2">3. 使用者產生的內容</h3>
            <p class="mb-4">您或您的孩子在使用 App 過程中產生的內容（例如在「心事樹洞」中輸入的文字），其所有權仍歸您所有。然而，您授予我們一個全球性、非獨家、免版稅的許可，允許我們使用、複製、修改和展示這些內容，僅限於提供和改進 App 服務所需（例如，將文字傳送給 AI 模型以生成回覆）。</p>

            <h3 class="font-bold text-lg mt-6 mb-2">4. 第三方圖示</h3>
            <p class="mb-4">本應用程式中使用的部分圖示來自於 <a href="https://iconify.design/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Iconify</a> 設計，並依其相關授權條款使用。所有圖示的版權歸其各自的創作者所有。</p>

            <h3 class="font-bold text-lg mt-6 mb-2">5. 侵權通知</h3>
            <p>如果您認為您的版權作品在本應用程式中遭到侵害，請透過電子郵件與我們聯繫：popo.studio@msa.hinet.net</p>
        `
    }
};

interface LegalPageProps {
    type: 'privacy' | 'terms';
}

const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
    const { title, content } = legalContent[type];

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-8">
            <div 
                className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-lg p-6 max-w-4xl mx-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                </div>
                <div 
                    className="text-gray-700 leading-relaxed prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </div>
    );
};

export default LegalPage;
