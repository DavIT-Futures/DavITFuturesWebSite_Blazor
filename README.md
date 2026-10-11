# DavIT Futures – strona firmowa

Wizytówka firmy DavIT Futures zbudowana w **Blazor WebAssembly (.NET 10)**, hostowana na **GitHub Pages**.

## Uruchomienie lokalnie

```bash
dotnet run --project src/DavITFutures.Web
```

## Edycja treści

Wszystkie teksty są w plikach JSON, osobno dla każdego języka:

- `src/DavITFutures.Web/wwwroot/content/pl.json`
- `src/DavITFutures.Web/wwwroot/content/en.json`

Oba pliki mają ten sam układ (model: `Models/SiteContent.cs`). Zmiana treści nie wymaga zmian w kodzie.

Sekcja **Projekty** pobiera publiczne repozytoria z GitHuba (`projects.gitHubUser`). Żeby pokazać ręcznie wybrane projekty, wypełnij listę `projects.featured`.

## Wdrożenie

Każdy push na gałąź `main` buduje stronę i publikuje ją na GitHub Pages (`.github/workflows/deploy.yml`).
Jednorazowo w repozytorium: **Settings → Pages → Source: GitHub Actions**.

Po podpięciu własnej domeny dodaj plik `src/DavITFutures.Web/wwwroot/CNAME` z nazwą domeny.
