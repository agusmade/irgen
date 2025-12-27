#!/bin/bash
set -e

# 1. Base App (Backend)
echo "Generating Base App (Backend)..."
npx tsx src/cli.ts examples/app.dsl.ts generated/app --mode=backend

# 2. Backend Only
echo "Generating Backend Only..."
npx tsx src/cli.ts examples/backend-only.dsl.ts generated/backend-only --mode=backend

# 3. Frontend Only
echo "Generating Frontend Only..."
npx tsx src/cli.ts examples/frontend-only.dsl.ts generated/frontend-only --mode=frontend

# 4. Fullstack (Backend + Frontend)
# Note: Using mode=backend for now as combined mode is POC. 
# Real fullstack usage usually involves running backend generation and frontend generation separately or sequentially.
# For this example, we'll generate backend then frontend to the same folder.
echo "Generating Fullstack..."
# Currently fullstack example primarily defines backend entities. 
# Frontend scaffolding from entities is not yet implemented in lowering/frontend.ts.
# Generating backend only for now.
npx tsx src/cli.ts examples/fullstack.dsl.ts generated/fullstack --mode=backend

# 5. Form IO (Rich Frontend)
echo "Generating Form IO (Rich Frontend)..."
npx tsx src/cli.ts examples/form-io.dsl.ts generated/form-io --mode=frontend

echo "All examples generated successfully!"
