import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CaptionForge — AI Caption Studio',
  description: 'Auto-generate captions in Hindi, English, Urdu and Hinglish with animated templates.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Bebas+Neue&family=Black+Han+Sans&family=Caveat:wght@600;700&family=Cinzel:wght@600;700;900&family=Fredoka:wght@600;700&family=Hind:wght@400;600;700&family=Montserrat:wght@400;600;700;800;900&family=Mukta:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Oswald:wght@600;700&family=Outfit:wght@400;600;700;800;900&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,600;1,600&family=Poppins:wght@400;500;600;700;800;900&family=Righteous&family=Roboto:wght@400;500;700;900&family=Rozha+One&family=Space+Mono:wght@700&family=Syne:wght@700;800&family=Titan+One&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white antialiased min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
