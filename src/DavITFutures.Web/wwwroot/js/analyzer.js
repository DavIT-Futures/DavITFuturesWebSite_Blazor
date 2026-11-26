// Analizator stanów logicznych: oś czasu projektów 2007–2026 rysowana na canvasie.
// Każdy projekt to kanał, stan wysoki to lata pracy. Wybór projektu wraca do Blazora przez DotNetObjectReference.

const SWEEP_S = 1.6, PAUSE_S = 2;

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_PL = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function seeded(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Kolory ekranu dla obu motywów; w jasnym kanały dostają ciemniejsze odcienie, żeby były czytelne na papierze.
const PAL = {
    dark: {
        bg: "#06080a", grid: "#141c22", panel: "#0b1014", tickMinor: "#4a565f", tickMajor: "#8a959e", tick: "#26313a",
        clk: "#56616a", selRow: "rgba(255,255,255,.04)", text: "#86919a", textHi: "#dde3e8", sub: "#5f6b74",
        label: "#c6ced4", labelHi: "#f4f6f8", sep: "#10171c", sweep: "180,230,255", sweepLine: "rgba(200,240,255,.35)",
        cursor: "#f4f6f8", cursorText: "#06080a", now: "#5ad08a", blend: "lighter", channels: null
    },
    light: {
        bg: "#f7f5ee", grid: "#e3dfd2", panel: "#efebdf", tickMinor: "#a39c8a", tickMajor: "#5c574b", tick: "#cfc8b6",
        clk: "#8f8977", selRow: "rgba(0,0,0,.045)", text: "#6d6757", textHi: "#1d1b16", sub: "#8f8977",
        label: "#3a362d", labelHi: "#111", sep: "#e3dfd2", sweep: "160,120,30", sweepLine: "rgba(140,100,20,.35)",
        cursor: "#1d1b16", cursorText: "#f7f5ee", now: "#1f8a4c", blend: "multiply",
        channels: ["#7a4a20", "#c8323a", "#cc5f12", "#a37d08", "#24884a", "#2f6fd6", "#7a4fc6", "#5d666e", "#2d3237"]
    }
};

// Gęste przełączenia w czasie trwania projektu, deterministyczne, żeby obraz był taki sam przy każdym wejściu.
function activity(spans, i) {
    const r = seeded(31 + i * 17);
    const edges = [];
    for (const [a, b] of spans) {
        edges.push([a, 1]);
        let t = a + r() * 0.05, lvl = 1;
        while (t < b) {
            t += r() < 0.15 ? 0.004 + r() * 0.01 : 0.02 + r() * 0.09;
            if (t >= b) break;
            lvl ^= 1;
            edges.push([t, lvl]);
        }
        edges.push([b, 0]);
    }
    return edges;
}
const spansOf = c => c.spans && c.spans.length ? c.spans : [[c.start, c.end]];
const isOn = (c, t) => spansOf(c).some(([a, b]) => t >= a && t < b);

export function create(canvas, readout, dotnet, data) {
    const g = canvas.getContext("2d");
    const screen = canvas.parentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";

    let d = data, edges = [], selected = 0, P = PAL.dark;
    const colorOf = i => (P.channels ? P.channels[i % P.channels.length] : d.channels[i].color);
    let T0 = 2006.6, T1 = 2027, vs = T0, ve = T1;
    let W = 0, H = 0, dpr = 1, LW = 0, RH = 0;
    const RUL = 26;
    let hoverX = null, hoverRow = -1, sweep = -1, sweepStart = performance.now(), drag = null, raf = 0, visible = true;

    function load(next) {
        d = next;
        edges = d.channels.map((c, i) => activity(spansOf(c), i));
        P = PAL[d.theme === "light" ? "light" : "dark"];
        T0 = Math.min(...d.channels.map(c => c.start)) - 0.4;
        T1 = Math.max(...d.channels.map(c => c.end)) + 0.1;
        vs = Math.max(vs, T0); ve = Math.min(ve, T1);
        if (ve - vs < 1.2) { vs = T0; ve = T1; }
        size();
    }

    const mobile = () => W < 640;
    function size() {
        const r = screen.getBoundingClientRect();
        dpr = Math.min(devicePixelRatio || 1, 2);
        W = r.width;
        LW = mobile() ? 50 : 148;
        RH = mobile() ? 28 : 36;
        H = RUL + RH * (d.channels.length + 1) + 6;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.height = H + "px";
        draw();
    }

    const X = t => LW + (t - vs) / (ve - vs) * (W - LW - 12);
    const TX = x => vs + (x - LW) / (W - LW - 12) * (ve - vs);
    const fmt = (t, short) => {
        const y = Math.floor(t), m = Math.min(11, Math.floor((t - y) * 12));
        const names = d.lang === "pl" ? MONTHS_PL : MONTHS_EN;
        return short ? `${names[m]} ${String(y).slice(2)}` : `${names[m]} ${y}`;
    };

    function draw() {
        if (!W) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = P.bg;
        g.fillRect(0, 0, W, H);
        const top = RUL, bot = H - 4, rows = d.channels.length + 1;

        g.strokeStyle = P.grid;
        g.lineWidth = 1;
        g.setLineDash([2, 4]);
        for (let i = 0; i <= 10; i++) {
            const x = Math.round(LW + (W - LW - 12) * i / 10) + 0.5;
            g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke();
        }
        g.setLineDash([]);

        // linijka z latami
        g.fillStyle = P.panel;
        g.fillRect(0, 0, W, RUL);
        const span = ve - vs, ppy = (W - LW - 12) / span;
        const step = ppy * 0.25 >= 48 ? 0.25 : ppy >= 44 ? 1 : ppy * 2 >= 44 ? 2 : ppy * 4 >= 44 ? 4 : 5;
        g.font = `500 10.5px ${font}`;
        g.textBaseline = "middle";
        g.textAlign = "center";
        for (let t = Math.ceil(vs / step) * step; t <= ve; t += step) {
            const x = X(t);
            if (x < LW + 14) continue;
            const yr = Math.floor(t + 1e-6), q = Math.round((t - yr) * 4);
            g.fillStyle = q ? P.tickMinor : P.tickMajor;
            g.fillText(q ? `Q${q + 1}` : String(yr), x, RUL / 2);
            g.fillStyle = P.tick;
            g.fillRect(x, RUL - 6, 1, 6);
        }

        for (let row = 0; row < rows; row++) {
            const y0 = top + row * RH, clk = row === 0, pi = row - 1;
            const ch = clk ? null : d.channels[pi];
            const col = clk ? P.clk : colorOf(pi);
            const sel = !clk && pi === selected, hov = row === hoverRow;
            if (sel) { g.fillStyle = P.selRow; g.fillRect(0, y0, W, RH); }

            g.fillStyle = P.panel;
            g.fillRect(0, y0, LW - 6, RH - 1);
            g.fillStyle = col;
            g.fillRect(0, y0 + 4, 3, RH - 9);
            g.textAlign = "left";
            g.fillStyle = sel || hov ? P.textHi : P.text;
            g.font = `600 10.5px ${font}`;
            g.fillText(clk ? "CLK" : "CH" + (pi + 1), 10, y0 + RH / 2 - (mobile() ? 0 : 6));
            if (!mobile()) {
                g.font = `500 10px ${font}`;
                g.fillStyle = sel ? col : P.sub;
                g.fillText(clk ? d.labels.year : ch.short.slice(0, 16), 10, y0 + RH / 2 + 7);
            }

            g.save();
            g.beginPath(); g.rect(LW, y0, W - LW, RH); g.clip();
            const hi = y0 + RH * 0.44, lo = y0 + RH - 6;
            const dim = !clk && !sel && !hov ? 0.62 : 1;
            g.strokeStyle = col;
            g.globalAlpha = dim;
            g.lineWidth = 1.25;
            g.beginPath();
            if (clk) {
                let lvl = 0;
                g.moveTo(LW, lo);
                for (let t = Math.floor(vs); t <= ve + 1; t += 0.5) {
                    const x = X(t);
                    g.lineTo(x, lvl ? hi : lo); lvl ^= 1; g.lineTo(x, lvl ? hi : lo);
                }
            } else {
                let lvl = 0;
                g.moveTo(LW, lo);
                for (const [t, l] of edges[pi]) {
                    const x = X(t);
                    if (x < LW - 50) { lvl = l; continue; }
                    if (x > W + 50) break;
                    g.lineTo(x, lvl ? hi : lo); g.lineTo(x, l ? hi : lo); lvl = l;
                }
                g.lineTo(W, lvl ? hi : lo);
            }
            g.stroke();
            g.globalAlpha = dim * 0.18; g.lineWidth = 4; g.stroke(); g.globalAlpha = 1;

            // adnotacja dekodera nad impulsem
            if (!clk) {
                const sp = spansOf(ch), longest = sp.reduce((m, x) => (x[1] - x[0] > m[1] - m[0] ? x : m), sp[0]);
                for (const seg of sp) {
                const xa = Math.max(X(seg[0]), LW + 1), xb = Math.min(X(seg[1]), W - 2);
                if (seg !== longest && xb > xa + 6) {
                    const ya = y0 + 3, yb = y0 + RH * 0.44 - 3, h = yb - ya, k = Math.min(5, h / 2);
                    g.beginPath();
                    g.moveTo(xa, ya + h / 2); g.lineTo(xa + k, ya); g.lineTo(xb - k, ya);
                    g.lineTo(xb, ya + h / 2); g.lineTo(xb - k, yb); g.lineTo(xa + k, yb); g.closePath();
                    g.fillStyle = col; g.globalAlpha = sel ? 0.32 : 0.16; g.fill();
                    g.globalAlpha = sel ? 1 : 0.55; g.strokeStyle = col; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
                    // kolejny odcinek tego samego klienta: skrócona nazwa, np. „CREDIT S”
                    g.font = `600 9.5px ${font}`;
                    g.fillStyle = sel || hov ? P.labelHi : P.label;
                    g.textAlign = "center";
                    const words = ch.short.split(" ");
                    const tries = [ch.short, words.length > 1 ? `${words[0]} ${words[1][0]}` : null, words[0]].filter(Boolean);
                    const fit = tries.find(o => g.measureText(o).width < xb - xa - 12);
                    if (fit) g.fillText(fit, (xa + xb) / 2, (ya + yb) / 2 + 0.5);
                    continue;
                }
                if (xb > xa + 6) {
                    const ya = y0 + 3, yb = y0 + RH * 0.44 - 3, h = yb - ya, k = Math.min(5, h / 2);
                    g.beginPath();
                    g.moveTo(xa, ya + h / 2); g.lineTo(xa + k, ya); g.lineTo(xb - k, ya);
                    g.lineTo(xb, ya + h / 2); g.lineTo(xb - k, yb); g.lineTo(xa + k, yb); g.closePath();
                    g.fillStyle = col; g.globalAlpha = sel ? 0.32 : 0.16; g.fill();
                    g.globalAlpha = sel ? 1 : 0.55; g.strokeStyle = col; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
                    g.font = `600 9.5px ${font}`;
                    g.fillStyle = sel || hov ? P.labelHi : P.label;
                    g.textAlign = "center";
                    const opts = [`${ch.short} · ${ch.name}`, ch.short];
                    const label = opts.find(o => g.measureText(o).width < xb - xa - 12);
                    if (label) {
                        g.fillText(label, (xa + xb) / 2, (ya + yb) / 2 + 0.5);
                        if (ch.note) {
                            // dopisek obok impulsu, np. praca weekendowa przy projekcie pobocznym
                            g.textAlign = "left";
                            g.fillStyle = col;
                            g.globalAlpha = sel || hov ? 1 : 0.85;
                            g.fillText(ch.note, xb + 6, (ya + yb) / 2 + 0.5);
                            g.globalAlpha = 1;
                        }
                    } else {
                        // krótki impuls: nazwa klienta obok, po stronie, gdzie jest miejsce
                        const side = ch.note ? `${ch.short} · ${ch.note}` : ch.short;
                        const w = g.measureText(side).width;
                        g.fillStyle = col;
                        g.globalAlpha = sel || hov ? 1 : 0.85;
                        if (xb + 6 + w < W - 4) { g.textAlign = "left"; g.fillText(side, xb + 6, (ya + yb) / 2 + 0.5); }
                        else { g.textAlign = "right"; g.fillText(side, xa - 6, (ya + yb) / 2 + 0.5); }
                        g.globalAlpha = 1;
                    }
                }
                }
            }
            g.restore();
            g.fillStyle = P.sep;
            g.fillRect(0, y0 + RH - 1, W, 1);
        }

        if (sweep >= 0) {
            const x = LW + sweep * (W - LW);
            const gr = g.createLinearGradient(x - 140, 0, x, 0);
            gr.addColorStop(0, `rgba(${P.sweep},0)`);
            gr.addColorStop(1, `rgba(${P.sweep},.10)`);
            g.globalCompositeOperation = P.blend;
            g.fillStyle = gr;
            g.fillRect(Math.max(LW, x - 140), top, Math.min(140, x - LW), bot - top);
            g.fillStyle = P.sweepLine;
            g.fillRect(x, top, 1, bot - top);
            g.globalCompositeOperation = "source-over";
        }

        if (hoverX !== null && hoverX > LW) {
            g.strokeStyle = P.cursor; g.setLineDash([4, 3]); g.lineWidth = 1;
            g.beginPath(); g.moveTo(hoverX + 0.5, 0); g.lineTo(hoverX + 0.5, bot); g.stroke(); g.setLineDash([]);
            g.fillStyle = P.cursor; g.fillRect(hoverX - 27, 2, 54, RUL - 6);
            g.fillStyle = P.cursorText; g.textAlign = "center"; g.font = `700 10.5px ${font}`;
            g.fillText(fmt(TX(hoverX), true), hoverX, RUL / 2 - 1);
        }

        const xn = X(T1 - 0.1);
        if (xn < W + 1) {
            g.fillStyle = P.now; g.font = `700 9.5px ${font}`; g.textAlign = "right";
            g.fillText(d.labels.now + " ▸", xn - 3, RUL + RH / 2);
        }
    }

    function showReadout(e) {
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        hoverX = x > LW ? x : null;
        hoverRow = y > RUL ? Math.floor((y - RUL) / RH) : -1;
        if (hoverRow > d.channels.length) hoverRow = -1;
        if (hoverX === null) { readout.hidden = true; draw(); return; }
        const t = TX(x);
        const on = d.channels.map((c, i) => (isOn(c, t) ? i : -1)).filter(i => i >= 0);
        readout.hidden = false;
        readout.replaceChildren();
        const head = document.createElement("div");
        head.textContent = `T = ${fmt(t)}`;
        readout.append(head);
        if (!on.length) {
            const em = document.createElement("em");
            em.textContent = d.labels.allLow;
            readout.append(em);
        }
        for (const i of on) {
            const line = document.createElement("div");
            const sw = document.createElement("span");
            sw.style.color = colorOf(i);
            sw.textContent = "■ ";
            line.append(sw, `CH${i + 1} ${d.labels.high} · ${d.channels[i].client}${d.channels[i].note ? " · " + d.channels[i].note : ""}`);
            readout.append(line);
        }
        const ox = x + 14 + readout.offsetWidth > r.width ? x - readout.offsetWidth - 14 : x + 14;
        readout.style.left = ox + "px";
        readout.style.top = Math.max(4, Math.min(y + 14, r.height - readout.offsetHeight - 6)) + "px";
        draw();
    }

    function setView(a, b) {
        const span = Math.min(T1 - T0, Math.max(1.2, b - a));
        if (a < T0) a = T0;
        if (a + span > T1) a = T1 - span;
        vs = a; ve = a + span;
        dotnet.invokeMethodAsync("OnSpanChanged", Math.round(span * 10) / 10);
        draw();
    }

    function select(i, notify) {
        selected = i;
        draw();
        if (notify) dotnet.invokeMethodAsync("OnChannelSelected", i);
    }

    const onMove = e => {
        if (drag) {
            const dx = e.clientX - drag.x;
            setView(drag.vs - dx / (W - LW - 12) * (drag.ve - drag.vs), drag.ve - dx / (W - LW - 12) * (drag.ve - drag.vs));
            if (Math.abs(dx) > 4) drag.moved = true;
        }
        showReadout(e);
    };
    const onLeave = () => { hoverX = null; hoverRow = -1; readout.hidden = true; draw(); };
    const onDown = e => { if (e.pointerType === "mouse") drag = { x: e.clientX, vs, ve, moved: false }; };
    const onUp = e => {
        const moved = drag && drag.moved;
        drag = null;
        if (moved || e.target !== canvas) return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const row = Math.floor((y - RUL) / RH) - 1;
        if (row >= 0 && row < d.channels.length) { select(row, true); return; }
        if (x > LW) {
            const t = TX(x);
            const hit = d.channels.findIndex(c => isOn(c, t));
            if (hit >= 0) select(hit, true);
        }
    };
    const onWheel = e => {
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
            // zwykłe kółko przewija stronę; zoom z Ctrl/Alt/Shift albo przyciskami
            return;
        }
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const t = TX(Math.max(LW, e.clientX - r.left));
        const delta = e.deltaY || e.deltaX;
        const f = delta > 0 ? 1.18 : 1 / 1.18;
        setView(t - (t - vs) * f, t + (ve - t) * f);
    };
    const onKey = e => {
        const n = d.channels.length;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { select((selected + 1) % n, true); e.preventDefault(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { select((selected + n - 1) % n, true); e.preventDefault(); }
        if (e.key === "+" || e.key === "=") { api.zoom(0.6); e.preventDefault(); }
        if (e.key === "-") { api.zoom(1 / 0.6); e.preventDefault(); }
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("keydown", onKey);
    const ro = new ResizeObserver(() => size());
    ro.observe(screen);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; });
    io.observe(canvas);

    function loop(now) {
        if (!reduce && visible) {
            // skan biegnie od lewej do prawej przez SWEEP_S, potem PAUSE_S przerwy i od nowa, bez końca
            const cyc = (now - sweepStart) / 1000;
            if (cyc > SWEEP_S + PAUSE_S) sweepStart = now;
            const s = cyc < SWEEP_S ? cyc / SWEEP_S : -1;
            if (s !== sweep) { sweep = s; draw(); }
        }
        raf = requestAnimationFrame(loop);
    }

    const api = {
        update: next => load(next),
        select: i => select(i, false),
        zoom: f => {
            const c = d.channels[selected];
            const mid = f < 1 && c ? (c.start + c.end) / 2 : (vs + ve) / 2;
            setView(mid - (ve - vs) * f / 2, mid + (ve - vs) * f / 2);
        },
        fit: () => setView(T0, T1),
        dispose: () => {
            cancelAnimationFrame(raf);
            ro.disconnect(); io.disconnect();
            window.removeEventListener("pointerup", onUp);
        }
    };

    load(data);
    vs = T0; ve = T1;
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
    raf = requestAnimationFrame(loop);
    return api;
}
