import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-[700px] mx-auto p-[2rem_0.8rem_0.5rem]">
      <Link href="/" className="inline-block mb-4 hover:underline">&larr; Back to Home</Link>
      
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="mb-3">Welcome to Sentinel ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          <p>By accessing or using Sentinel, you consent to the practices described in this Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="mb-3">We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-5 mb-3">
            <li>Account information (name, email address, profile photo)</li>
            <li>Profile information (education history, work experience, skills, interests)</li>
            <li>Content you create, share, or post</li>
            <li>Communications with other users</li>
            <li>Feedback and correspondence you provide to us</li>
          </ul>
          <p>We also automatically collect certain information when you use our service, including device information, usage data, and information collected through cookies and similar technologies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-5">
            <li>Provide, maintain, and improve our services</li>
            <li>Create and maintain your account</li>
            <li>Connect you with other alumni and professionals</li>
            <li>Process and complete transactions</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Understand how users interact with our services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Sharing Your Information</h2>
          <p className="mb-3">We may share your information with third parties in the following circumstances:</p>
          <ul className="list-disc pl-5">
            <li>With other users, according to your privacy settings</li>
            <li>With service providers who perform services on our behalf</li>
            <li>For legal purposes, if required by applicable law or legal process</li>
            <li>In connection with a business transaction, such as a merger or acquisition</li>
            <li>With your consent or at your direction</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
          <p className="mb-3">Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-5">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate or incomplete information</li>
            <li>Deletion of your personal information</li>
            <li>Restriction of processing of your personal information</li>
            <li>Data portability</li>
            <li>Objection to processing of your personal information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the Service or by other means. Your continued use of Sentinel after the effective date of the revised Privacy Policy constitutes your acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us at <a href="mailto:founders@linkd.inc" className="text-blue-600 hover:underline">founders@linkd.inc</a>.</p>
        </section>

        <p className="text-sm text-gray-500 mt-8">Last updated: May 11, 2025</p>
      </div>
      
      <div className="text-center mt-12 mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link> | <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
      </div>
    </div>
  );
} 