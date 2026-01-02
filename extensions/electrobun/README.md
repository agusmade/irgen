# Electrobun Extension (sample)

Integrates an “Electrobun” target without touching core:

- Reuses the frontend mapper to derive IR.
- Adds a target transform that passes through Electrobun-specific policies.
- Registers an emitter that writes `electrobun.config.json` + a stub README.

Usage:
```
npx tsx src/cli.ts --targets=electrobun --ext=extensions/electrobun/index.ts examples/frontend.dsl.ts --outDir=generated/electrobun
```

Programmatic:
```ts
import { Codegen } from "irgen";
import electrobunExt from "./extensions/electrobun/index.js";

const cg = new Codegen({ extensions: [electrobunExt] });
await cg.generate({ entries: ["./my-frontend.dsl.ts"], targets: ["electrobun"], outDir: "generated/electrobun" });
```
