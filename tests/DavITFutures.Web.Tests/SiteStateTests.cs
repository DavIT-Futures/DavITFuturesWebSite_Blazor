using DavITFutures.Web.Services;
using Microsoft.JSInterop;
using Xunit;

namespace DavITFutures.Web.Tests;

public class SiteStateTests
{
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
}
