// Płyta główna 3D na stronie głównej. Każda sekcja strony ma swój układ na płycie,
// a kamera przelatuje do niego przy przewijaniu. Treść jest w HTML (Blazor), scena tylko ilustruje.

let threeLoading = null;
function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!threeLoading) {
        threeLoading = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "lib/three/three.min.js";
            s.async = true;
            s.onload = () => resolve(window.THREE);
            s.onerror = reject;
            document.head.append(s);
        });
    }
    return threeLoading;
}

function webglAvailable() {
    try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch { return false; }
}

const PALETTES = {
    dark: { bg: 0x050606, mask: "#0d110f", pour: "#111613", filler: "#18201b", fillerVia: "#1d2520", bus: "#212b25", silk: "#e9e7de", silkDim: "#a9a79f", fid: "#2a302c", core: 0x1b1f1a },
    light: { bg: 0xe9ebe6, mask: "#eef0eb", pour: "#e4e7e1", filler: "#d9ddd5", fillerVia: "#cfd4cb", bus: "#cdd2c9", silk: "#1d211e", silkDim: "#5f655f", fid: "#c3c8c0", core: 0xd8dbd4 }
};

export async function create(canvas, dotnet, data) {
    const fail = () => { document.documentElement.classList.add("no-board-gl"); return { setTheme() { }, focusProject() { }, update() { }, dispose() { } }; };
    if (!webglAvailable()) return fail();
    let THREE;
    try { THREE = await loadThree(); } catch { return fail(); }
    if (!canvas.isConnected) return fail();

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = () => matchMedia("(max-width: 860px)").matches;
    const mobile = narrow();
    let theme = data.theme === "light" ? "light" : "dark";
    let disposed = false;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
    catch { return fail(); }
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0, 16, 40);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

    // otoczenie dla odbić w złotych padach
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x0b0b0b);
    const envPanel = (w, h, x, y, z, c, k) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    envPanel(14, 5, 0, 9, 2, 0xfff0d8, 2.4); envPanel(6, 8, -9, 3, 5, 0x9fb4d8, 0.9); envPanel(8, 3, 9, 2, -6, 0xffd9a8, 1.4); envPanel(20, 1, 0, 1, -10, 0xffffff, 0.6);
    const envTex = pm.fromScene(env, 0.04).texture;
    scene.environment = envTex;

    const hemi = new THREE.HemisphereLight(0xdfe6ff, 0x0a0806, 0.35);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
    key.position.set(-6, 14, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 9, bottom: -9 });
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa9c2ff, 0.5);
    rim.position.set(8, 4, -10);
    scene.add(rim);

    /* ---- rozkład elementów (jednostki płyty: x -10..10, z -6..6) ---- */
    const BW = 20, BD = 12;
    const cpu = { x: 0.4, z: 0, s: 3.3 };
    const vrm = [-1.2, 0, 1.2, 2.4].map(x => ({ x, z: -3.35 }));
    const dimm = [4.5, 5.2, 5.9, 6.6].map(x => ({ x, z: 0 }));
    const tech = [-4.1, -2.05, 0, 2.05, 4.1].map(z => ({ x: 8.7, z }));
    const proj = [];
    [-2.9, -0.35, 2.2].forEach(z => [-8.3, -6.3, -4.3].forEach(x => proj.push({ x, z })));
    const idm = { x: 0.4, z: 3.95 };
    const cvs = [{ x: -2.75, z: 4.2 }, { x: -1.6, z: 4.2 }];
    const io = { x: -6.4, z: -5.15 };
    const nProj = Math.min(data.projects.length, proj.length);

    function route(a, b, xFirst = true) {
        const dx = b.x - a.x, dz = b.z - a.z, pts = [[a.x, a.z]];
        if (xFirst) pts.push(Math.abs(dx) > Math.abs(dz) ? [b.x - Math.sign(dx) * Math.abs(dz), a.z] : [a.x, a.z]);
        else pts.push(Math.abs(dz) > Math.abs(dx) ? [a.x, b.z - Math.sign(dz) * Math.abs(dx)] : [a.x, a.z]);
        pts.push([b.x, b.z]);
        return pts;
    }
    const buses = [];
    function bus(sec, a, b, n, gap, xFirst, perp) {
        const lines = [];
        for (let i = 0; i < n; i++) {
            const o = (i - (n - 1) / 2) * gap;
            const off = perp === "z" ? { x: 0, z: o } : { x: o, z: 0 };
            lines.push(route({ x: a.x + off.x, z: a.z + off.z }, { x: b.x + off.x, z: b.z + off.z }, xFirst));
        }
        buses.push({ sec, lines });
    }
    const ce = cpu.s / 2 + 0.45;
    dimm.forEach((d, i) => bus("services", { x: cpu.x + ce, z: -0.9 + i * 0.6 }, { x: d.x, z: -0.9 + i * 0.6 }, 3, 0.1, true, "z"));
    for (let i = 0; i < nProj; i++) bus("projects:" + i, { x: cpu.x - ce, z: -1.2 + (i % 3) * 0.3 + Math.floor(i / 3) * 0.9 }, { x: proj[i].x + 0.95, z: proj[i].z }, 3, 0.09, true, "z");
    vrm.forEach(v => bus("process", { x: v.x, z: cpu.z - ce }, { x: v.x, z: v.z + 0.6 }, 2, 0.14, false, "x"));
    tech.forEach(t => bus("tech", { x: dimm[3].x + 0.5, z: t.z * 0.6 }, { x: t.x - 1, z: t.z }, 4, 0.09, true, "z"));
    bus("about", { x: idm.x, z: cpu.z + ce }, { x: idm.x, z: idm.z - 0.8 }, 6, 0.12, false, "x");
    cvs.forEach(c => bus("cv", { x: cpu.x - 1.1, z: cpu.z + ce }, { x: c.x, z: c.z - 0.45 }, 2, 0.1, false, "x"));
    bus("contact", { x: cpu.x - 1.2, z: cpu.z - ce }, { x: io.x + 1.5, z: io.z + 0.2 }, 4, 0.1, false, "x");

    /* ---- tekstura laminatu ---- */
    const S = mobile ? 100 : 150, TW = BW * S, TH = BD * S;
    const cv = document.createElement("canvas"); cv.width = TW; cv.height = TH;
    const rm = document.createElement("canvas"); rm.width = TW; rm.height = TH;
    const X = x => (x + BW / 2) * S, Z = z => (z + BD / 2) * S;
    const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const mapTex = new THREE.CanvasTexture(cv);
    mapTex.encoding = THREE.sRGBEncoding;
    mapTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const rmTex = new THREE.CanvasTexture(rm);

    function paintBoard() {
        const P = PALETTES[theme], g = cv.getContext("2d"), r = rm.getContext("2d"), R = rnd(7);
        g.fillStyle = P.mask; g.fillRect(0, 0, TW, TH);
        r.fillStyle = "rgb(0,200,0)"; r.fillRect(0, 0, TW, TH);
        g.fillStyle = P.pour;
        for (let i = 0; i < 14; i++) g.fillRect(R() * TW, R() * TH, (0.8 + R() * 3) * S, (0.6 + R() * 2) * S);
        g.lineCap = "round"; g.lineJoin = "round";
        const stroke = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))); g.stroke(); };
        for (let i = 0; i < 260; i++) {
            const a = { x: -10 + R() * 20, z: -6 + R() * 12 }, len = 0.6 + R() * 3.5, dir = R() < 0.5;
            const b = dir ? { x: a.x + (R() < 0.5 ? -1 : 1) * len, z: a.z + (R() - 0.5) * len * 0.7 } : { x: a.x + (R() - 0.5) * len * 0.7, z: a.z + (R() < 0.5 ? -1 : 1) * len };
            const n = 1 + Math.floor(R() * 4);
            for (let k = 0; k < n; k++) { const o = k * 0.09; stroke(route({ x: a.x + (dir ? 0 : o), z: a.z + (dir ? o : 0) }, { x: b.x + (dir ? 0 : o), z: b.z + (dir ? o : 0) }, dir), P.filler, S * 0.028); }
            g.fillStyle = P.fillerVia;
            [a, b].forEach(p => { g.beginPath(); g.arc(X(p.x), Z(p.z), S * 0.035, 0, 7); g.fill(); });
        }
        buses.forEach(b => b.lines.forEach(l => stroke(l, P.bus, S * 0.04)));
        const via = (x, z, rad = 0.05) => {
            g.fillStyle = "#b8954a"; g.beginPath(); g.arc(X(x), Z(z), S * rad, 0, 7); g.fill();
            g.fillStyle = theme === "dark" ? "#050605" : "#2a2d29"; g.beginPath(); g.arc(X(x), Z(z), S * rad * 0.45, 0, 7); g.fill();
            r.fillStyle = "rgb(0,70,255)"; r.beginPath(); r.arc(X(x), Z(z), S * rad, 0, 7); r.fill();
        };
        for (let i = 0; i < 420; i++) via(-9.8 + R() * 19.6, -5.8 + R() * 11.6, 0.03 + R() * 0.02);
        buses.forEach(b => b.lines.forEach(l => via(l[0][0], l[0][1], 0.045)));
        const pad = (x, z, w, d) => { g.fillStyle = "#c9a24f"; g.fillRect(X(x - w / 2), Z(z - d / 2), w * S, d * S); r.fillStyle = "rgb(0,60,255)"; r.fillRect(X(x - w / 2), Z(z - d / 2), w * S, d * S); };
        const qfpPads = (c, s, n) => { const st = s / (n + 1); for (let i = 1; i <= n; i++) { const o = -s / 2 + i * st; pad(c.x + o, c.z - s / 2 - 0.12, st * 0.45, 0.2); pad(c.x + o, c.z + s / 2 + 0.12, st * 0.45, 0.2); pad(c.x - s / 2 - 0.12, c.z + o, 0.2, st * 0.45); pad(c.x + s / 2 + 0.12, c.z + o, 0.2, st * 0.45); } };
        for (let i = 0; i < nProj; i++) qfpPads(proj[i], 1.35, 9);
        tech.forEach(t => { for (let i = 0; i < 7; i++) { const o = -0.6 + i * 0.2; pad(t.x + o, t.z - 0.62, 0.09, 0.22); pad(t.x + o, t.z + 0.62, 0.09, 0.22); } });
        cvs.forEach(c => { for (let i = 0; i < 4; i++) { const o = -0.3 + i * 0.2; pad(c.x + o, c.z - 0.42, 0.1, 0.2); pad(c.x + o, c.z + 0.42, 0.1, 0.2); } });
        const hole = (x, z) => { g.fillStyle = "#c9a24f"; g.beginPath(); g.arc(X(x), Z(z), S * 0.32, 0, 7); g.fill(); r.fillStyle = "rgb(0,70,255)"; r.beginPath(); r.arc(X(x), Z(z), S * 0.32, 0, 7); r.fill(); g.fillStyle = "#030303"; g.beginPath(); g.arc(X(x), Z(z), S * 0.17, 0, 7); g.fill(); };
        [[-9.4, -5.4], [9.4, -5.4], [-9.4, 5.4], [9.4, 5.4], [3.3, 5.3]].forEach(p => hole(p[0], p[1]));
        [[-9.5, 0], [9.5, -0.1], [0, 5.6]].forEach(p => { g.fillStyle = "#d4ae5a"; g.beginPath(); g.arc(X(p[0]), Z(p[1]), S * 0.07, 0, 7); g.fill(); g.strokeStyle = P.fid; g.lineWidth = 2; g.beginPath(); g.arc(X(p[0]), Z(p[1]), S * 0.16, 0, 7); g.stroke(); });

        const text = (t, x, z, size, o = {}) => { g.save(); g.translate(X(x), Z(z)); if (o.rot) g.rotate(o.rot); g.fillStyle = o.col || P.silk; g.font = `${o.w || 500} ${size * S}px "IBM Plex Mono", monospace`; g.textAlign = o.align || "center"; g.textBaseline = "middle"; g.fillText(t, 0, 0); g.restore(); };
        const outline = (x, z, w, d, pin1 = true) => { g.strokeStyle = P.silk; g.lineWidth = S * 0.018; g.strokeRect(X(x - w / 2), Z(z - d / 2), w * S, d * S); if (pin1) { g.fillStyle = P.silk; g.beginPath(); g.arc(X(x - w / 2 - 0.12), Z(z - d / 2 - 0.12), S * 0.05, 0, 7); g.fill(); } };
        outline(cpu.x, cpu.z, 4.3, 4.3); text("U1", cpu.x - 2.35, cpu.z - 2.35, 0.2, { align: "left" }); text("SOCKET DD-2007", cpu.x, cpu.z + 2.38, 0.13);
        for (let i = 0; i < nProj; i++) { const p = proj[i]; outline(p.x, p.z, 1.9, 1.9); text("U" + (10 + i), p.x - 0.95, p.z + 1.13, 0.16, { align: "left" }); text(data.projects[i].years.replace(/\s/g, ""), p.x + 0.95, p.z + 1.13, 0.11, { align: "right", col: P.silkDim }); }
        tech.forEach((t, i) => { outline(t.x, t.z, 1.6, 1.5, false); text("U" + (5 + i), t.x - 0.95, t.z, 0.15, { rot: -Math.PI / 2 }); });
        dimm.forEach((d, i) => text(["DIMM_A1", "DIMM_A2", "DIMM_B1", "DIMM_B2"][i], d.x, 4.6, 0.12, { rot: -Math.PI / 2 }));
        text("J1  J2  J3  J4", 5.55, -4.55, 0.15);
        vrm.forEach((v, i) => { outline(v.x, v.z, 1.05, 1.05, false); text("L" + (i + 1), v.x, v.z - 0.72, 0.14); });
        text("VCORE 4-PHASE", 0.6, -4.55, 0.12);
        outline(idm.x, idm.z, 2, 1.6); text("U2  ID SENSOR", idm.x + 1.15, idm.z + 0.95, 0.12, { align: "left" });
        cvs.forEach((c, i) => { outline(c.x, c.z, 0.95, 0.75); text("U" + (20 + i), c.x, c.z + 0.62, 0.12); });
        text("CV FLASH", -2.17, 4.95, 0.1);
        text("J9", io.x - 1.9, io.z + 0.95, 0.15); text("J10", io.x, io.z + 0.95, 0.15); text("J11", io.x + 1.6, io.z + 0.95, 0.15);
        text("I/O  ·  CONTACT", io.x, io.z + 1.25, 0.1, { col: P.silkDim });
        g.globalAlpha = 0.85; text("DAVIT FUTURES", -6.3, 4.6, 0.32); text("MB-2026  REV 3.0  ·  WROCŁAW PL", -6.3, 5.08, 0.13); g.globalAlpha = 1;
        text("94V-0", 7.5, 5.55, 0.12); text("E487", 8.6, 5.55, 0.12); text("LEAD FREE", 9.6, 5.55, 0.1, { align: "right" });
        const RB = rnd(5);
        for (let i = 0; i < 34; i++) { g.fillStyle = P.silk; g.fillRect(X(4.3) + i * S * 0.045, Z(5.25), RB() < 0.5 ? S * 0.018 : S * 0.03, S * 0.22); }
        text("SN 2007-2026-0001", 5.05, 5.65, 0.09);
        mapTex.needsUpdate = true; rmTex.needsUpdate = true;

        scene.background = new THREE.Color(P.bg);
        scene.fog.color.set(P.bg);
        core.material.color.set(P.core);
        hemi.intensity = theme === "dark" ? 0.35 : 0.6;
    }

    const board = new THREE.Group();
    scene.add(board);
    const core = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.16, BD), new THREE.MeshStandardMaterial({ roughness: 0.8 }));
    core.position.y = -0.08; core.receiveShadow = true; board.add(core);
    const topGeo = new THREE.PlaneGeometry(BW, BD); topGeo.rotateX(-Math.PI / 2);
    const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ map: mapTex, roughnessMap: rmTex, metalnessMap: rmTex, roughness: 1, metalness: 1, envMapIntensity: 1.1 }));
    top.position.y = 0.002; top.receiveShadow = true; board.add(top);
    paintBoard();

    /* ---- elementy ---- */
    const hit = [];
    function labelTex(lines, w, h, o = {}) {
        const c = document.createElement("canvas"), k = 256 / Math.max(w, h);
        c.width = Math.round(w * k * 2); c.height = Math.round(h * k * 2);
        const x = c.getContext("2d");
        x.fillStyle = o.bg || "#151618"; x.fillRect(0, 0, c.width, c.height);
        if (o.noise) for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; x.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2); }
        x.fillStyle = o.fg || "#7d8080"; x.textAlign = "center"; x.textBaseline = "middle";
        const lh = c.height / (lines.length + 1.4);
        lines.forEach((l, i) => {
            const sz = Math.min((i === 0 ? o.big || 0.17 : o.small || 0.11) * c.width, lh * 0.8);
            x.font = i === 0 && o.display ? `${sz}px Michroma, sans-serif` : `500 ${sz}px "IBM Plex Mono", monospace`;
            let s = l;
            while (s.length > 3 && x.measureText(s).width > c.width * 0.9) s = s.slice(0, -1);
            x.fillText(s, c.width / 2, lh * (i + 1.1));
        });
        if (o.dot !== false) { x.beginPath(); x.arc(c.width * 0.1, c.height * 0.12, c.width * 0.03, 0, 7); x.globalAlpha = 0.6; x.fill(); x.globalAlpha = 1; }
        const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
    }
    const plastic = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.55, metalness: 0.1 });
    function chip(w, d, h, tex, side = plastic, topRough = 0.5) {
        const topM = new THREE.MeshStandardMaterial({ map: tex, roughness: topRough, metalness: side.metalness });
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, topM, side, side, side]);
        m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true; return m;
    }
    function group(x, z, sec, label) { const gr = new THREE.Group(); gr.position.set(x, 0, z); gr.userData = { sec, label }; board.add(gr); return gr; }
    const pinList = [];
    function pins(gr, s, n, len = 0.18) { const st = s / (n + 1), wid = st * 0.38; for (let i = 1; i <= n; i++) { const o = -s / 2 + i * st; pinList.push([gr, o, -s / 2 - len / 2, wid, len], [gr, o, s / 2 + len / 2, wid, len], [gr, -s / 2 - len / 2, o, len, wid], [gr, s / 2 + len / 2, o, len, wid]); } }

    // CPU
    const cpuG = group(cpu.x, cpu.z, "hero", "U1 · " + data.labels.cpu);
    const sock = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 4.2), new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.7 }));
    sock.position.y = 0.11; sock.castShadow = sock.receiveShadow = true; cpuG.add(sock);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 10), new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 1, roughness: 0.3 }));
    lever.rotation.x = Math.PI / 2; lever.position.set(2.25, 0.18, 0); cpuG.add(lever);
    const subs = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 3.5), new THREE.MeshStandardMaterial({ color: 0x1f3a2c, roughness: 0.6 }));
    subs.position.y = 0.26; cpuG.add(subs);
    const ihs = chip(3.0, 3.0, 0.32, labelTex(["DAVIT FUTURES", "DD-2007 · 18+ YRS", ".NET · WEB · DEVOPS", "WROCŁAW  PL  2026"], 3, 3, { bg: "#b9bbbc", fg: "#5d6063", big: 0.1, small: 0.06, display: true, noise: true }),
        new THREE.MeshStandardMaterial({ color: 0xc4c6c8, metalness: 1, roughness: 0.32 }), 0.38);
    ihs.position.y = 0.46; cpuG.add(ihs); hit.push(ihs);

    // zasilanie: dławiki = kroki współpracy
    vrm.forEach((v, i) => {
        const gr = group(v.x, v.z, "process", "L" + (i + 1) + " · " + (data.process[i] || ""));
        const ch = chip(0.95, 0.95, 0.62, labelTex(["R" + (22 + i * 10), "PHASE " + (i + 1)], 1, 1, { bg: "#3b3d40", fg: "#9a9c9e", big: 0.22, small: 0.13, dot: false }), new THREE.MeshStandardMaterial({ color: 0x3e4043, roughness: 0.45, metalness: 0.4 }));
        gr.add(ch); hit.push(ch);
        const mf = chip(0.5, 0.4, 0.12, labelTex(["Q" + (i + 1)], 0.5, 0.4, { big: 0.3, dot: false })); mf.position.z = -0.75; gr.add(mf);
        [-0.36, 0.36].forEach(o => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.55, 20), new THREE.MeshStandardMaterial({ color: 0x1f2022, metalness: 0.6, roughness: 0.35 })); cap.position.set(o, 0.275, 0.82); cap.castShadow = true; gr.add(cap); });
    });

    // RAM = usługi
    const dimmLabels = ["WEB+API", "MOBILE+DESK", "SAAS+DEVOPS", "AI"];
    dimm.forEach((d, i) => {
        const gr = group(d.x, d.z, "services", "J" + (i + 1) + " · " + (data.services[i * 2] || data.services[0] || ""));
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 8.6), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.6 }));
        slot.position.y = 0.18; slot.castShadow = slot.receiveShadow = true; gr.add(slot);
        [-4.4, 4.4].forEach(z => { const latch = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 0.18), new THREE.MeshStandardMaterial({ color: 0xcfd0cc, roughness: 0.5 })); latch.position.set(0, 0.3, z); gr.add(latch); });
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 8.2), new THREE.MeshStandardMaterial({ color: 0x0f1411, roughness: 0.6 }));
        stick.position.y = 0.98; stick.castShadow = true; gr.add(stick); hit.push(stick);
        for (let k = 0; k < 8; k++) [-1, 1].forEach(sd => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.78), plastic); m.position.set(sd * 0.055, 1.08, -3.6 + k * 1.03); gr.add(m); });
        const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.34), new THREE.MeshStandardMaterial({ map: labelTex(["DD4-2007 · " + dimmLabels[i]], 4, 0.8, { bg: "#d9d7cf", fg: "#25262a", big: 0.07, dot: false }), roughness: 0.6 }));
        sp.position.set(0.035, 1.44, 0); sp.rotation.y = Math.PI / 2; gr.add(sp);
        const sp2 = sp.clone(); sp2.position.x = -0.035; sp2.rotation.y = -Math.PI / 2; gr.add(sp2);
    });

    // technologie
    tech.forEach((t, i) => {
        const g = data.tech[i];
        if (!g) return;
        const gr = group(t.x, t.z, "tech", "U" + (5 + i) + " · " + g.name);
        const c = chip(1.35, 1.05, 0.16, labelTex([g.name.toUpperCase(), g.items.slice(0, 2).join(" · ").toUpperCase(), "DD-" + (500 + i * 7)], 1.35, 1.05, { big: 0.13, small: 0.075 }));
        gr.add(c); hit.push(c);
        for (let k = 0; k < 7; k++) { const o = -0.6 + k * 0.2; [-1, 1].forEach(sd => pinList.push([gr, o, sd * 0.6, 0.08, 0.16])); }
    });

    // projekty
    for (let i = 0; i < nProj; i++) {
        const p = data.projects[i], pos = proj[i];
        const gr = group(pos.x, pos.z, "projects:" + i, "U" + (10 + i) + " · " + p.name);
        const c = chip(1.35, 1.35, 0.2, labelTex([p.short, p.chip, p.years.replace(/\s/g, "")], 1.35, 1.35, { big: 0.12, small: 0.085 }));
        gr.add(c); hit.push(c);
        pins(gr, 1.35, 9, 0.2);
    }

    // matryca ze zdjęciem = o mnie
    {
        const gr = group(idm.x, idm.z, "about", "U2 · " + data.labels.about);
        const base = chip(1.8, 1.4, 0.22, labelTex(["ID SENSOR"], 1.8, 1.4, { big: 0.06, dot: false }));
        gr.add(base);
        const img = new Image();
        const tex = new THREE.Texture(img);
        tex.encoding = THREE.sRGBEncoding;
        img.onload = () => { tex.needsUpdate = true; };
        img.src = data.photo;
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.22, 48), [new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0.6, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.15, metalness: 0 }), plastic]);
        lens.position.y = 0.33; lens.rotation.y = Math.PI / 2; lens.castShadow = true; gr.add(lens);
        hit.push(lens, base);
    }

    // pamięć flash = CV
    cvs.forEach((c, i) => {
        const gr = group(c.x, c.z, "cv", "U" + (20 + i) + " · " + (data.cv[i] || "CV"));
        const m = chip(0.85, 0.62, 0.14, labelTex([i ? "CV FULL" : "CV SHORT", data.cvPages[i] || "", "25Q-DD"], 0.85, 0.62, { big: 0.16, small: 0.1 }));
        gr.add(m); hit.push(m);
        for (let k = 0; k < 4; k++) { const o = -0.3 + k * 0.2; [-1, 1].forEach(sd => pinList.push([gr, o, sd * 0.38, 0.07, 0.14])); }
    });

    // złącza = kontakt
    {
        const gr = group(io.x, io.z, "contact", "J9–J11 · " + data.labels.contact);
        const steel = new THREE.MeshStandardMaterial({ color: 0xbfc2c4, metalness: 1, roughness: 0.3 });
        const rj = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.5), steel); rj.position.set(-1.9, 0.55, -0.1); rj.castShadow = true; gr.add(rj); hit.push(rj);
        const hole = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.05), new THREE.MeshStandardMaterial({ color: 0x050505 })); hole.position.set(-1.9, 0.5, -0.86); gr.add(hole);
        [[0, 0.9], [1.6, 0.9]].forEach(([x, w]) => {
            const u = new THREE.Mesh(new THREE.BoxGeometry(w, 0.36, 1.2), steel); u.position.set(x, 0.18, 0); u.castShadow = true; gr.add(u); hit.push(u);
            const ins = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0x050505 })); ins.position.set(x, 0.18, -0.61); gr.add(ins);
        });
    }

    // drobne elementy SMD
    const pasN = mobile ? 110 : 240;
    const pasG = new THREE.BoxGeometry(1, 1, 1);
    const pasM = new THREE.InstancedMesh(pasG, new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6 }), pasN);
    const capM = new THREE.InstancedMesh(pasG, new THREE.MeshStandardMaterial({ color: 0x4d4030, roughness: 0.5 }), pasN);
    const dummy = new THREE.Object3D();
    const busy = [[cpu.x, cpu.z, 2.4, 2.4], [5.5, 0, 1.5, 4.6], [8.7, 0, 1, 5], [-6.3, -0.35, 3.1, 3.8], [idm.x, idm.z, 1.2, 1], [-2.2, 4.2, 1, 0.6], [io.x, io.z, 2.8, 1], [0.6, -3.6, 2.4, 1.2], [-6.3, 4.8, 2.5, 0.7], [5, 5.4, 1, 0.4]];
    const free = (x, z) => !busy.some(b => Math.abs(x - b[0]) < b[2] && Math.abs(z - b[1]) < b[3]);
    let pi = 0, ci = 0;
    const R2 = rnd(11);
    for (let t = 0; t < 4000 && (pi < pasN || ci < pasN); t++) {
        const x = -9.6 + R2() * 19.2, z = -5.7 + R2() * 11.4;
        if (!free(x, z)) continue;
        const rot = R2() < 0.5 ? 0 : Math.PI / 2;
        const tgt = R2() < 0.5 ? (pi < pasN ? pasM : null) : (ci < pasN ? capM : null);
        if (!tgt) continue;
        dummy.position.set(x, 0.035, z); dummy.rotation.set(0, rot, 0); dummy.scale.set(0.14, 0.05, 0.07); dummy.updateMatrix();
        tgt.setMatrixAt(tgt === pasM ? pi++ : ci++, dummy.matrix);
    }
    pasM.count = pi; capM.count = ci; pasM.castShadow = capM.castShadow = true;
    board.add(pasM, capM);

    const pinMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd9b35e, metalness: 1, roughness: 0.28 }), Math.max(1, pinList.length));
    pinMesh.castShadow = true; board.add(pinMesh);
    function writePins() {
        pinList.forEach((p, i) => { const gr = p[0]; dummy.position.set(gr.position.x + p[1], 0.03 + gr.position.y, gr.position.z + p[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(p[3], 0.05, p[4]); dummy.updateMatrix(); pinMesh.setMatrixAt(i, dummy.matrix); });
        pinMesh.instanceMatrix.needsUpdate = true;
    }
    writePins();

    /* ---- impulsy sygnału ---- */
    const lines = [];
    buses.forEach(b => b.lines.forEach(l => { let len = 0; const seg = []; for (let i = 1; i < l.length; i++) { const d = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); seg.push(d); len += d; } if (len > 0.05) lines.push({ sec: b.sec, pts: l, seg, len }); }));
    const NP = mobile ? 160 : 360;
    const pPos = new Float32Array(NP * 3), pA = new Float32Array(NP), R3 = rnd(3);
    const pulses = Array.from({ length: NP }, () => ({ l: Math.floor(R3() * lines.length), t: R3(), v: 0.35 + R3() * 0.6 }));
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("a", new THREE.BufferAttribute(pA, 1));
    const pMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { px: { value: renderer.getPixelRatio() }, tint: { value: new THREE.Color(1, 0.86, 0.58) } },
        vertexShader: "attribute float a;varying float va;uniform float px;void main(){va=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(28.*px)*(1./-mv.z)*(.6+a);gl_Position=projectionMatrix*mv;}",
        fragmentShader: "varying float va;uniform vec3 tint;void main(){float d=length(gl_PointCoord-.5);float k=smoothstep(.5,0.,d);gl_FragColor=vec4(tint*k*va*1.6,k*va);}"
    });
    const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; board.add(pts);
    const along = (L, t) => { let d = t * L.len; for (let i = 0; i < L.seg.length; i++) { if (d <= L.seg[i]) { const a = L.pts[i], b = L.pts[i + 1], k = d / L.seg[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } d -= L.seg[i]; } return L.pts[L.pts.length - 1]; };

    /* ---- kamera i sekcje ---- */
    let activeSec = "hero", activeProject = 0, focusP = null;
    const secMatch = s => activeSec === "projects" || activeSec === "timeline" ? s === "projects:" + activeProject : (s === activeSec || activeSec === "hero");
    const pickActive = () => { const c = []; lines.forEach((l, i) => { if (secMatch(l.sec)) c.push(i); }); return c.length ? c[Math.floor(R3() * c.length)] : Math.floor(R3() * lines.length); };
    const K = () => {
        const m = narrow();
        return {
            hero: { x: 0.9, z: 0.4, d: m ? 16 : 13.5, el: 52, az: -24 },
            about: { x: idm.x, z: idm.z, d: m ? 6.5 : 5.2, el: 58, az: 12 },
            services: { x: 5.5, z: 0, d: m ? 14 : 10.5, el: 38, az: 40 },
            process: { x: 0.6, z: -3.5, d: m ? 8 : 6.2, el: 44, az: -18 },
            tech: { x: 8.7, z: 0, d: m ? 14 : 11, el: 56, az: 28 },
            projects: { x: -6.3, z: -0.35, d: m ? 13 : 10, el: 62, az: -16 },
            timeline: { x: -6.3, z: -0.35, d: m ? 15 : 12.5, el: 70, az: -8 },
            cv: { x: -2.17, z: 4.2, d: m ? 5.5 : 4.2, el: 52, az: 6 },
            contact: { x: io.x, z: io.z, d: m ? 9 : 7, el: 34, az: -30 }
        };
    };
    function goal() {
        const k = K();
        if ((activeSec === "projects") && focusP !== null && proj[focusP]) { const p = proj[focusP]; return { x: p.x, z: p.z, d: narrow() ? 6 : 4.6, el: 60, az: -10 }; }
        return k[activeSec] || k.hero;
    }
    const cur = { ...K().hero, d: K().hero.d + 6, el: 70, az: -40 };

    const sections = [...document.querySelectorAll("[data-board]")];
    function track() {
        const mid = innerHeight * 0.5;
        let best = "hero";
        for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) best = s.dataset.board; }
        if (best !== activeSec) { activeSec = best; if (best !== "projects") focusP = null; }
    }
    addEventListener("scroll", track, { passive: true });
    track();

    let mx = 0, my = 0;
    const onPointer = e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    addEventListener("pointermove", onPointer, { passive: true });

    /* ---- najechanie i klik ---- */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let hov = null;
    const tip = document.createElement("div");
    tip.className = "board-tip"; tip.hidden = true; document.body.append(tip);
    const groupOf = o => { while (o && !(o.userData && o.userData.sec)) o = o.parent; return o; };
    // Canvas leży pod treścią, więc trafienia liczymy z pozycji kursora na całym oknie, gdy pod kursorem nie ma karty.
    const overContent = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el !== canvas && !el.classList.contains("board-sec"); };
    function onMove(e) {
        if (overContent(e)) { if (hov) { hov = null; tip.hidden = true; document.body.style.cursor = ""; } return; }
        ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const h = ray.intersectObjects(hit, false)[0];
        const gr = h ? groupOf(h.object) : null;
        if (gr !== hov) { hov = gr; document.body.style.cursor = gr ? "pointer" : ""; }
        if (gr) {
            tip.hidden = false; tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px";
            const [a, ...b] = gr.userData.label.split(" · ");
            tip.replaceChildren(Object.assign(document.createElement("b"), { textContent: a }), b.join(" · "));
        } else tip.hidden = true;
    }
    function onClick(e) {
        if (!hov || overContent(e)) return;
        const s = hov.userData.sec;
        if (s.startsWith("projects:")) {
            const i = +s.split(":")[1];
            activeProject = i; focusP = i;
            dotnet.invokeMethodAsync("OnProjectPicked", i);
            document.getElementById("board-projects")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        } else document.getElementById("board-" + s)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("click", onClick);

    function resize() {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        if (narrow()) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
        else camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
        camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock(), tgt = new THREE.Vector3(), deg = Math.PI / 180;
    let raf = 0, visible = !document.hidden;
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    function frame() {
        raf = requestAnimationFrame(frame);
        if (!visible || disposed) return;
        const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
        const G = goal(), k = reduce ? 1 : 1 - Math.exp(-dt * 2.4);
        for (const p of ["x", "z", "d", "el", "az"]) cur[p] += (G[p] - cur[p]) * k;
        const az = (cur.az + mx * 7 + (reduce ? 0 : Math.sin(t * 0.13) * 2.5)) * deg, el = (cur.el - my * 5) * deg;
        tgt.set(cur.x, 0, cur.z);
        camera.position.set(tgt.x + cur.d * Math.cos(el) * Math.sin(az), cur.d * Math.sin(el), tgt.z + cur.d * Math.cos(el) * Math.cos(az));
        camera.lookAt(tgt);
        let moved = false;
        board.children.forEach(gr => {
            const s = gr.userData && gr.userData.sec;
            if (!s) return;
            const act = (s === activeSec && activeSec !== "hero") || ((activeSec === "projects" || activeSec === "timeline") && s === "projects:" + activeProject);
            const want = gr === hov ? 0.12 : act ? 0.05 : 0;
            const nv = gr.position.y + (want - gr.position.y) * (reduce ? 1 : 1 - Math.exp(-dt * 10));
            if (Math.abs(nv - gr.position.y) > 1e-4) { gr.position.y = nv; moved = true; }
        });
        if (moved) writePins();
        for (let i = 0; i < NP; i++) {
            const p = pulses[i], L = lines[p.l], on = secMatch(L.sec);
            if (!reduce) p.t += dt * p.v * (on ? 1.6 : 1) / Math.max(L.len, 0.5) * 1.4;
            if (p.t > 1) { p.t = 0; p.l = R3() < 0.55 ? pickActive() : Math.floor(R3() * lines.length); }
            const q = along(lines[p.l], p.t);
            pPos[i * 3] = q[0]; pPos[i * 3 + 1] = 0.03; pPos[i * 3 + 2] = q[1];
            pA[i] = (secMatch(lines[p.l].sec) ? 1 : 0.28) * Math.sin(Math.PI * Math.min(1, p.t)) * (reduce ? 0.6 : 1);
        }
        pGeo.attributes.position.needsUpdate = true; pGeo.attributes.a.needsUpdate = true;
        renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);
    document.documentElement.classList.add("board-ready");

    return {
        setTheme(next) {
            const t = next === "light" ? "light" : "dark";
            if (t === theme) return;
            theme = t;
            pMat.uniforms.tint.value.set(t === "dark" ? 0xffdb94 : 0xff9a2e);
            pMat.blending = t === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending;
            pMat.needsUpdate = true;
            paintBoard();
        },
        focusProject(i) { activeProject = i; focusP = activeSec === "projects" ? i : null; },
        dispose() {
            disposed = true;
            cancelAnimationFrame(raf);
            removeEventListener("scroll", track);
            removeEventListener("pointermove", onPointer);
            removeEventListener("pointermove", onMove);
            removeEventListener("click", onClick);
            removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVis);
            document.body.style.cursor = "";
            tip.remove();
            document.documentElement.classList.remove("board-ready");
            renderer.dispose();
            envTex.dispose();
            pm.dispose();
        }
    };
}
