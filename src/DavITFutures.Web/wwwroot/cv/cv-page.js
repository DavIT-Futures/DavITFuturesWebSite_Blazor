// Podstrony CV: przełącznik motywu (wspólny z resztą strony), etykiety PL/EN i skalowanie stron A4 na telefonie.
(() => {
    const root = document.documentElement;
    const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
    const write = (k, v) => { try { localStorage.setItem(k, v); } catch { } };

    const labels = {
        en: { back: "← Back to the website", print: "Print", pdf: "Download PDF", short: "Short CV", full: "Full CV", theme: "Change theme" },
        pl: { back: "← Wróć na stronę", print: "Drukuj", pdf: "Pobierz PDF", short: "CV skrócone", full: "CV pełne", theme: "Zmień motyw" }
    };
    const t = labels[read("davit-lang") === "pl" ? "pl" : "en"];
    document.querySelectorAll("[data-label]").forEach(el => {
        const key = el.dataset.label;
        if (el.hasAttribute("aria-label")) { el.setAttribute("aria-label", t[key]); el.title = t[key]; }
        else el.textContent = t[key];
    });

    const sun = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    const moon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    const btn = document.querySelector(".dvt-theme");
    const paint = () => { btn.innerHTML = root.dataset.theme === "dark" ? sun : moon; };
    btn.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
        write("davit-theme", root.dataset.theme);
        paint();
    });
    paint();

    // Strony mają stałą szerokość A4, więc na wąskim ekranie zmniejszamy je w całości zamiast przewijać w bok.
    const wrap = document.querySelector(".wrap");
    const page = document.querySelector(".page");
    const fit = () => {
        wrap.style.zoom = "";
        const available = wrap.clientWidth - 24;
        const width = page.offsetWidth;
        if (width > available) wrap.style.zoom = (available / width).toFixed(3);
    };
    addEventListener("resize", fit);
    addEventListener("beforeprint", () => { wrap.style.zoom = ""; });
    addEventListener("afterprint", fit);
    fit();
})();
