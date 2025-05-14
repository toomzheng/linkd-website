import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="container max-w-[700px] mx-auto p-[2rem_0.8rem_0.5rem]">
      <Link href="/" className="inline-block mb-4 hover:underline">&larr; Back to Home</Link>
      
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="mb-3">Welcome to Sentinel. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use our services.</p>
          <p>We may update these Terms from time to time. Your continued use of Sentinel after any changes to the Terms constitutes your acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
          <p>Sentinel is a networking platform that connects alumni and professionals from various educational institutions. Our service allows users to create profiles, search for connections, and communicate with other members of the network.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Account Registration and Security</h2>
          <p className="mb-3">To use certain features of our service, you may need to create an account. When creating an account, you agree to:</p>
          <ul className="list-disc pl-5">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. User Conduct</h2>
          <p className="mb-3">You agree not to use the Service to:</p>
          <ul className="list-disc pl-5">
            <li>Violate any applicable laws or regulations</li>
            <li>Impersonate any person or entity</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Upload or transmit viruses or malicious code</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Collect or store personal data about other users without permission</li>
            <li>Post content that is unlawful, offensive, threatening, libelous, defamatory, or otherwise objectionable</li>
            <li>Engage in commercial activities without our prior written consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Intellectual Property Rights</h2>
          <p className="mb-3">The Service and its original content, features, and functionality are owned by Linkd Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
          <p>By submitting content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with providing the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
          <p>In no event shall Linkd Inc., its directors, employees, partners, agents, suppliers, or affiliates be liable for:</p>
          <ul className="list-disc pl-5">
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
            <li>Damages resulting from interruption of service or inability to access the service</li>
            <li>Damages resulting from unauthorized access to or use of our servers</li>
            <li>Any damages arising out of or in connection with your use or inability to use the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Disclaimer of Warranties</h2>
          <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Termination</h2>
          <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including, without limitation, if you breach these Terms. Upon termination, your right to use the Service will immediately cease.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any legal action or proceeding relating to your access to or use of the Service shall be instituted in federal courts of the United States.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:founders@linkd.inc" className="text-blue-600 hover:underline">founders@linkd.inc</a>.</p>
        </section>

        <p className="text-sm text-gray-500 mt-8">Last updated: May 11, 2025</p>
      </div>
      
      <div className="text-center mt-12 mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link> | <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
      </div>
    </div>
  );
} 