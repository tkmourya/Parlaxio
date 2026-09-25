import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

function LegalPageLayout({ title, onBack, children }: LegalPageProps) {
  return (
    <div className="px-4 md:px-8 lg:px-12 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-36 min-h-screen text-white animate-in fade-in duration-300 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
      </div>
      <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-headings:text-white prose-strong:text-zinc-200 prose-a:text-red-500 space-y-6">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicyView({ onBack }: { onBack: () => void }) {
  return (
    <LegalPageLayout title="Privacy Policy" onBack={onBack}>
      <p className="text-sm font-medium border-b border-white/10 pb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h3>
        <p className="text-zinc-400 leading-relaxed">
          We collect information you provide directly to us when you create an account, such as your email address and name. We also automatically collect certain information about your device and how you interact with our service.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h3>
        <ul className="list-disc pl-5 text-zinc-400 space-y-2">
          <li><strong className="text-zinc-200">Personalization:</strong> To customize your experience and provide movie recommendations.</li>
          <li><strong className="text-zinc-200">Service Improvement:</strong> To monitor and analyze trends, usage, and activities.</li>
          <li><strong className="text-zinc-200">Communication:</strong> To send you technical notices, updates, and support messages.</li>
        </ul>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">3. Data Security</h3>
        <p className="text-zinc-400 leading-relaxed">
          We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards, no electronic transmission over the Internet can be guaranteed to be 100% secure.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">4. Contact Us</h3>
        <p className="text-zinc-400 leading-relaxed">
          If you have questions or comments about this Privacy Policy, please contact us at <a href="mailto:support@parlaxio.com" className="text-red-500 hover:text-red-400">support@parlaxio.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}

export function TermsView({ onBack }: { onBack: () => void }) {
  return (
    <LegalPageLayout title="Terms & Conditions" onBack={onBack}>
      <p className="text-sm font-medium border-b border-white/10 pb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">1. Agreement to Terms</h3>
        <p className="text-zinc-400 leading-relaxed">
          By accessing or using our services, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">2. Intellectual Property Rights</h3>
        <p className="text-zinc-400 leading-relaxed">
          The content on this platform, except for third-party content, is owned by or licensed to us, and is subject to copyright and other intellectual property rights under the law. We do not claim ownership of any third-party movie or TV show posters, data, or videos.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">3. User Responsibilities</h3>
        <ul className="list-disc pl-5 text-zinc-400 space-y-2">
          <li>You are responsible for safeguarding your account password.</li>
          <li>You must not use our service for any illegal or unauthorized purpose.</li>
          <li>You agree not to reproduce, duplicate, copy, or exploit any portion of the Service without express written permission.</li>
        </ul>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">4. Modifications</h3>
        <p className="text-zinc-400 leading-relaxed">
          We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice at any time.
        </p>
      </section>
    </LegalPageLayout>
  );
}

export function LegalDMCAView({ onBack }: { onBack: () => void }) {
  return (
    <LegalPageLayout title="Legal & DMCA Disclaimer" onBack={onBack}>
      <p className="text-sm font-medium border-b border-white/10 pb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl my-6">
        <h3 className="text-red-400 text-lg font-bold mt-0 mb-2">Important Legal Disclaimer</h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-0">
          <strong>Parlaxio DOES NOT host, store, or upload any media, videos, or files on its servers.</strong> This website is strictly an indexing tool (like Google Search) that simply links to publicly available content provided by third-party APIs (such as TMDB) and external servers on the internet.
        </p>
      </div>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">Copyright & DMCA Policy</h3>
        <p className="text-zinc-400 leading-relaxed">
          Parlaxio operates under the guidelines of the Digital Millennium Copyright Act (DMCA). Because we do not host any of the video files or media shown on this platform, we cannot delete any content from the internet. All video links are embedded from external, independent third-party sources over which we have zero control.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">To Copyright Owners</h3>
        <p className="text-zinc-400 leading-relaxed">
          If you believe your copyrighted work is being infringed upon, please note that <strong className="text-white">we do not host the files</strong>. You must contact the third-party video hosting provider directly to have the files removed from their servers. Once the content is removed from the third-party host, it will automatically be removed from Parlaxio as well.
        </p>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-white mb-2">No Liability</h3>
        <p className="text-zinc-400 leading-relaxed">
          By using Parlaxio, you agree that the owners, administrators, and developers of this site are not responsible for the legality, accuracy, compliance, or copyright status of any content linked or embedded herein. All trademarks, logos, and images are the property of their respective and rightful owners.
        </p>
      </section>
    </LegalPageLayout>
  );
}
