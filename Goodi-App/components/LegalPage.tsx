
import { Link } from "react-router-dom";

const LegalPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-gray-800">
      <div id="privacy-chinese">
        <h1 className="text-3xl font-bold mb-4">隱私權政策</h1>
        <p className="text-sm text-gray-500 mb-8">最後更新日期：2024年7月26日</p>
        <div className="space-y-6">
          <p>
            本隱私權政策說明了 Goodi（“我們”）如何收集、使用和揭露您的資訊。本隱私權政策適用於所有我們的服務和應用程式（統稱為“服務”）。
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">
            1. 我們收集的資訊
          </h2>
          <p>我們可能收集的個人資訊包括：</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              <strong>您提供的資訊：</strong>{" "}
              當您註冊帳戶、建立或修改個人資料、設定偏好、透過我們的服務進行購買、或以其他方式與我們溝通時，您可能會提供個人資訊，例如您的姓名、電子郵件地址、電話號碼和支付資訊。
            </li>
            <li>
              <strong>使用服務自動收集的資訊：</strong>{" "}
              當您使用我們的服務時，我們會自動記錄資訊，包括您使用的服務類型、設定、以及您的
              IP 位址、瀏覽器類型、作業系統、推薦/退出頁面、日期/時間戳。
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">
            2. 我們如何使用您的資訊
          </h2>
          <p>我們使用您的資訊的目的包括：</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>提供、操作和維護我們的服務。</li>
            <li>改進、個人化和擴展我們的服務。</li>
            <li>了解和分析您如何使用我們的服務。</li>
            <li>開發新產品、服務、功能和能力。</li>
            <li>
              出於合規目的，包括執行我們的服務條款，或法律要求或法院命令可能要求的其他法律權利。
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">
            3. 我們如何分享您的資訊
          </h2>
          <p>我們不會與第三方分享您的個人資訊，除非在以下情況之一：</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>經您同意。</li>
            <li>
              用於法律原因：如果我們真誠地相信存取、使用、保存或揭露資訊是合理必要的，以滿足任何適用法律、法規、法律程序或可執行的政府要求。
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">4. 第三方服務</h2>
          <p>我們使用以下第三方服務來提供我們的功能：</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              <strong>Firebase (Google Cloud Platform)：</strong>{" "}
              我們使用Firebase來提供後端服務，包括用戶認證、資料存儲（Firestore）、雲端函數（Cloud Functions）和分析（Analytics）。您的資料將根據Google的隱私政策處理。
            </li>
            <li>
              <strong>Google Gemini AI：</strong>{" "}
              我們使用Google Gemini AI來提供智能內容生成、成長報告和AI助手功能。您的對話數據將用於生成個性化建議，但不會用於訓練Google的AI模型。
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">5. 您的權利</h2>
          <p>
            根據您所在的位置，您可能擁有某些關於您個人資訊的權利，包括：
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>存取權：</strong> 您可以要求查看我們持有的您的個人資料。</li>
            <li><strong>更正權：</strong> 您可以要求更正不準確的個人資料。</li>
            <li><strong>刪除權：</strong> 您可以隨時要求刪除您的帳號和所有相關資料。</li>
          </ul>
          <h3 className="text-lg font-semibold mt-4 mb-2">⭐ 帳號刪除</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="mb-2">您可以隨時刪除您的帳號。刪除帳號的步驟如下：</p>
            <ol className="list-decimal list-inside space-y-2 pl-4 mb-3">
              <li>登入應用程式</li>
              <li>進入「家長模式」</li>
              <li>前往「設定」頁面</li>
              <li>點擊「帳號管理」中的「刪除帳號」按鈕</li>
              <li>確認您要刪除帳號</li>
            </ol>
            <p className="font-semibold text-red-600 mb-2">⚠️ 刪除帳號後，以下資料將永久移除且無法恢復：</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>所有任務紀錄</li>
              <li>成績歷史</li>
              <li>AI成長報告</li>
              <li>心事樹洞對話</li>
              <li>每日亮點</li>
              <li>訂閱方案（如有）</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              帳號刪除將立即執行。基於合規要求，我們會保留刪除記錄（僅包含用戶ID和刪除時間）30天。
            </p>
          </div>
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">6. 兒童隱私</h2>
          <p>
            我們的服務主要設計給家長和監護人管理，我們鼓勵家長積極參與和監督孩子的線上活動。我們不會故意從兒童那裡收集個人可識別資訊。如果我們發現我們在未經父母同意的情況下收集了兒童的個人資料，我們將採取措施從我們的伺服器上刪除該資訊。
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">7. 聯繫我們</h2>
          <p>
            如果您對本隱私權政策有任何疑問，請透過電子郵件聯繫我們：
            <a
              href="mailto:popo.studio@msa.hinet.net"
              className="text-blue-600 hover:underline"
            >
              popo.studio@msa.hinet.net
            </a>
          </p>
        </div>
      </div>

      <hr className="my-16 border-gray-300" />

      <div id="privacy-english">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: 2024-07-26
        </p>
        <div className="space-y-6">
          <p>
            This Privacy Policy describes how Goodi ("we," "us," or
            "our") collects, uses, and discloses your information. This Privacy
            Policy applies to all of our services and applications
            (collectively, the "Services").
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">
            1. Information We Collect
          </h2>
          <p>Personal information we may collect includes:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              <strong>Information You Provide:</strong> You may provide personal
              information when you sign up for an account, create or modify your
              profile, set preferences, make purchases through, or otherwise
              communicate with us through our Services, such as your name, email
              address, phone number, and payment information.
            </li>
            <li>
              <strong>Information Collected Automatically Through Use of the
                Services:</strong> We automatically record information when you use
              our Services, including the types of Services you use, your
              settings, and your IP address, browser type, operating system,
              referring/exit pages, and date/time stamps.
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">
            2. How We Use Your Information
          </h2>
          <p>We use your information for purposes including:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>To provide, operate, and maintain our Services.</li>
            <li>To improve, personalize, and expand our Services.</li>
            <li>To understand and analyze how you use our Services.</li>
            <li>
              To develop new products, services, features, and functionality.
            </li>
            <li>
              For compliance purposes, including enforcing our Terms of Service,
              or other legal rights as may be required by applicable laws and
              regulations or requested by any judicial process or governmental

              agency.
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">
            3. How We Share Your Information
          </h2>
          <p>
            We do not share your personal information with third parties except
            in one of the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>With your consent.</li>
            <li>
              For legal reasons: If we have a good-faith belief that access,
              use, preservation or disclosure of the information is reasonably
              necessary to meet any applicable law, regulation, legal process or
              enforceable governmental request.
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2">
            4. Third-Party Services
          </h2>
          <p>We use the following third-party services to provide our functionality:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              <strong>Firebase (Google Cloud Platform):</strong>{" "}
              We use Firebase to provide backend services, including user authentication, data storage (Firestore), cloud functions, and analytics. Your data will be processed according to Google's Privacy Policy.
            </li>
            <li>
              <strong>Google Gemini AI:</strong>{" "}
              We use Google Gemini AI to provide intelligent content generation, growth reports, and AI assistant features. Your conversation data is used to generate personalized recommendations but is not used to train Google's AI models.
            </li>
          </ul>
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">
            5. Your Rights
          </h2>
          <p>
            Depending on your location, you may have certain rights regarding
            your personal information, including:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Right to Access:</strong> You may request to view the personal data we hold about you.</li>
            <li><strong>Right to Correction:</strong> You may request correction of inaccurate personal data.</li>
            <li><strong>Right to Deletion:</strong> You may request deletion of your account and all related data at any time.</li>
          </ul>
          <h3 className="text-lg font-semibold mt-4 mb-2">⭐ Account Deletion</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="mb-2">You can delete your account at any time. To delete your account:</p>
            <ol className="list-decimal list-inside space-y-2 pl-4 mb-3">
              <li>Log into the application</li>
              <li>Enter "Parent Mode"</li>
              <li>Go to the "Settings" page</li>
              <li>Click "Delete Account" in the "Account Management" section</li>
              <li>Confirm that you want to delete your account</li>
            </ol>
            <p className="font-semibold text-red-600 mb-2">⚠️ After deleting your account, the following data will be permanently removed and cannot be recovered:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>All task records</li>
              <li>Grade history</li>
              <li>AI growth reports</li>
              <li>Whisper tree conversations</li>
              <li>Daily highlights</li>
              <li>Subscription plan (if any)</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Account deletion is executed immediately. For compliance purposes, we retain deletion logs (containing only user ID and deletion timestamp) for 30 days.
            </p>
          </div>
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">
            5. Children's Privacy
          </h2>
          <p>
            Our Services are designed to be managed by parents and guardians,
            and we encourage parental involvement and supervision of children's
            online activities. We do not knowingly collect personally
            identifiable information from children. If we discover that we have
            collected personal data from a child without parental consent, we
            will take steps to remove that information from our servers.
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">
            6. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us by email at:{" "}
            <a
              href="mailto:popo.studio@msa.hinet.net"
              className="text-blue-600 hover:underline"
            >
              popo.studio@msa.hinet.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LegalPage;
