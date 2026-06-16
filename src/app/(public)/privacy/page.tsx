export const metadata = {
  title: 'Privacy Policy | Stay Secure 360',
  description: 'Privacy Policy for Stay Secure 360 - learn how we protect your data and privacy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-300">
              Last updated: June 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 prose prose-invert max-w-none">
            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                Stay Secure 360 ("we", "us", "our", or "Company") operates the Stay Secure 360 website and related services.
                This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use
                our Service and the choices you have associated with that data.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Information Collection and Use</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, submit a form, or contact
                us. This may include:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Name and email address</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Account information and preferences</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Communication with our support team</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Usage data and analytics</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Use of Data</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the collected data for various purposes:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>To provide and maintain our Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>To notify you about changes to our Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>To allow you to participate in interactive features of our Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>To provide customer support and respond to your requests</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>To gather analysis or valuable information to improve our Service</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Security of Data</h2>
              <p className="text-gray-300 leading-relaxed">
                We are committed to protecting your personal information. However, no method of transmission over the Internet or
                electronic storage is 100% secure. While we strive to protect your personal data through encryption and other
                security measures, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at: contact@staysecure360.com
              </p>
            </section>
          </div>
        </div>
      </div>
  );
}
