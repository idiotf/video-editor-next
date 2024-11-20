import type { Metadata } from 'next'
// import localFont from 'next/font/local'
import './globals.css'

// const geistSans = localFont({
//   src: './fonts/GeistVF.woff',
//   variable: '--font-geist-sans',
//   weight: '100 900',
// })
// const geistMono = localFont({
//   src: './fonts/GeistMonoVF.woff',
//   variable: '--font-geist-mono',
//   weight: '100 900',
// })

export const metadata: Metadata = {
  title: 'Video Editor',
  description: 'A simple video editor',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='h-full'>
      <body
        className='antialiased h-full bg-black text-white flex flex-col items-center justify-center font-sans'
      >
        {children}
      </body>
    </html>
  )
}
