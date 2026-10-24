# DavIT Futures – company website

**English** · [Polski](README.pl.md)

[![Deploy to GitHub Pages](https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor/actions/workflows/deploy.yml/badge.svg)](https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor/actions/workflows/deploy.yml)
![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)
![Blazor WebAssembly](https://img.shields.io/badge/Blazor-WebAssembly-5C2D91?logo=blazor&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/hosted%20on-GitHub%20Pages-222?logo=github)

The website of **DavIT Futures**, a software house from Wrocław, Poland, building .NET and Angular software for finance, trading and SaaS.
It is a single-page business card written entirely in C# with **Blazor WebAssembly** and served as static files from **GitHub Pages**, with no backend to run or pay for.

**Live site:** https://davit-futures.github.io/DavITFuturesWebSite_Blazor/

## What's on the site

- **Hero** with the company pitch, key numbers and calls to action
- **About** – the person behind the company, photo and quick facts
- **Services** and **How we work** – what we deliver and how a project runs, step by step
- **Technology** – the stack grouped by area (backend, frontend, mobile, DevOps, AI)
- **Projects** – selected commercial projects with client, years, outcome and tags
- **Testimonials** – recommendations from people we worked with
- **CV** – short and full versions, each as a web page and a printable PDF
- **Contact** – e-mail, LinkedIn and company details

Everything is available in **English and Polish** (switchable at runtime) and in a **dark and light theme**. Both choices are remembered in the browser, and the layout is fully responsive.

## Tech stack

| Area | Technology |
| --- | --- |
| UI framework | Blazor WebAssembly on **.NET 10**, Razor components |
| Language | C# 14 with nullable reference types, records for the content model |
| Styling | Hand-written CSS with custom properties (no CSS framework), Inter font |
| Content | One JSON file per language, loaded at runtime and deserialized into typed records |
| State | A small scoped `SiteState` service (language, theme, content) with change notifications |
| Browser interop | A tiny JS helper for `localStorage` and an inline script that sets theme and language before Blazor starts, so the page never flickers |
| CI/CD | GitHub Actions: `dotnet publish` → GitHub Pages on every push to `main` |
| Hosting | GitHub Pages (static files, `404.html` fallback for client-side routing) |

## Project structure

```
src/DavITFutures.Web/
├── Components/        # one Razor component per section (Hero, About, Projects, ...)
├── Layout/            # MainLayout: header, main content, footer, page title and meta
├── Models/            # SiteContent.cs – typed model of the JSON content
├── Pages/             # Home and NotFound
├── Services/          # SiteState – language, theme and content loading
└── wwwroot/
    ├── content/       # en.json, pl.json – all texts of the site
    ├── css/app.css    # styles and both themes
    ├── cv/            # CV pages (HTML) and PDFs, short and full
    ├── img/           # photos
    └── js/site.js     # localStorage helpers
```

## Running locally

Requirements: [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
git clone https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor.git
cd DavITFuturesWebSite_Blazor
dotnet run --project src/DavITFutures.Web
```

Then open the address printed in the console. To build the production files the same way CI does:

```bash
dotnet publish src/DavITFutures.Web/DavITFutures.Web.csproj -c Release -o release
```

## Editing content

All texts live in JSON, one file per language, with the same structure (see `Models/SiteContent.cs`):

- `src/DavITFutures.Web/wwwroot/content/en.json`
- `src/DavITFutures.Web/wwwroot/content/pl.json`

Changing copy, projects, testimonials or contact details needs no code changes. The JSON is fetched without browser cache, so visitors see new content right after a deploy.

## Deployment

Every push to `main` builds the site and publishes it to GitHub Pages ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
The workflow rewrites `<base href>` to the repository path, copies `index.html` to `404.html` and adds `.nojekyll`.

One-time setup in the repository: **Settings → Pages → Source: GitHub Actions**.
To use a custom domain, add `src/DavITFutures.Web/wwwroot/CNAME` with the domain name; the base path is then left as `/`.

## License

© DavIT Futures. All rights reserved. The code is public for reference; the content, CVs and photos may not be reused without permission.
