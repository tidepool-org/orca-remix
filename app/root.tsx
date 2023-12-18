import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

import {
  Button,
  defaultTheme,
  Flex,
  Grid,
  Provider,
  View,
} from '@adobe/react-spectrum';

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Provider theme={defaultTheme}>
          <Grid
            areas={{
              base: ['header', 'nav', 'content', 'footer'],
              M: [
                'header   header',
                'nav      content',
                'nav      content',
                'footer   footer',
              ],
              L: [
                'header header  header',
                'nav    content toc',
                'nav    content toc',
                'footer footer  footer',
              ],
            }}
            columns={{
              M: ['size-2000', '1fr'],
              L: ['size-2000', '1fr', 'size-2000'],
            }}
            gap="size-100"
          >
            <View
              backgroundColor="celery-600"
              gridArea="header"
              height="size-1000"
            />
            <View backgroundColor="blue-600" gridArea="nav">
              <Flex
                direction={{ base: 'row', M: 'column' }}
                gap="size-100"
                margin="size-100"
              >
                <View
                  backgroundColor="static-gray-50"
                  height="size-250"
                  minWidth="size-900"
                />
                <View
                  backgroundColor="static-gray-50"
                  height="size-250"
                  minWidth="size-900"
                />
                <View
                  backgroundColor="static-gray-50"
                  height="size-250"
                  minWidth="size-900"
                />
              </Flex>
            </View>
            <View
              backgroundColor="purple-600"
              gridArea="content"
              height="size-4600"
            >
              <Button variant="accent" onPress={() => alert('Hey there!')}>
                Hello React Spectrum!
              </Button>
            </View>
            <View
              backgroundColor="magenta-600"
              gridArea="toc"
              minHeight="size-1000"
              isHidden={{ base: true, L: false }}
            />
            <View
              backgroundColor="seafoam-600"
              gridArea="footer"
              height="size-1000"
            />
          </Grid>
        </Provider>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
