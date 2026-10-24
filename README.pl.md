# DavIT Futures – strona firmowa

[English](README.md) · **Polski**

[![Deploy to GitHub Pages](https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor/actions/workflows/deploy.yml/badge.svg)](https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor/actions/workflows/deploy.yml)
![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)
![Blazor WebAssembly](https://img.shields.io/badge/Blazor-WebAssembly-5C2D91?logo=blazor&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/hosting-GitHub%20Pages-222?logo=github)

Strona internetowa **DavIT Futures**, software house'u z Wrocławia, który tworzy oprogramowanie w .NET i Angularze dla finansów, tradingu i SaaS.
To jednostronicowa wizytówka napisana w całości w C# w **Blazor WebAssembly**, serwowana jako pliki statyczne z **GitHub Pages**, bez backendu do utrzymania.

**Strona:** https://davit-futures.github.io/DavITFuturesWebSite_Blazor/

## Co jest na stronie

- **Hero** z opisem firmy, najważniejszymi liczbami i przyciskami kontaktu
- **O nas** – osoba stojąca za firmą, zdjęcie i krótkie fakty
- **Usługi** i **Jak pracujemy** – co dostarczamy i jak krok po kroku przebiega projekt
- **Technologie** – stack pogrupowany według obszarów (backend, frontend, mobile, DevOps, AI)
- **Projekty** – wybrane projekty komercyjne z klientem, latami, efektem i tagami
- **GitHub & Open Source** – przegląd publicznych repozytoriów, architektur referencyjnych i narzędzi z bezpośrednimi linkami do kodu
- **Rekomendacje** – opinie osób, z którymi pracowaliśmy
- **CV** – wersja krótka i pełna, każda jako strona WWW i PDF do druku
- **Kontakt** – e-mail, LinkedIn i dane firmy

Cała treść jest dostępna **po angielsku i po polsku** (przełączanie w locie), w **ciemnym i jasnym motywie**. Oba wybory zapamiętuje przeglądarka, a układ jest w pełni responsywny.

## Technologie

| Obszar | Technologia |
| --- | --- |
| Framework UI | Blazor WebAssembly na **.NET 10**, komponenty Razor |
| Język | C# 14 z nullable reference types, rekordy jako model treści |
| Style | Własny CSS ze zmiennymi (bez frameworka CSS), font Inter |
| Treść | Jeden plik JSON na język, wczytywany w przeglądarce do typowanych rekordów |
| Stan | Mały serwis `SiteState` (język, motyw, treść) z powiadamianiem komponentów |
| Interop z przeglądarką | Mały skrypt JS do `localStorage` i skrypt inline ustawiający motyw i język przed startem Blazora, żeby strona nie mrugała |
| CI/CD | GitHub Actions: `dotnet publish` → GitHub Pages przy każdym pushu na `main` |
| Hosting | GitHub Pages (pliki statyczne, `404.html` dla routingu po stronie klienta) |

## Struktura projektu

```
src/DavITFutures.Web/
├── Components/        # jeden komponent Razor na sekcję (Hero, About, Projects, ...)
├── Layout/            # MainLayout: nagłówek, treść, stopka, tytuł i meta strony
├── Models/            # SiteContent.cs – typowany model treści z JSON
├── Pages/             # Home i NotFound
├── Services/          # SiteState – język, motyw i wczytywanie treści
└── wwwroot/
    ├── content/       # en.json, pl.json – wszystkie teksty strony
    ├── css/app.css    # style i oba motywy
    ├── cv/            # CV jako strony HTML i PDF, krótkie i pełne
    ├── img/           # zdjęcia
    └── js/site.js     # pomocnicze funkcje localStorage
```

## Uruchomienie lokalnie

Wymagany [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
git clone https://github.com/DavIT-Futures/DavITFuturesWebSite_Blazor.git
cd DavITFuturesWebSite_Blazor
dotnet run --project src/DavITFutures.Web
```

Następnie otwórz adres wypisany w konsoli. Wersję produkcyjną buduje się tak samo jak w CI:

```bash
dotnet publish src/DavITFutures.Web/DavITFutures.Web.csproj -c Release -o release
```

## Edycja treści

Wszystkie teksty są w plikach JSON, osobno dla każdego języka, o tym samym układzie (model: `Models/SiteContent.cs`):

- `src/DavITFutures.Web/wwwroot/content/en.json`
- `src/DavITFutures.Web/wwwroot/content/pl.json`

Zmiana tekstów, projektów, rekomendacji czy danych kontaktowych nie wymaga zmian w kodzie. JSON jest pobierany z pominięciem cache przeglądarki, więc po wdrożeniu odwiedzający od razu widzą nową treść.

## Wdrożenie

Każdy push na gałąź `main` buduje stronę i publikuje ją na GitHub Pages ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
Workflow ustawia `<base href>` na ścieżkę repozytorium, kopiuje `index.html` do `404.html` i dodaje `.nojekyll`.

Jednorazowo w repozytorium: **Settings → Pages → Source: GitHub Actions**.
Po podpięciu własnej domeny dodaj plik `src/DavITFutures.Web/wwwroot/CNAME` z nazwą domeny; ścieżka bazowa zostanie wtedy jako `/`.


## Autor

**DavIT Futures • Dawid Domagała**
- **Strona:** [davit-futures.github.io/DavITFuturesWebSite_Blazor](https://davit-futures.github.io/DavITFuturesWebSite_Blazor/)
- **LinkedIn:** [Dawid Domagała](https://www.linkedin.com/in/dawid-domagala-futures/)
- **GitHub:** [@DavIT-Futures](https://github.com/DavIT-Futures)
- **E-mail:** davit.futures@gmail.com

## Licencja

© DavIT Futures. Wszelkie prawa zastrzeżone. Kod jest publiczny poglądowo; treści, CV i zdjęć nie można wykorzystywać bez zgody.
