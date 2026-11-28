using System.Net;
using System.Text;
using DavITFutures.Web.Services;
using Microsoft.JSInterop;
using Xunit;

namespace DavITFutures.Web.Tests;

public class SiteStateTests
{
    private sealed class StubHttpMessageHandler(string jsonPayload) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }
        public Uri? LastRequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            LastRequestUri = request.RequestUri;
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
            };
            return Task.FromResult(response);
        }
    }

    private sealed class RecordingJsRuntime : IJSRuntime
    {
        public string? LastIdentifier { get; private set; }
        public object?[]? LastArgs { get; private set; }

        public ValueTask<TValue> InvokeAsync<TValue>(string identifier, object?[]? args)
            => InvokeAsync<TValue>(identifier, CancellationToken.None, args);

        public ValueTask<TValue> InvokeAsync<TValue>(string identifier, CancellationToken cancellationToken, object?[]? args)
        {
            LastIdentifier = identifier;
            LastArgs = args;
            return ValueTask.FromResult(default(TValue)!);
        }
    }

    [Fact]
    public async Task ToggleThemeAsync_SwitchesDefaultDarkToLightAndNotifiesSubscribers()
    {
        var js = new RecordingJsRuntime();
        using var http = new HttpClient();
        var state = new SiteState(http, js);
        var changedCount = 0;
        state.Changed += () => changedCount++;

        await state.ToggleThemeAsync();

        Assert.Equal("light", state.Theme);
        Assert.Equal(1, changedCount);
        Assert.Equal("davit.setTheme", js.LastIdentifier);
    }

    [Fact]
    public async Task ToggleThemeAsync_CalledTwice_RestoresDarkThemeAndNotifiesTwice()
    {
        var js = new RecordingJsRuntime();
        using var http = new HttpClient();
        var state = new SiteState(http, js);
        var changedCount = 0;
        state.Changed += () => changedCount++;

        await state.ToggleThemeAsync();
        await state.ToggleThemeAsync();

        Assert.Equal("dark", state.Theme);
        Assert.Equal(2, changedCount);
        Assert.Equal("davit.setTheme", js.LastIdentifier);
        Assert.NotNull(js.LastArgs);
        Assert.Equal("dark", js.LastArgs![0]);
    }

    [Fact]
    public async Task SetLanguageAsync_LoadsCachesContentAndNotifiesSubscribers()
    {
        const string payload = """{"meta":{"title":"DavIT Futures","description":"Software engineering"}}""";
        using var handler = new StubHttpMessageHandler(payload);
        using var http = new HttpClient(handler) { BaseAddress = new Uri("https://davitfutures.test/") };
        var js = new RecordingJsRuntime();
        var state = new SiteState(http, js);
        var changedCount = 0;
        state.Changed += () => changedCount++;

        await state.SetLanguageAsync("pl");
        await state.SetLanguageAsync("pl");

        Assert.Equal("pl", state.Language);
        Assert.NotNull(state.Content);
        Assert.Equal("DavIT Futures", state.Content!.Meta.Title);
        Assert.Null(state.ErrorMessage);
        Assert.Equal(1, handler.RequestCount);
        Assert.Equal("davit.setLanguage", js.LastIdentifier);
        Assert.NotNull(js.LastArgs);
        Assert.Equal("pl", js.LastArgs![0]);
        Assert.Equal(2, changedCount);
    }
}
