// Preferencje użytkownika (motyw, język) trzymane w localStorage.
window.davit = (() => {
    const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, value); } catch { } };

    return {
        getTheme: () => document.documentElement.dataset.theme || "dark",
        setTheme: theme => {
            document.documentElement.dataset.theme = theme;
            write("davit-theme", theme);
        },
        getLanguage: () => read("davit-lang"),
        setLanguage: lang => {
            document.documentElement.lang = lang;
            write("davit-lang", lang);
        }
    };
})();
