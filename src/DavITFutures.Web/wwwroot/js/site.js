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
        },
        scrollToId: id => {
            const el = document.getElementById(id);
            if (!el) return;
            const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
            el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
            el.classList.remove("is-flash");
            void el.offsetWidth;
            el.classList.add("is-flash");
        }
    };
})();

// Lightbox modal keyboard handler
window.davitLightbox = {
    attach: dotNetRef => {
        const handler = e => {
            if (e.key === "Escape") {
                dotNetRef.invokeMethodAsync("OnJsKey", "Escape");
            } else if (e.key === "ArrowLeft") {
                dotNetRef.invokeMethodAsync("OnJsKey", "ArrowLeft");
            } else if (e.key === "ArrowRight") {
                dotNetRef.invokeMethodAsync("OnJsKey", "ArrowRight");
            }
        };
        window.addEventListener("keydown", handler);
        return {
            detach: () => window.removeEventListener("keydown", handler)
        };
    }
};
