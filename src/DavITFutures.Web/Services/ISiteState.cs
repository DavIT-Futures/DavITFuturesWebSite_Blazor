using DavITFutures.Web.Models;

namespace DavITFutures.Web.Services;

/// <summary>
/// Defines the reactive state contract for localization, theme selection, and localized site content.
/// </summary>
public interface ISiteState
{
    /// <summary>
    /// Gets the current ISO 639-1 language code (e.g., "pl", "en").
    /// </summary>
    string Language { get; }

    /// <summary>
    /// Gets the current theme identifier ("dark" or "light").
    /// </summary>
    string Theme { get; }

    /// <summary>
    /// Gets the localized content model for the active language.
    /// </summary>
    SiteContent? Content { get; }

    /// <summary>
    /// Gets the last error message encountered during state updates, if any.
    /// </summary>
    string? ErrorMessage { get; }

    /// <summary>
    /// Event triggered whenever the language, theme, or content model changes.
    /// </summary>
    event Action? Changed;

    /// <summary>
    /// Initializes theme and language preferences from browser storage and loads initial content.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Switches the active language and loads its corresponding localized content.
    /// </summary>
    /// <param name="language">Target ISO 639-1 language code.</param>
    Task SetLanguageAsync(string language);

    /// <summary>
    /// Toggles the active visual theme between dark and light modes.
    /// </summary>
    Task ToggleThemeAsync();
}
