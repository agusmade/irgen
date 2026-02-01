
import { spawn } from "node:child_process";
import http from "node:http";

async function test() {
    console.log("Running smoke test for 'irgen studio'...");

    const studio = spawn("npx", ["tsx", "src/cli.ts", "studio", "examples/app.dsl.ts"], {
        cwd: process.cwd(),
        stdio: "pipe",
        env: { ...process.env, OPEN_BROWSER: "false" } // We might need to handle the 'open' call
    });

    let failures = 0;

    // Give it some time to start
    await new Promise(r => setTimeout(r, 5000));

    try {
        const data = await new Promise((resolve, reject) => {
            http.get("http://localhost:3000/api/ir", (res) => {
                let body = "";
                res.on("data", chunk => body += chunk);
                res.on("end", () => resolve(JSON.parse(body)));
            }).on("error", reject);
        }) as any;

        if (data.apps && data.apps.length > 0 && data.apps[0].name === "DemoApp") {
            console.log("PASS: Studio API returned correct IR");
        } else {
            console.error("FAIL: Studio API returned unexpected data", data);
            failures++;
        }
    } catch (err: any) {
        console.error("FAIL: Could not connect to Studio API", err.message);
        failures++;
    } finally {
        studio.kill();
    }

    if (failures > 0) {
        process.exit(1);
    }
    console.log("Studio smoke test passed.");
    process.exit(0);
}

test();
