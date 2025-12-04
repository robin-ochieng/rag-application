'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent"
            >
              Kenbright GPT
            </Link>
            <Link 
              href="/auth" 
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-slate-500 mb-8">
            Last updated: December 4, 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-slate-600 mb-4">
                Kenbright (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use Kenbright GPT 
                (&quot;the Service&quot;).
              </p>
              <p className="text-slate-600">
                Please read this Privacy Policy carefully. By using the Service, you consent to the data practices 
                described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3 mt-6">
                2.1 Personal Information
              </h3>
              <p className="text-slate-600 mb-4">
                When you create an account or use our Service, we may collect:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Name and email address</li>
                <li>Account credentials (passwords are securely hashed)</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3 mt-6">
                2.2 Usage Information
              </h3>
              <p className="text-slate-600 mb-4">
                We automatically collect certain information when you use the Service:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Chat conversations and queries submitted to the AI</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and general location data</li>
                <li>Usage patterns and interaction data</li>
                <li>Timestamps and session duration</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3 mt-6">
                2.3 Cookies and Tracking Technologies
              </h3>
              <p className="text-slate-600">
                We use cookies and similar technologies to maintain your session, remember your preferences, 
                and improve your experience. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-slate-600 mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>To provide, maintain, and improve the Service</li>
                <li>To process and respond to your queries and requests</li>
                <li>To personalize your experience and provide relevant responses</li>
                <li>To communicate with you about updates, security alerts, and support</li>
                <li>To analyze usage patterns and improve AI model performance</li>
                <li>To detect, prevent, and address technical issues or security threats</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Data Storage and Security
              </h2>
              <p className="text-slate-600 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Encryption of data in transit using TLS/SSL protocols</li>
                <li>Secure cloud infrastructure with access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Password hashing using industry-standard algorithms</li>
              </ul>
              <p className="text-slate-600 mt-4">
                Your conversation data is stored securely and used to maintain chat history for your convenience. 
                You can delete your conversation history at any time through the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-slate-600 mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in 
                operating our Service (e.g., hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
                <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of Kenbright, 
                our users, or others</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-slate-600 mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data and account</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of certain data processing activities</li>
              </ul>
              <p className="text-slate-600 mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                7. Data Retention
              </h2>
              <p className="text-slate-600">
                We retain your personal information for as long as your account is active or as needed to provide 
                you with the Service. We may retain certain information for longer periods as required by law or 
                for legitimate business purposes, such as resolving disputes or enforcing our agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-slate-600">
                Your information may be transferred to and processed in countries other than your country of 
                residence. These countries may have different data protection laws. We ensure appropriate 
                safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                9. Children&apos;s Privacy
              </h2>
              <p className="text-slate-600">
                The Service is not intended for children under the age of 18. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately so we can take appropriate action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-slate-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to 
                review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                11. Contact Us
              </h2>
              <p className="text-slate-600 mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="text-slate-700 font-medium">Kenbright - Data Protection</p>
                <p className="text-slate-600">Email: privacy@kenbright.co.ke</p>
                <p className="text-slate-600">General Inquiries: info@kenbright.co.ke</p>
                <p className="text-slate-600">Nairobi, Kenya</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Kenbright. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

