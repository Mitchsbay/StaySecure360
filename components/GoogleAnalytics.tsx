'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Google Analytics 4 component for the Next.js App Router.
 *
 * Usage:
 * Add NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX to Vercel environment variables.
 * The component loads the Google tag once and sends page_view events on route changes.
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!measurementId || !window.gtag) return

    window.gtag('config', measurementId, {
      page_path: pathname,
      send_page_view: true,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    })
  }, [measurementId, pathname])

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  )
}
