namespace DavITFutures.Web.Models;

// Treść strony w jednym języku; pliki wwwroot/content/{pl,en}.json mają ten sam kształt.
public record SiteContent(
    Meta Meta,
    Nav Nav,
    Hero Hero,
    SectionWithItems About,
    SectionWithItems Services,
    TechSection Tech,
    ProjectsSection Projects,
    CvSection Cv,
    ContactSection Contact,
    Footer Footer);

public record Meta(string Title, string Description);

public record Nav(string About, string Services, string Tech, string Projects, string Cv, string Contact,
    string ThemeLight, string ThemeDark, string Language);

public record Hero(string Eyebrow, string Title, string Highlight, string Lead, Link PrimaryCta, Link SecondaryCta,
    IReadOnlyList<Stat> Stats);

public record Stat(string Value, string Label);

public record Link(string Label, string Url);

public record SectionWithItems(string Title, string Subtitle, IReadOnlyList<Item> Items);

// Link jest opcjonalny: karta może prowadzić do strony zewnętrznej.
public record Item(string Icon, string Title, string Text, string? LinkLabel = null, string? LinkUrl = null);

public record TechSection(string Title, string Subtitle, IReadOnlyList<TechGroup> Groups);

// Note to opcjonalny krótki tekst pod chipami, np. liczby z CV.
public record TechGroup(string Name, IReadOnlyList<string> Items, string? Note = null);

public record ProjectsSection(string Title, string Subtitle, string GitHubUser, string AllReposLabel,
    string CodeLabel, IReadOnlyList<Project> Items);

// Url jest opcjonalny: projekty komercyjne z CV nie mają publicznego kodu.
public record Project(string Name, string Client, string Years, string Description, string Url,
    IReadOnlyList<string> Tags);

public record CvSection(string Title, string Subtitle, IReadOnlyList<CvVersion> Versions);

public record CvVersion(string Title, string Text, string Pages, string Url, string ButtonLabel, string PdfUrl,
    string PdfLabel);

public record ContactSection(string Title, string Subtitle, string Email, string LinkedIn,
    string GitHub, CompanyDetails Company);

public record CompanyDetails(string Heading, string Name, string Owner, IReadOnlyList<string> Address,
    string Nip, string Regon);

public record Footer(string Rights, string BuiltWith);
