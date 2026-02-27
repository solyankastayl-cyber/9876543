import React from "react";

/**
 * Chrome Extension Privacy Policy Page
 * This page is required for Chrome Web Store submission.
 * Must be accessible without authentication at /privacy/chrome-extension
 */
export default function ChromeExtensionPrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">FOMO Platform</h1>
              <p className="text-sm text-gray-500">Privacy Policy — Chrome Extension</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy — FOMO Chrome Extension
          </h1>
          
          <p className="text-gray-500 mb-8">
            <strong>Effective date:</strong> February 3, 2025
          </p>

          <p className="text-gray-600 leading-relaxed">
            This Privacy Policy applies specifically to the <strong>FOMO Chrome Extension</strong> (the "Extension").
            If you use the FOMO web platform, a separate platform privacy policy may also apply.
          </p>

          <hr className="my-8 border-gray-200" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. What the Extension does</h2>
            <p className="text-gray-600 leading-relaxed">
              The Extension helps you connect your Twitter/X session to the FOMO platform by allowing you to 
              securely sync selected browser cookies <strong>only after you initiate the action</strong> (e.g., clicking "Sync Cookies").
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data we access</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              When you use the Extension, it may access the following data types:
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Cookies (Twitter/X only)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Extension can read cookies from <strong>twitter.com</strong> and <strong>x.com</strong> that are 
              required to verify that you are logged in and to enable the platform to request public content on your behalf.
            </p>
            <p className="text-gray-600 leading-relaxed mb-2">
              Examples of cookies that may be used (non-exhaustive):
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">auth_token</code></li>
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">ct0</code></li>
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">twid</code></li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Basic diagnostic signals (optional)</h3>
            <p className="text-gray-600 leading-relaxed mb-2">
              To help you troubleshoot, the Extension may generate local diagnostics such as:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Cookie count checks (e.g., whether required cookies exist)</li>
              <li>Expiration warnings</li>
              <li>Compatibility normalization (e.g., SameSite values)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Diagnostics are used to show human-friendly guidance in the Extension UI.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data we do NOT collect</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              The Extension is designed to minimize data collection. It does <strong>not</strong> intentionally collect:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Your Twitter/X password</li>
              <li>The content of your private messages (DMs)</li>
              <li>Your browsing history outside Twitter/X domains</li>
              <li>Unrelated cookies from other websites</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. When data is transmitted</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Extension transmits data to the FOMO backend <strong>only when you explicitly initiate syncing</strong> inside the Extension UI.
            </p>
            <p className="text-gray-600 leading-relaxed">
              There is no background syncing without user interaction unless you enable such functionality in the future and are clearly informed.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. How data is stored and protected</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Security measures</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Cookie data is transmitted over HTTPS.</li>
              <li>Cookie values are encrypted on the backend at rest.</li>
              <li>Access to syncing endpoints requires authorization (API key / token).</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 Retention</h3>
            <p className="text-gray-600 leading-relaxed">
              We retain synced session data only as long as necessary to provide the parsing/analytics features.
              You can disconnect your session and/or request deletion as described below.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your controls</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              You can control your data in the following ways:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>Disconnect:</strong> Use the platform settings to disconnect your Twitter integration (this removes the stored chat/session linkage and invalidates the session in the platform).</li>
              <li><strong>Remove Extension:</strong> Uninstalling the Extension stops any future access.</li>
              <li><strong>Log out of Twitter/X:</strong> Logging out invalidates session cookies and may stop parsing.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              We do not sell your data. We do not share your session cookies with third parties except:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Service providers strictly necessary to operate the platform (e.g., hosting), under confidentiality</li>
              <li>Legal compliance, if required by law</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to this policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this policy from time to time. If changes are material, we will update the effective date 
              and may provide additional notice within the platform.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy questions or requests, contact: <br />
              <a href="mailto:support@fomo.cx" className="text-blue-600 hover:text-blue-700 font-medium">
                support@fomo.cx
              </a>
            </p>
          </section>

          <hr className="my-8 border-gray-200" />

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm">
            <p>© 2025 FOMO Platform. All rights reserved.</p>
            <p className="mt-2">
              <a href="/" className="text-blue-600 hover:text-blue-700">
                Return to FOMO Platform
              </a>
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
