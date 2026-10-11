using System.Net.Http.Json;
using System.Text.Json;
using DavITFutures.Web.Models;
using Microsoft.AspNetCore.Components.WebAssembly.Http;
using Microsoft.JSInterop;

namespace DavITFutures.Web.Services;

// Trzyma bieżący język, motyw i wczytaną treść; komponenty odświeżają się po zdarzeniu Changed.
public class SiteState(HttpClient http, IJSRuntime js)
{
    public static readonly string[] Languages = ["pl", "en"];

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly Dictionary<string, SiteContent> _cache = new();

    public string Language { get; private set; } = "en";
    public string Theme { get; private set; } = "dark";
    public SiteContent? Content { get; private set; }

    public event Action? Changed;

    public async Task InitializeAsync()
    {
        Theme = await js.InvokeAsync<string>("davit.getTheme");
        var saved = await js.InvokeAsync<string?>("davit.getLanguage");
        await SetLanguageAsync(saved is not null && Languages.Contains(saved) ? saved : "en");
    }

    public async Task SetLanguageAsync(string language)
    {
        if (!_cache.TryGetValue(language, out var content))
        {
            // Bez cache przeglądarki: po wdrożeniu odwiedzający od razu widzą nową treść.
            using var request = new HttpRequestMessage(HttpMethod.Get, $"content/{language}.json");
            request.SetBrowserRequestCache(BrowserRequestCache.NoCache);
            using var response = await http.SendAsync(request);
            response.EnsureSuccessStatusCode();
            content = await response.Content.ReadFromJsonAsync<SiteContent>(JsonOptions)
                      ?? throw new InvalidOperationException($"Brak treści dla języka {language}");
            _cache[language] = content;
        }

        Language = language;
        Content = content;
        await js.InvokeVoidAsync("davit.setLanguage", language);
        Changed?.Invoke();
    }

    public async Task ToggleThemeAsync()
    {
        Theme = Theme == "dark" ? "light" : "dark";
        await js.InvokeVoidAsync("davit.setTheme", Theme);
        Changed?.Invoke();
    }
}
