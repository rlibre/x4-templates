# x4js templates

Project templates for [x4js](https://github.com/rlibre/x4), used by `x4js create`.

| Template | Description |
|---|---|
| `app` | Standard x4 application (default) |
| `minimal` | Minimal x4 application |
| `hosted` | x4 application ready for Vercel, Netlify or Cloudflare Pages |
| `electron` | x4 desktop application with Electron |
| `wails` | x4 desktop application with Go and Wails |

## Create a project

```
npx x4js create my-app
npx x4js create my-app --template hosted
```

Then, in the project folder:

```
npm run dev
npm run build
```

`npm run build` writes the application to `bin`.

## Deploy

An x4js application is a static site: any static host can serve the `bin` folder.

The `hosted` template is the `app` template plus the configuration for Vercel and Netlify, so it deploys without any setting. These buttons copy it to your own Git account and put it online:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frlibre%2Fx4-templates%2Ftree%2Fmain%2Fhosted)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rlibre/x4-templates&create_from_path=hosted)

For Cloudflare Pages, and for routes without `#`, see the [README of the template](hosted/README.md).
