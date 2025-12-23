
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
          <h2 className="text-xl font-semibold border-b pb-2">4. 您的權利</h2>
          <p>
            根據您所在的位置，您可能擁有某些關於您個人資訊的權利，包括存取、更正或刪除您的個人資訊的權利。
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">5. 兒童隱私</h2>
          <p>
            我們的服務主要設計給家長和監護人管理，我們鼓勵家長積極參與和監督孩子的線上活動。我們不會故意從兒童那裡收集個人可識別資訊。如果我們發現我們在未經父母同意的情況下收集了兒童的個人資料，我們將採取措施從我們的伺服器上刪除該資訊。
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">6. 聯繫我們</h2>
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
            4. Your Rights
          </h2>
          <p>
            Depending on your location, you may have certain rights regarding
            your personal information, including the right to access, correct,
            or
            delete your personal information.
          </p>
          <h2 className="text-xl font-semibold border-b pb-2">
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
