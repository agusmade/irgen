# Contributing to irgen

Thanks for helping improve irgen. This repo is a generator and the output is tested via golden tests, so please read this before contributing.

## Development setup
```bash
npm install
npm run build
```

## Tests
```bash
npm run test:ci
```

## PR guidelines
- Keep changes focused and avoid mixing unrelated refactors.
- Update or add tests when behavior changes.
- If you change emitters or IR shapes, update golden tests or fixtures as needed.

## Documentation
- Keep docs in `docs/` accurate for any public API or policy changes.
- Update `README.md` when you change CLI behavior or examples.
