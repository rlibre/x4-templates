# x4js application

An [x4js](https://x4js.org) application, ready to deploy on Vercel, Netlify or Cloudflare Pages.

## Develop

```
npm install
npm run dev
```

`npm run dev` serves the application on port 9000 and reloads it on every change.

## Build

```
npm run build
```

The application is written to `bin`. It is a static site: any static host can serve that folder.

## Deploy

Push the project to a Git repository, then import that repository from the host. Every push is then built and put online.

| Host | Configuration |
|---|---|
| Vercel | `vercel.json`, nothing to set |
| Netlify | `netlify.toml`, nothing to set |
| Cloudflare Pages | In the project settings: build command `npm run build`, build output directory `bin` |

You can delete the file of a host you do not use.

### From your machine, without Git

Each host has a command line that puts the project online from the project folder. The first run asks you to log in and to create or choose the project.

| Host | Command | Build |
|---|---|---|
| Vercel | `npx vercel --prod` | Done by Vercel |
| Netlify | `npx netlify deploy --prod --dir bin` | Done by the command, before the upload |
| Cloudflare Pages | `npx wrangler pages deploy bin` | Not done: run `npm run build` first |

For Cloudflare Pages, create the project once with `npx wrangler pages project create`.

## Routes without `#`

`Router` uses hash URLs (`/#/users/12`) by default, which work on every host with nothing to configure.

With `new Router(false)` the URLs are real paths (`/users/12`), and the host must answer them with `index.html`:

- Vercel, in `vercel.json`:
	```json
	"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
	```
- Netlify, in `netlify.toml`:
	```toml
	[[redirects]]
	from = "/*"
	to = "/index.html"
	status = 200
	```
- Cloudflare Pages: nothing to do, as long as the project has no `404.html`.
