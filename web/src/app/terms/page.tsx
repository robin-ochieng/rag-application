'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-slate-500 mb-8">
            Last updated: December 4, 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600 mb-4">
                By accessing and using Kenbright GPT (&quot;the Service&quot;), you acknowledge that you have read, 
                understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, 
                please do not use the Service.
              </p>
              <p className="text-slate-600">
                Kenbright GPT is an AI-powered assistant developed by Kenbright to provide intelligent responses 
                and assistance to users. The Service is designed for informational and productivity purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-slate-600 mb-4">
                Kenbright GPT provides AI-powered conversational assistance, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Answering questions and providing information</li>
                <li>Assisting with document analysis and summarization</li>
                <li>Providing guidance on insurance, IFRS 17, and related regulatory matters</li>
                <li>General productivity and research assistance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. User Responsibilities
              </h2>
              <p className="text-slate-600 mb-4">
                As a user of the Service, you agree to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Provide accurate information when creating an account</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Not use the Service for any unlawful, harmful, or fraudulent purposes</li>
                <li>Not attempt to bypass, disable, or interfere with the Service&apos;s security features</li>
                <li>Not share, distribute, or disclose confidential information obtained through the Service without authorization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Intellectual Property
              </h2>
              <p className="text-slate-600 mb-4">
                All content, features, and functionality of the Service, including but not limited to text, graphics, 
                logos, and software, are the exclusive property of Kenbright and are protected by international 
                copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-600">
                You retain ownership of any content you submit to the Service. By submitting content, you grant 
                Kenbright a non-exclusive, worldwide, royalty-free license to use, process, and analyze such content 
                solely for the purpose of providing the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Disclaimer of Warranties
              </h2>
              <p className="text-slate-600 mb-4">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express 
                or implied. Kenbright does not warrant that:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results obtained from the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>
              <p className="text-slate-600 mt-4">
                <strong>Important:</strong> AI-generated responses should not be considered as professional legal, 
                financial, or regulatory advice. Always consult with qualified professionals for critical decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-slate-600">
                To the fullest extent permitted by law, Kenbright shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits, revenue, data, or use, arising 
                out of or related to your use of the Service, regardless of the cause of action or the theory of 
                liability, even if Kenbright has been advised of the possibility of such damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                7. Modifications to Terms
              </h2>
              <p className="text-slate-600">
                Kenbright reserves the right to modify these Terms of Service at any time. We will notify users of 
                any material changes by posting the updated terms on this page with a new &quot;Last updated&quot; date. 
                Your continued use of the Service after such modifications constitutes your acceptance of the 
                revised terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                8. Termination
              </h2>
              <p className="text-slate-600">
                Kenbright may terminate or suspend your access to the Service immediately, without prior notice or 
                liability, for any reason, including breach of these Terms. Upon termination, your right to use the 
                Service will cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                9. Governing Law
              </h2>
              <p className="text-slate-600">
                These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard 
                to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the 
                exclusive jurisdiction of the courts located in Nairobi, Kenya.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                10. Contact Information
              </h2>
              <p className="text-slate-600 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="text-slate-700 font-medium">Kenbright</p>
                <p className="text-slate-600">Email: info@kenbright.co.ke</p>
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

