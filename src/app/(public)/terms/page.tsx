export const metadata = {
  title: 'Terms of Service | Stay Secure 360',
  description: 'Terms of Service for Stay Secure 360 - understand the terms and conditions of using our platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-300">
              Last updated: June 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 prose prose-invert max-w-none">
            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using the Stay Secure 360 website and services, you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Use License</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on
                Stay Secure 360's website for personal, non-commercial transitory viewing only. This is the grant of a license,
                not a transfer of title, and under this license you may not:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Modifying or copying the materials</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Using the materials for any commercial purpose or for any public display</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Attempting to decompile or reverse engineer any software contained on the website</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Removing any copyright or other proprietary notations from the materials</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400 flex-shrink-0">▸</span>
                  <span>Transferring the materials to another person or "mirroring" the materials on any other server</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Disclaimer</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The materials on Stay Secure 360's website are provided on an "as is" basis. Stay Secure 360 makes no warranties,
                expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Limitations</h2>
              <p className="text-gray-300 leading-relaxed">
                In no event shall Stay Secure 360 or its suppliers be liable for any damages (including, without limitation,
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use
                the materials on Stay Secure 360's website, even if Stay Secure 360 or an authorized representative has been
                notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Accuracy of Materials</h2>
              <p className="text-gray-300 leading-relaxed">
                The materials appearing on Stay Secure 360's website could include technical, typographical, or photographic
                errors. Stay Secure 360 does not warrant that any of the materials on the website are accurate, complete, or
                current. Stay Secure 360 may make changes to the materials contained on the website at any time without notice.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Links</h2>
              <p className="text-gray-300 leading-relaxed">
                Stay Secure 360 has not reviewed all of the sites linked to its website and is not responsible for the contents
                of any such linked site. The inclusion of any link does not imply endorsement by Stay Secure 360 of the site.
                Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Modifications</h2>
              <p className="text-gray-300 leading-relaxed">
                Stay Secure 360 may revise these terms of service for the website at any time without notice. By using this
                website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which
                Stay Secure 360 operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at: contact@staysecure360.com
              </p>
            </section>
          </div>
        </div>
      </div>
  );
}
