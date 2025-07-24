import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Suspense } from 'react';
import AxiosInterceptor from '../../component/interceptor/AxiosInterceptor'
import ReduxProvider from './ReduxProvider';

const roboto = Roboto({
  weight: '400',
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})
export const metadata: Metadata = {
  title: 'Safety Dashboard',
  description: 'by Thirdeye Ai',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <ReduxProvider>
          <AxiosInterceptor>
            <ToastContainer position="top-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light" />
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </AxiosInterceptor>
        </ReduxProvider>
      </body>
    </html>
  )
}
