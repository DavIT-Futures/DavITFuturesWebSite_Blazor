namespace DavITFutures.Web.Models;

// Treść strony w jednym języku; pliki wwwroot/content/{pl,en}.json mają ten sam kształt.
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
    Footer Footer);

public record Meta(string Title, string Description);

public record Nav(string About, string Services, string Tech, string Projects, string GitHub, string Cv, string Contact,
    string ThemeLight, string ThemeDark, string Language);

public record Hero(string Eyebrow, string Title, string Highlight, string Lead, Link PrimaryCta, Link SecondaryCta,
    IReadOnlyList<Stat> Stats, string? ClientsLabel = null, IReadOnlyList<string>? Clients = null);

public record Stat(string Value, string Label);

public record Link(string Label, string Url);

public record AboutSection(string Title, string Subtitle, string Photo, string PhotoAlt, string Name, string Role,
    IReadOnlyList<string> Facts, IReadOnlyList<Item> Items);

// Sekcja „Jak pracujemy”: kroki współpracy i jedna linia z warunkami.
public record ProcessSection(string Title, string Subtitle, IReadOnlyList<Step> Steps, string Footnote);

public record Step(string Title, string Text);

public record SectionWithItems(string Title, string Subtitle, IReadOnlyList<Item> Items);

// Link jest opcjonalny: karta może prowadzić do strony zewnętrznej.
public record Item(string Icon, string Title, string Text, string? LinkLabel = null, string? LinkUrl = null);

public record TechSection(string Title, string Subtitle, IReadOnlyList<TechGroup> Groups);

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
    string? Badge = null);

// Opinie przepisane dosłownie z rekomendacji na LinkedIn, dlatego cytat zostaje w oryginale w obu językach.
public record TestimonialsSection(string Title, string Subtitle, IReadOnlyList<Testimonial> Items, string? MoreLabel = null,
    string? MoreUrl = null);

public record Testimonial(string Quote, string Author, string Role, string Context);

public record CvSection(string Title, string Subtitle, IReadOnlyList<CvVersion> Versions);

public record CvVersion(string Title, string Text, string Pages, string Url, string ButtonLabel, string PdfUrl,
    string PdfLabel);

public record ContactSection(string Title, string Subtitle, string Email, string LinkedIn,
    string GitHub, CompanyDetails Company, string? EmailSubject = null);

public record CompanyDetails(string Heading, string Name, string Owner, IReadOnlyList<string> Address,
    string Nip, string Regon);

public record Footer(string Rights, string BuiltWith);
