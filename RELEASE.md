# HoloScript Release Guide

This guide explains how to publish new versions of HoloScript packages to NPM.

## Prerequisites

- `NPM_TOKEN` secret configured in GitHub (Settings → Secrets → NPM_TOKEN)
- Node.js 18+ and pnpm installed locally
- Git push access to repository

## Release Process

### 1. Version Bumping

Use the version management scripts to bump versions:

```bash
# For patch releases (1.0.0 → 1.0.1)
pnpm version:patch

# For minor releases (1.0.0 → 1.1.0)
pnpm version:minor

# For major releases (1.0.0 → 2.0.0)
pnpm version:major

# For pre-releases (1.0.0 → 1.0.1-alpha.1)
pnpm version:prerelease
```

These commands will:
- Update all package.json files
- Create CHANGELOG entry
- Commit changes
- Create git tag

### 2. Push and Publish

```bash
# Push commits and tags to GitHub
git push origin master --tags

# The GitHub Actions workflow will:
# 1. Run tests
# 2. Build packages
# 3. Publish to NPM
# 4. Create release notes
```

### 3. Manual Publishing (if needed)

```bash
# Build all packages
pnpm build

# Publish to NPM (requires npm login)
pnpm publish
```

## Semantic Versioning

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New backwards-compatible features
- **PATCH** (0.0.1): Backwards-compatible bug fixes
- **PRERELEASE** (1.0.0-alpha.1): Pre-release versions

## Package Information

HoloScript publishes 3 packages to NPM:

### @holoscript/core

Core language runtime, parser, type checker, and traits.

- Web Speech API integration (VoiceInputTrait)
- AI-driven NPC behaviors (AIDriverTrait)
- Type inference and checking
- AST-based execution

### @holoscript/cli

Command-line interface and REPL.

- `holoscript parse` - Parse code and show AST
- `holoscript run` - Execute HoloScript files
- `holoscript repl` - Interactive mode

### @holoscript/uaa2-client

Integration with uaa2-service for agent-based orchestration.

## Troubleshooting

### NPM_TOKEN not found

1. Generate token at https://www.npmjs.com/settings/tokens
2. Add to GitHub: Settings → Secrets → NPM_TOKEN
3. Ensure token has "Automation" scope

### Publish fails due to existing version

The version already exists on NPM. Update version using:
```bash
pnpm version:patch  # or minor/major
```

### Tests fail in CI

Run tests locally first:
```bash
pnpm test
```

Check for issues and commit fixes before pushing tags.

## Release Checklist

- [ ] All tests passing: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] Version bumped: `pnpm version:patch` (or minor/major)
- [ ] CHANGELOG updated with changes
- [ ] Committed and tagged: `git push origin master --tags`
- [ ] NPM packages published (automated via GitHub Actions)
- [ ] Release notes created on GitHub

## Support

For issues with publishing:
1. Check GitHub Actions logs
2. Verify NPM token is valid
3. Ensure all packages build locally: `pnpm build`
4. Run full test suite: `pnpm test`
