'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="mb-4"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Privacy Policy for Manifest App
            </h1>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Welcome to Manifest ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Manifest mobile application (the "App").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Personal Information You Provide
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li><strong>Account Information:</strong> When you create an account, we may collect your email address, name, and authentication credentials if you choose to sign up using Google, Facebook, or Apple authentication services.</li>
                <li><strong>User Content:</strong> Your personal affirmations, manifestation texts, journal entries, and any images you choose to associate with your manifestations.</li>
                <li><strong>Preferences:</strong> Your notification preferences, reminder settings, and app customization choices.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Information Collected Automatically
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li><strong>Device Information:</strong> Device type, operating system version, unique device identifiers, and app version.</li>
                <li><strong>Usage Data:</strong> How you interact with the app, features used, and app performance metrics.</li>
                <li><strong>Log Data:</strong> Technical information about your use of the app, including crash reports and error logs.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Third-Party Services
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li><strong>Google Services:</strong> If you use Google authentication or image search features, Google's privacy policy applies to data collected by Google.</li>
                <li><strong>Supabase:</strong> Our backend service provider processes your data according to their privacy policy and our data processing agreements.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li>Provide, maintain, and improve the Manifest app</li>
                <li>Process your affirmations and manifestations</li>
                <li>Send you notifications and reminders based on your preferences</li>
                <li>Sync your data across devices when you're signed in</li>
                <li>Analyze app usage to improve user experience</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Ensure app security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Storage and Security
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Local Storage
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li>Your affirmations and manifestations are stored locally on your device</li>
                <li>This data remains private and is not transmitted to our servers unless you choose to sync</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Cloud Storage (Optional)
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li>If you create an account, your data can be synced to secure cloud storage</li>
                <li>Cloud data is encrypted and stored securely using Supabase's infrastructure</li>
                <li>You can disable cloud sync at any time</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Security Measures
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li>We implement industry-standard security measures to protect your data</li>
                <li>All data transmission is encrypted using HTTPS</li>
                <li>We regularly review and update our security practices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate the app (e.g., Supabase for data storage, Google for authentication)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Rights and Choices
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Access and Control
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li>View and edit your personal information through the app settings</li>
                <li>Delete your account and associated data at any time</li>
                <li>Export your data in a portable format</li>
                <li>In case if the user wants to delete their data manually, they can request to do so by sending an email to higoshme@gmail.com</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Data Retention
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
                <li>Local data remains on your device until you delete it</li>
                <li>Cloud data is retained while your account is active</li>
                <li>Deleted data is permanently removed from our systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Communication Preferences
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li>Control notification settings and frequency</li>
                <li>Opt out of non-essential communications</li>
                <li>Unsubscribe from email notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                The Manifest app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                International Data Transfers
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Third-Party Links and Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                <li>Posting the updated policy in the app</li>
                <li>Sending you a notification</li>
                <li>Updating the "Effective Date" at the top of this policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> higoshme@gmail.com</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Website:</strong> www.goshme.com</p>
                {/* <p className="text-gray-700 dark:text-gray-300"><strong>Address:</strong> [Your Business Address]</p> */}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                California Privacy Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA). Please contact us for more information about exercising these rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                European Privacy Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR). Please contact us for more information about exercising these rights.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 goshme.com All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
