
import express from "express";
import open from "open";
import { aggregateDecls } from "../dsl/aggregator.js";
import path from "node:path";
import fs from "node:fs";
import type { Request, Response } from "express";

export async function runStudio(args: string[]) {
    const dslFiles = args.filter(a => a.endsWith(".dsl.ts"));
    if (dslFiles.length === 0) {
        console.error("Usage: irgen studio <dsl-file>...");
        process.exit(1);
    }

    const app = express();
    const port = 3000;

    // Cache for IR
    let currentIR: any = null;

    const reload = async () => {
        try {
            console.log("Loading DSL for Studio...");
            currentIR = await aggregateDecls(dslFiles);
            console.log("DSL loaded successfully.");
        } catch (err: any) {
            console.error("Failed to load DSL in Studio:", err.message);
        }
    };

    await reload();

    // Simple Watcher
    dslFiles.forEach(file => {
        fs.watch(path.resolve(process.cwd(), file), async (event) => {
            if (event === "change") {
                console.log(`Changes detected in ${file}, reloading...`);
                await reload();
            }
        });
    });

    // API
    app.get("/api/ir", (req: Request, res: Response) => {
        if (!currentIR) return res.status(500).json({ error: "IR not loaded" });
        res.json(currentIR);
    });

    // Static UI
    // For now, let's embed a simple but beautiful HTML
    app.get("/", (req: Request, res: Response) => {
        res.send(getStudioHtml());
    });

    app.listen(port, () => {
        console.log(`Studio Dashboard running at http://localhost:${port}`);
        console.log("Press Ctrl+C to stop.");
        if (process.env.OPEN_BROWSER !== "false") {
            open(`http://localhost:${port}`);
        }
    });
}

function getStudioHtml() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>irgen Studio Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f19;
            --sidebar: #111827;
            --card: #1f2937;
            --accent: #38bdf8;
            --accent-glow: rgba(56, 189, 248, 0.4);
            --text: #f3f4f6;
            --text-dim: #9ca3af;
            --success: #10b981;
            --border: rgba(255, 255, 255, 0.08);
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }
        aside {
            width: 280px;
            background: var(--sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 24px;
        }
        main {
            flex: 1;
            padding: 40px;
            overflow-y: auto;
            background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.03) 0%, transparent 100%);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 40px;
            font-weight: 600;
            font-size: 1.25rem;
            color: var(--accent);
        }
        .logo svg { width: 32px; height: 32px; filter: drop-shadow(0 0 8px var(--accent-glow)); }

        .nav-section { margin-bottom: 32px; }
        .nav-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-dim);
            margin-bottom: 12px;
            opacity: 0.6;
        }
        .nav-item {
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            color: var(--text-dim);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            margin-bottom: 4px;
        }
        .nav-item:hover { background: rgba(255,255,255,0.03); color: var(--text); }
        .nav-item.active { background: rgba(56, 189, 248, 0.1); color: var(--accent); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; margin-left: -24px; padding-left: 21px; }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
        }
        .title-area h2 { margin: 0; font-size: 2rem; font-weight: 600; }
        .title-area p { margin: 8px 0 0; color: var(--text-dim); }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: var(--card);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid var(--border);
            transition: transform 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-value { font-size: 24px; font-weight: 600; color: var(--accent); }
        .stat-label { font-size: 12px; color: var(--text-dim); margin-top: 4px; }

        .card {
            background: var(--card);
            border-radius: 16px;
            padding: 32px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        
        .badge {
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
            background: rgba(56, 189, 248, 0.1);
            color: var(--accent);
            border: 1px solid rgba(56, 189, 248, 0.2);
        }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 12px; color: var(--text-dim); font-weight: 400; border-bottom: 1px solid var(--border); font-size: 13px; }
        td { padding: 16px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
        .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

        .indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .pulse { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    </style>
</head>
<body>
    <aside>
        <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            irgen Studio
        </div>
        <div class="nav-section">
            <div class="nav-label">Overview</div>
            <div class="nav-item active" onclick="renderOverview()">Project Overview</div>
        </div>
        <div id="nav-apps"></div>
    </aside>
    <main>
        <div class="header">
            <div class="title-area" id="header-content">
                <h2>Design System</h2>
                <p>Visualizing your project architecture</p>
            </div>
            <div class="indicator">
                <div class="pulse"></div>
                Connected
            </div>
        </div>
        <div id="content"></div>
    </main>

    <script>
        let ir = null;
        let selectedId = 'overview';

        async function refresh() {
            try {
                const res = await fetch('/api/ir');
                ir = await res.json();
                renderNav();
                if (selectedId === 'overview') renderOverview();
            } catch (e) {
                console.error("Failed to fetch IR", e);
            }
        }

        function renderNav() {
            const container = document.getElementById('nav-apps');
            container.innerHTML = '';
            ir.apps.forEach(app => {
                const section = document.createElement('div');
                section.className = 'nav-section';
                section.innerHTML = \`<div class="nav-label">\${app.name}</div>\`;
                
                app.entities?.forEach(ent => {
                    const item = document.createElement('div');
                    item.className = 'nav-item';
                    item.innerHTML = '<span>📦</span> ' + ent.name;
                    item.onclick = (event) => { selectItem(ent.name, event); renderEntity(ent); };
                    section.appendChild(item);
                });

                app.pages?.forEach(page => {
                    const item = document.createElement('div');
                    item.className = 'nav-item';
                    item.innerHTML = '<span>📄</span> ' + page.name;
                    item.onclick = (event) => { selectItem(page.name, event); renderPage(page); };
                    section.appendChild(item);
                });
                container.appendChild(section);
            });
        }

        function selectItem(name, event) {
            selectedId = name;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            event.currentTarget.classList.add('active');
        }

        function renderOverview() {
            document.getElementById('header-content').innerHTML = '<h2>Project Overview</h2><p>Summary of discovered resources</p>';
            let totalEntities = 0;
            let totalPages = 0;
            ir.apps.forEach(a => { totalEntities += (a.entities?.length || 0); totalPages += (a.pages?.length || 0); });

            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">\${ir.apps.length}</div>
                        <div class="stat-label">Applications</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${totalEntities}</div>
                        <div class="stat-label">Data Entities</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${totalPages}</div>
                        <div class="stat-label">UI Pages</div>
                    </div>
                </div>
                <div class="card">
                    <h3>Metadata</h3>
                    <table class="mono">
                        \${Object.entries(ir.apps[0]?.meta || {}).map(([k,v]) => \`
                            <tr>
                                <td style="color: var(--accent)">\${k}</td>
                                <td>\${JSON.stringify(v)}</td>
                            </tr>
                        \`).join('')}
                    </table>
                </div>
            \`;
        }

        function renderEntity(ent) {
            document.getElementById('header-content').innerHTML = \`<h2>\${ent.name}</h2><p>Entity Model & API Operations</p>\`;
            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="grid">
                    <div class="card">
                        <h3>Definition</h3>
                        <table>
                            <thead><tr><th>Field</th><th>Type</th></tr></thead>
                            <tbody>
                                \${Object.entries(ent.model || {}).map(([k,v]) => \`
                                    <tr>
                                        <td><strong>\${k}</strong></td>
                                        <td class="mono" style="color: var(--accent)">\${v}</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="card">
                        <h3>Target Operations</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px">
                            \${ent.operations.map(op => \`<span class="badge">\${op.kind.toUpperCase()}: \${op.name}</span>\`).join('')}
                        </div>
                    </div>
                </div>
            \`;
        }

        function renderPage(page) {
            document.getElementById('header-content').innerHTML = \`<h2>\${page.name}</h2><p>Route: <span class="mono">\${page.path}</span></p>\`;
            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="card">
                    <h3>Component Tree</h3>
                    <div class="grid">
                        \${page.components.map(comp => \`
                            <div class="stat-card" style="background: rgba(255,255,255,0.02)">
                                <div style="display: flex; justify-content: space-between; align-items: center">
                                    <strong>\${comp.name}</strong>
                                    \${comp.entityRef ? '<span class="badge">Bound</span>' : ''}
                                </div>
                                \${comp.entityRef ? \`<div class="stat-label">Entity: \${comp.entityRef}</div>\` : ''}
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
        }

        refresh();
        setInterval(refresh, 5000);
    </script>
</body>
</html>
  `;
}
