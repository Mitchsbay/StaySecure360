# StaySecure360

StaySecure360 is a production-ready, SEO-optimised Next.js website and lightweight CMS built for practical security education. It covers both digital and physical security threats, featuring a public-facing educational site and a secure, authenticated admin dashboard powered by Supabase.

## Features

- **Public Educational Site**: SEO-friendly routing, responsive design, and fast server-side rendering using the Next.js App Router.
- **Built-in CMS**: Manage articles, topics, FAQs, and checklists directly from the admin dashboard.
- **AI Article Generator**: Secure, server-side integration with OpenAI to generate structured article drafts.
- **Supabase Integration**: Uses your existing Supabase project for database storage, authentication, and Row Level Security (RLS).
- **SEO Optimised**: Automatic sitemap generation, robots.txt, JSON-LD schema markup, and dynamic Open Graph metadata.
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS, and Lucide icons.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- An existing Supabase project
- An OpenAI API key (for the AI generator)
- A Vercel account (for deployment)

## Supabase Setup

You must configure your existing Supabase project before running the application.

1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Run the SQL scripts found in the `supabase/` directory in this exact order:
   - `schema.sql` (Creates tables and triggers)
   - `rls.sql` (Applies Row Level Security policies)
   - `seed.sql` (Inserts sample topics, articles, FAQs, and checklists)

## Environment Variables

Copy the example environment file to create your local configuration:

```bash
cp .env.local.example .env.local
```

Fill in the required values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (Project Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (Project Settings > API). **Never expose this to the client.**
- `OPENAI_API_KEY`: Your OpenAI API key (https://platform.openai.com/api-keys)
- `NEXT_PUBLIC_SITE_URL`: The canonical URL of your site (e.g., `http://localhost:3000` for local development)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the public site.
4. Open [http://localhost:3000/admin](http://localhost:3000/admin) to access the admin dashboard.

### Admin Access

To access the admin dashboard, you must sign in with a user account that has the `admin` or `editor` role.

1. Sign up a new user via your Supabase Authentication dashboard, or use an existing user.
2. In the Supabase Table Editor, open the `profiles` table.
3. Change the `role` column for your user from `viewer` to `admin`.
4. Log in at `/admin/login`.

## Deployment to Vercel

This project is configured for seamless deployment to Vercel.

1. Push your code to a GitHub repository.
2. Log in to Vercel and click **Add New... > Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add all the variables from your `.env.local` file. Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain (e.g., `https://staysecure360.com`).
5. Click **Deploy**.

### Connecting a Custom Domain

1. In your Vercel project dashboard, go to **Settings > Domains**.
2. Enter your custom domain (e.g., `staysecure360.com`) and click **Add**.
3. Follow the provided instructions to configure your DNS records (usually an A record pointing to Vercel's IP, or a CNAME record).

## Using the AI Article Generator

The AI generator is located at `/admin/generate-article`.

1. Enter a topic or prompt (e.g., "How to spot a phishing email").
2. Optionally specify the target audience, tone, and keywords.
3. Click **Generate Article Draft**.
4. The AI will return a structured draft including a title, slug, excerpt, content, FAQs, and checklist items.
5. Review the content carefully. AI-generated content should always be verified for accuracy.
6. Click **Save as Draft & Edit** to save the draft to Supabase and open it in the article editor.

## Project Structure

- `app/(public)/`: Public-facing pages (Home, Articles, Topics, About, Contact)
- `app/admin/`: Authenticated admin dashboard and CMS
- `app/api/`: Server-side API routes (e.g., OpenAI integration)
- `components/`: Reusable UI components, layout elements, and admin forms
- `lib/`: Utility functions, Supabase clients, database queries, and SEO helpers
- `supabase/`: SQL scripts for schema, RLS, and seed data
- `types/`: TypeScript interface definitions

## License

This project is provided for educational purposes.
