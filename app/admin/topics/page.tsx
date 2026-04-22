// Server component wrapper — exports force-dynamic so Next.js does not
// attempt to pre-render this page at build time without env vars.
export const dynamic = 'force-dynamic'

import TopicsClient from './TopicsClient'

export default function AdminTopicsPage() {
  return <TopicsClient />
}
