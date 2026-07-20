import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'NOVA AI — Chat Smarter. Think Deeper.',
  description: 'NOVA AI is a free, intelligent AI assistant powered by LLaMA 3.3 70B via Groq. Ask anything — code, science, writing, math.',
  keywords: ['AI chatbot', 'LLaMA', 'Groq', 'free AI', 'chat assistant', 'NOVA AI'],
  authors: [{ name: 'NOVA AI' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NOVA AI',
  },
  openGraph: {
    title: 'NOVA AI — Chat Smarter. Think Deeper.',
    description: 'Free intelligent AI assistant powered by LLaMA 3.3 70B. Ask anything.',
    type: 'website',
    url: 'https://nova-ai-ruddy-mu.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVA AI',
    description: 'Free AI assistant powered by LLaMA 3.3 70B via Groq',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c3aed'/><text y='.9em' font-size='80' font-weight='900' fill='white' font-family='Inter,sans-serif'>N</text></svg>" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NOVA AI" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} style={{ background: '#09090b', color: '#fafafa', overflow: 'hidden' }}>
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>

        {/* Register service worker for PWA */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('✅ SW registered:', reg.scope))
                  .catch(err => console.log('SW error:', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
