# Contributing to Dommarjävel

Thank you for your interest in contributing to Dommarjävel! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/dommarjavel.git
   cd dommarjavel
   ```
3. **Set up the development environment**:
   ```bash
   ./setup.sh
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Guidelines

### Code Style

#### Backend (Python)
- Follow PEP 8 style guidelines
- Use type hints for all function parameters and return values
- Write docstrings for all public functions and classes
- Use meaningful variable and function names
- Keep functions focused and small

#### Frontend (TypeScript)
- Use TypeScript strict mode
- Follow React best practices and hooks patterns
- Use meaningful component and variable names
- Prefer functional components over class components
- Use proper TypeScript types instead of `any`

### Code Quality

#### Backend
```bash
# Lint code
cd Backend
flake8 app/

# Type checking
mypy app/ --ignore-missing-imports

# Format code (optional)
black app/
```

#### Frontend
```bash
# Lint code
cd Frontend
npm run lint

# Type checking
npm run type-check

# Fix linting issues
npm run lint:fix
```

### Testing

#### Backend
- Write tests for new API endpoints
- Test error handling and edge cases
- Ensure data validation works correctly

#### Frontend
- Test component rendering
- Test user interactions
- Ensure responsive design works

### Documentation

- Update README.md if adding new features
- Add docstrings to new functions
- Update API documentation for new endpoints
- Include examples in documentation

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(api): add referee statistics endpoint
fix(frontend): resolve pagination bug on mobile
docs(readme): update installation instructions
refactor(backend): optimize match filtering logic
```

## 🔄 Pull Request Process

1. **Ensure your code follows the style guidelines**
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Ensure all tests pass**:
   ```bash
   # Backend
   cd Backend && python -m pytest
   
   # Frontend
   cd Frontend && npm run lint && npm run type-check
   ```
5. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - List of changes made

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the bug
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details**:
   - OS and version
   - Browser and version (for frontend issues)
   - Python version (for backend issues)
6. **Screenshots or logs** if applicable

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Python: [e.g., 3.13.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

For feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Provide examples** if possible
5. **Consider implementation** complexity

## 🏗️ Architecture Guidelines

### Backend Structure
```
Backend/
├── app/
│   ├── main.py          # FastAPI app and routes
│   └── chunks_api.py    # Optimized chunk endpoints
├── data/                # JSON data storage
├── scripts/             # Data management scripts
│   ├── lib/            # Reusable script modules
│   └── *.py            # Main scripts
└── requirements.txt     # Python dependencies
```

### Frontend Structure
```
Frontend/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── public/             # Static assets
```

### Data Flow
```
External APIs → Scripts → JSON Storage → Chunks → API → Frontend
```

## 🔒 Security

- **Never commit sensitive data** (API keys, passwords, personal data)
- **Use environment variables** for configuration
- **Validate all inputs** on both frontend and backend
- **Follow security best practices** for web applications
- **Report security issues** privately to maintainers

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: Ask for feedback on complex changes

## 🎉 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- GitHub contributor statistics

Thank you for contributing to Dommarjävel! 🏈