# Contributing to Agora

Thank you for considering contributing to Agora! This guide will help you get started.

## Code of Conduct

Be respectful and constructive. We're all here to improve civic transparency.

## How to Contribute

### Reporting Bugs

If you find a bug:

1. Check if it's already reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, etc.)

### Suggesting Features

Have an idea? Great! Please:

1. Check if it's already suggested
2. Create an issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach

### Pull Requests

1. **Fork the repository**

2. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Write clear, commented code
   - Follow existing code style
   - Add/update tests if applicable
   - Update documentation

4. **Test your changes**:
   ```bash
   npm run lint
   npm run build
   ```

5. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add new feature"
   ```
   
   Use conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `style:` formatting
   - `refactor:` code restructuring
   - `test:` adding tests
   - `chore:` maintenance

6. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## Development Setup

See [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed setup instructions.

Quick start:
```bash
npm install
cd packages/shared && npm run build
cd ../apps/api && npm run dev
```

## Project Structure

```
Agora/
├── packages/
│   └── shared/          # Shared types and utilities
├── apps/
│   ├── api/             # Serverless API
│   ├── ingestion/       # Data ingestion
│   ├── web/             # Next.js web app
│   └── mobile/          # Expo mobile app
├── database/            # Database schema
└── docs/                # Documentation
```

## Coding Guidelines

### TypeScript

- Use strict mode
- Define types for everything
- No `any` types
- Use interfaces for objects

### React/React Native

- Use functional components
- Use hooks appropriately
- Keep components small and focused
- Extract reusable logic

### CSS

- Use CSS Modules (web)
- Follow BEM naming where applicable
- Use design tokens (CSS variables)
- Mobile-first responsive design

### API

- Follow REST conventions
- Use proper HTTP status codes
- Include error messages
- Document in API_DOCUMENTATION.md

## Testing

Currently no automated tests. Contributions welcome!

When testing manually:
- Test on multiple browsers (web)
- Test on iOS and Android (mobile)
- Test error cases
- Test with slow network
- Test with empty data

## Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying architecture
- Adding dependencies

## Questions?

Open an issue or discussion. We're happy to help!

## Recognition

Contributors will be recognized in the project README.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
