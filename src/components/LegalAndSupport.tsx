import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Mail, Shield, FileCheck, Send, CheckCircle2 } from 'lucide-react';

interface LegalAndSupportProps {
  type: 'about' | 'contact' | 'privacy' | 'terms' | 'cookie-policy' | 'refund' | 'help';
}

export const LegalAndSupport: React.FC<LegalAndSupportProps> = ({ type }) => {
  const { setCurrentView, showToast } = useApp();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMsg = {
      id: `msg_${Date.now()}`,
      from: contactName,
      email: contactEmail,
      date: new Date().toISOString().split('T')[0],
      subject: contactSubject,
      body: contactMessage,
      status: 'unread',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('pdfgenius_contact_messages') || '[]');
      existing.unshift(newMsg);
      localStorage.setItem('pdfgenius_contact_messages', JSON.stringify(existing));
    } catch (err) {
      console.warn('Failed to save contact message:', err);
    }
    setIsSent(true);
    showToast('Your message has been sent to PDFGenius Support!', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* 1. ABOUT US */}
        {type === 'about' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About PDFGenius</h1>
            <p className="text-base text-slate-600 leading-relaxed">
              PDFGenius was created with a single mission: to provide professionals, teams, and individuals with a modern, lightning-fast, and completely secure PDF workstation that executes entirely inside the browser.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Our Privacy-First Architecture</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Most online PDF services upload user documents to unverified cloud servers where files may linger for hours or days. PDFGenius pioneered client-side WebAssembly rendering and in-memory byte manipulation. When you edit, compress, or sign a document on PDFGenius, your files never leave your computer's RAM.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-2xl font-bold font-mono text-emerald-600">22+</p>
                <p className="text-xs text-slate-500 mt-1">Specialized PDF Tools</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-2xl font-bold font-mono text-emerald-600">100%</p>
                <p className="text-xs text-slate-500 mt-1">In-Memory Security</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-2xl font-bold font-mono text-emerald-600">0s</p>
                <p className="text-xs text-slate-500 mt-1">Server Wait Queue</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT US */}
        {type === 'contact' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contact Support</h1>
              <p className="text-sm text-slate-500 mt-1">
                Have questions about our tools, enterprise pricing, or bug reports? Reach out to our team.
              </p>
            </div>

            {isSent ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Thank You!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Your message has been delivered to the PDFGenius engineering team. We will review and reply within 24 hours.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 max-w-lg text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Question about OCR / Enterprise plan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your inquiry..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. PRIVACY POLICY */}
        {type === 'privacy' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-slate-400 font-mono">Last updated: November 2026</p>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">1. Client-Side Document Processing</h2>
              <p>
                PDFGenius operates on a zero-retention architecture. Your documents and files are loaded directly into your web browser's memory using WebAssembly technologies. At no point are your uploaded document bytes transmitted or stored permanently on our remote servers.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">2. Local Storage and Preferences</h2>
              <p>
                We utilize your browser's standard LocalStorage to store your daily usage count and account preferences. This data remains on your physical device and can be cleared at any time.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">3. GDPR & CCPA Compliance</h2>
              <p>
                Because PDFGenius does not hold or inspect your confidential PDFs, contracts, tax files, or private records, we eliminate the primary vectors for document data breaches.
              </p>
            </div>
          </div>
        )}

        {/* 4. TERMS AND CONDITIONS */}
        {type === 'terms' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms & Conditions</h1>
            <p className="text-slate-400 font-mono">Effective: 2026</p>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By accessing and utilizing PDFGenius, you agree to comply with these terms of service and all applicable laws and regulations.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">2. Acceptable Use</h2>
              <p>
                You retain all rights, title, and intellectual property ownership of any documents you process with our tools. You agree not to use the service for any unlawful purposes or to forge documents maliciously.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900">3. Electronic Signatures</h2>
              <p>
                Digital signatures rendered through PDFGenius are electronic signatures designed for general commercial agreements. Users are responsible for verifying local jurisdiction validity.
              </p>
            </div>
          </div>
        )}

        {/* 5. REFUND POLICY */}
        {type === 'refund' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Refund Policy</h1>
            <p className="text-slate-400 font-mono">14-Day Money-Back Guarantee</p>
            <p>
              We want you to be 100% satisfied with PDFGenius Pro and Business subscriptions. If for any reason our platform does not meet your expectations within 14 days of your initial purchase, contact our support team for a full refund.
            </p>
          </div>
        )}

        {/* 6. HELP CENTER */}
        {type === 'help' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Help Center & Guides</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">How to Merge Multiple PDFs</h3>
                <p>Navigate to Merge PDF, drag and drop multiple files into the queue, reorder them as desired, and click Merge.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">How to Add Digital Signatures</h3>
                <p>Open any PDF in the Editor, select the Signature icon from the left toolbar, draw or type your name, and click to position it on your document.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">How to Compress File Size</h3>
                <p>Select Compress PDF, choose Medium or High compression, and download an optimized file with up to 80% size savings.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">How to Extract Text via OCR</h3>
                <p>Choose OCR Text Recognition to analyze scanned contracts, receipts, or photos, extracting selectable text automatically.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
