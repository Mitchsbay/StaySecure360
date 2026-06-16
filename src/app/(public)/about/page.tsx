export const metadata = {
  title: 'About | Stay Secure 360',
  description: 'Learn about Stay Secure 360 - your trusted source for digital guides, checklists, templates, and resources for safety, security, preparedness, and protection.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">About Stay Secure 360</h1>
            <p className="text-lg text-gray-300">
              Comprehensive resources for your digital safety and security
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Mission Section */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                Stay Secure 360 is dedicated to empowering individuals and organizations with practical digital guides,
                checklists, templates, and resources. We believe that security, safety, and preparedness should be accessible
                to everyone, regardless of their technical expertise.
              </p>
            </div>

            {/* What We Offer Section */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">What We Offer</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📋</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Practical Guides</h3>
                    <p className="text-gray-400">Step-by-step guides for implementing security best practices in your digital life.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Checklists</h3>
                    <p className="text-gray-400">Comprehensive checklists to ensure you don't miss critical security steps.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Templates & Resources</h3>
                    <p className="text-gray-400">Ready-to-use templates and resources for various security scenarios and industries.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Section */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Wide Coverage</h2>
              <p className="text-gray-300 mb-6">
                Our platform covers multiple niches and industries, providing specialized guidance for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">Personal Digital Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">Business Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">Emergency Preparedness</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">Data Protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">Privacy Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400">▸</span>
                  <span className="text-gray-300">And More</span>
                </div>
              </div>
            </div>

            {/* Commitment Section */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-400">Our Commitment</h2>
              <p className="text-gray-300 leading-relaxed">
                We are committed to providing accurate, up-to-date, and actionable information. Our resources are continuously
                updated to reflect the latest security trends and best practices, ensuring you always have access to current guidance
                for protecting yourself, your data, and your organization.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
