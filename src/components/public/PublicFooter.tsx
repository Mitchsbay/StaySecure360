import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-dark-950 border-t border-dark-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">
              Stay Secure <span className="text-primary-500">360</span>
            </h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Practical digital guides, checklists, and resources to help people protect their homes, families, businesses, and everyday life.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-dark-400 hover:text-primary-400 text-sm">Products</Link></li>
              <li><Link href="/articles" className="text-dark-400 hover:text-primary-400 text-sm">Articles</Link></li>
              <li><Link href="/categories" className="text-dark-400 hover:text-primary-400 text-sm">Categories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-dark-400 hover:text-primary-400 text-sm">About</Link></li>
              <li><Link href="/contact" className="text-dark-400 hover:text-primary-400 text-sm">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-dark-400 hover:text-primary-400 text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-dark-400 hover:text-primary-400 text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-8 pt-8 text-center">
          <p className="text-dark-500 text-sm">&copy; {new Date().getFullYear()} Stay Secure 360. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
