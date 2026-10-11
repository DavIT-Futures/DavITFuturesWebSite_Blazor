using DavITFutures.Web.Models;
using DavITFutures.Web.Services;
using Microsoft.AspNetCore.Components;

namespace DavITFutures.Web.Components;

// Baza dla komponentów, które przerysowują się po zmianie języka lub motywu.
public abstract class SiteComponent : ComponentBase, IDisposable
{
    [Inject] protected SiteState Site { get; set; } = default!;

    protected SiteContent? Content => Site.Content;

    protected override void OnInitialized() => Site.Changed += OnSiteChanged;

    private void OnSiteChanged() => InvokeAsync(StateHasChanged);

    public void Dispose() => Site.Changed -= OnSiteChanged;
}
