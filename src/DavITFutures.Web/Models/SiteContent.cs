namespace DavITFutures.Web.Models;

/// <summary>
/// Root data transfer record representing the full site content model for a specific locale.
/// </summary>
public record SiteContent(
    Meta Meta,
    Nav Nav,
    Hero Hero,
    AboutSection About,
    SectionWithItems Services,
    ProcessSection Process,
    TechSection Tech,
    ProjectsSection Projects,
    GitHubSection GitHub,
    TestimonialsSection Testimonials,
    CvSection Cv,
    ContactSection Contact,
    Footer Footer,
    GamesRemasterSection? Games = null);

/// <summary>
/// Document metadata for SEO page title and description.
/// </summary>
public record Meta(string Title, string Description);

/// <summary>
/// Navigation menu localized labels and control texts.
/// </summary>
public record Nav(string About, string Services, string Tech, string Projects, string GitHub, string Cv, string Contact,
    string ThemeLight, string ThemeDark, string Language, string? Games = null);

/// <summary>
/// Content structure for the hero banner section including headline, call to action, and statistics.
/// </summary>
public record Hero(string Eyebrow, string Title, string Highlight, string Lead, Link PrimaryCta, Link SecondaryCta,
    IReadOnlyList<Stat> Stats, string? ClientsLabel = null, IReadOnlyList<string>? Clients = null,
    IReadOnlyList<ClientBrand>? ClientBrands = null);

/// <summary>
/// Client brand identification and logo information.
/// </summary>
public record ClientBrand(string Name, string Logo, string? Url = null);

/// <summary>
/// Numerical metric and descriptive label pair.
/// </summary>
public record Stat(string Value, string Label);

/// <summary>
/// Hyperlink specification comprising a human-readable label and target URL.
/// </summary>
public record Link(string Label, string Url);

public record AboutSection(string Title, string Subtitle, string Photo, string PhotoAlt, string Name, string Role,
    IReadOnlyList<string> Facts, IReadOnlyList<Item> Items);

// Sekcja „Jak pracujemy”: kroki współpracy i jedna linia z warunkami.
public record ProcessSection(string Title, string Subtitle, IReadOnlyList<Step> Steps, string Footnote);

public record Step(string Title, string Text);

public record SectionWithItems(string Title, string Subtitle, IReadOnlyList<Item> Items);

// Link jest opcjonalny: karta może prowadzić do strony zewnętrznej.
public record Item(string Icon, string Title, string Text, string? LinkLabel = null, string? LinkUrl = null,
    IReadOnlyList<string>? Tags = null);

public record TechSection(string Title, string Subtitle, IReadOnlyList<TechGroup> Groups, AiTelemetry? Ai = null);

// Liczby z pracy z agentami AI: nagłówek, źródło i cztery pomiary, każdy z własnym wyjaśnieniem.
public record AiTelemetry(string Headline, string Lead, IReadOnlyList<AiMetric> Metrics);

public record AiMetric(string Value, string Label, string Text);

// Note to opcjonalny krótki tekst pod chipami, np. liczby z CV.
public record TechGroup(string Name, IReadOnlyList<string> Items, string? Note = null);

public record ProjectsSection(string Title, string Subtitle, string GitHubUser, string AllReposLabel,
    string CodeLabel, IReadOnlyList<Project> Items);

// Url jest opcjonalny: projekty komercyjne z CV nie mają publicznego kodu.
// Outcome to jedna wyróżniona linia z wynikiem projektu, pokazywana nad opisem.
public record Project(string Name, string Client, string Years, string Description, string Url,
    IReadOnlyList<string> Tags, string? Outcome = null);

// Sekcja z publicznymi repozytoriami na GitHubie
public record GitHubSection(
    string Title,
    string Subtitle,
    string GitHubUser,
    string ViewProfileLabel,
    string ViewRepoLabel,
    IReadOnlyList<GitHubRepo> Items);

public record GitHubRepo(
    string Name,
    string Description,
    string Url,
    IReadOnlyList<string> Tags,
    string? Language = null,
    string? Badge = null,
    string? Image = null);

// Sekcja dedykowana: Games Remastering / Retro Games Remaster
public record GamesRemasterSection(
    string Eyebrow,
    string Title,
    string Subtitle,
    CivGameDetails Civ15,
    string WhatsNewTitle,
    string WhatsNewSubtitle,
    IReadOnlyList<GameFeatureItem> Features,
    OtherGameDetails? Australia1859 = null,
    CivDlcDetails? Dlc = null);

public record CivDlcDetails(
    string Badge,
    string Title,
    string CasimirImage,
    string CasimirName,
    string CasimirCaption,
    string TokugawaImage,
    string TokugawaName,
    string TokugawaCaption,
    string PolandAnthemTitle,
    string PolandAnthemSubtitle,
    string PolandAnthemAudio,
    string PolandMidiUrl,
    string JapanAnthemTitle,
    string JapanAnthemSubtitle,
    string JapanAnthemAudio,
    string JapanMidiUrl,
    string Description,
    IReadOnlyList<string> Highlights);

public record CivGameDetails(
    string Title,
    string Badge,
    string Tagline,
    string Description,
    IReadOnlyList<string> Badges,
    string PlayInstructionsTitle,
    IReadOnlyList<string> PlaySteps,
    string GitHubUrl,
    string GitHubLabel,
    string WebsiteUrl,
    string WebsiteLabel,
    string ReleasesUrl,
    string ReleasesLabel);

public record GameFeatureItem(
    string Id,
    string Title,
    string Description,
    string Image,
    string? Badge = null,
    string? SecondImage = null,
    string? ThirdImage = null,
    string? Caption = null);

public record LightboxItem(
    string Url,
    string Title,
    string? Caption = null);

public record OtherGameDetails(
    string Title,
    string Badge,
    string Description,
    string Url,
    string UrlLabel,
    IReadOnlyList<string> Tags,
    IReadOnlyList<GameScreenshotItem>? Screenshots = null,
    string? InfoCardTitle = null,
    string? InfoCardBadge = null,
    string? InfoCardDescription = null);

public record GameScreenshotItem(
    string Image,
    string Title,
    string Caption);

// Opinie przepisane dosłownie z rekomendacji na LinkedIn, dlatego cytat zostaje w oryginale w obu językach.
public record TestimonialsSection(string Title, string Subtitle, IReadOnlyList<Testimonial> Items, string? MoreLabel = null,
    string? MoreUrl = null);

public record Testimonial(string Quote, string Author, string Role, string Context);

public record CvSection(string Title, string Subtitle, IReadOnlyList<CvVersion> Versions);

public record CvVersion(string Title, string Text, string Pages, string Url, string ButtonLabel, string? PdfUrl = null,
    string? PdfLabel = null);

public record ContactSection(string Title, string Subtitle, string Email, string LinkedIn,
    string GitHub, CompanyDetails Company, string? EmailSubject = null);

public record CompanyDetails(string Heading, string Name, string Owner, IReadOnlyList<string> Address,
    string Nip, string Regon);

public record Footer(string Rights, string BuiltWith);
