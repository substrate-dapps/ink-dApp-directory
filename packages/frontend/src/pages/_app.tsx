import { MantineProvider } from '@mantine/core'
import { ChakraProvider, DarkMode } from '@chakra-ui/react'
import { BaseLayout } from '@components/layout/BaseLayout'
import { HotToastConfig } from '@components/layout/HotToastConfig'
import { env } from '@config/environment'
import { getDeployments } from '@deployments/deployments'
import { cache } from '@emotion/css'
import { CacheProvider } from '@emotion/react'
import { UseInkathonProvider } from '@scio-labs/use-inkathon'
import GlobalStyles from '@styles/GlobalStyles'
import { DefaultSeo } from 'next-seo'
import type { AppProps } from 'next/app'
import { Inconsolata } from 'next/font/google'
import Head from 'next/head'
import Router from 'next/router'
import NProgress from 'nprogress'

// Router Loading Animation with @tanem/react-nprogress
Router.events.on('routeChangeStart', () => NProgress.start())
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())

// Google Fonts via next/font
const inconsolata = Inconsolata({
  subsets: ['latin'],
})

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo
        dangerouslySetAllPagesToNoFollow={!env.isProduction}
        dangerouslySetAllPagesToNoIndex={!env.isProduction}
        defaultTitle="ink!athon" // TODO
        titleTemplate="%s | ink!athon" // TODO
        description="Substrate-based Smart Contract & DApp Development Boilerplate" // TODO
        openGraph={{
          type: 'website',
          locale: 'en',
          url: env.url,
          site_name: 'ink!athon', // TODO
          images: [
            {
              url: `${env.url}/images/cover.jpg`, // TODO
              width: 1200,
              height: 675,
            },
          ],
        }}
        twitter={{
          handle: '@scio_xyz', // TODO
        }}
      />
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <style>{`
          :root {
            --font-inconsolata: ${inconsolata.style.fontFamily}, 'Inconsolata';
          }
        `}</style>
      </Head>
      <UseInkathonProvider
        appName="ink!athon" // TODO
        connectOnInit={true}
        defaultChain={env.defaultChain}
        deployments={getDeployments()}
      >
        <CacheProvider value={cache}>
          <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: 'dark' }}>
            <ChakraProvider>
              <DarkMode>
                <GlobalStyles />
                <BaseLayout>
                  <Component {...pageProps} />
                </BaseLayout>
                <HotToastConfig />
              </DarkMode>
            </ChakraProvider>
          </MantineProvider>
        </CacheProvider>
      </UseInkathonProvider>
    </>
  )
}

export default App
