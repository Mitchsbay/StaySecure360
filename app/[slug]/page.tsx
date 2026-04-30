import { notFound, permanentRedirect } from 'next/navigation'
import { getArticleBySlug } from '@/lib/queries'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

// Some early generated/internal links may have exposed article slugs at the site root.
// If /some-article-slug matches a published article, permanently redirect it to the
// canonical /articles/some-article-slug URL. Otherwise return 404 so Google does not
// treat root-level slugs as duplicate article pages.
export default async function RootSlugRedirectPage({ params }: Props) {
  const article = await getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  permanentRedirect(`/articles/${article.slug}`)
}
