# Orca 2.0

Internal admin tool for [Tidepool](https://www.tidepool.org/), built with React Router v7 (SSR), HeroUI, and Tailwind CSS.

## Development

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
node server.mjs
```

Or with Docker:

```sh
docker build -t orca-remix .
docker run -p 3000:3000 orca-remix
```
