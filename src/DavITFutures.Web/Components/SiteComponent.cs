using DavITFutures.Web.Models;
using DavITFutures.Web.Services;
using Microsoft.AspNetCore.Components;

namespace DavITFutures.Web.Components;

/// <summary>
/// Base class for UI components that reactively re-render upon language or visual theme modifications.
/// </summary>
public abstract class SiteComponent : ComponentBase, IDisposable
{
    [Inject] protected SiteState Site { get; set; } = default!;

    /// <summary>
    /// Gets the strongly-typed localized content for the active language.
    /// </summary>
    protected SiteContent? Content => Site.Content;

    protected override void OnInitialized() => Site.Changed += OnSiteChanged;

    private void OnSiteChanged() => InvokeAsync(StateHasChanged);

    public virtual void Dispose() => Site.Changed -= OnSiteChanged;
}
