# Contributing to Augura

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch

## Branch Naming

- `feature/` - New features (e.g., `feature/add-lmsr-pricing`)
- `fix/` - Bug fixes (e.g., `fix/market-resolution`)
- `docs/` - Documentation (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/storage-keys`)

## Code Style

### Rust (Smart Contract)

- Use `cargo fmt` before committing
- Follow standard Rust conventions
- Add comments for complex logic

### TypeScript/JavaScript (Frontend)

- Use ESLint and Prettier
- Follow existing patterns in the codebase

## Testing

### Smart Contract

```bash
cd contracts/prediction
cargo test
```

### Frontend

```bash
cd frontend
npm run build
```

## Pull Request Checklist

- [ ] Tests pass
- [ ] Code is formatted
- [ ] Documentation updated if needed
- [ ] Commits are descriptive
- [ ] PR description explains the changes

## Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `refactor: restructure code`

## Security

- Never commit secrets or private keys
- Use environment variables for sensitive data
- Follow Stellar security best practices

## Questions?

Open an issue for discussion before starting large changes.