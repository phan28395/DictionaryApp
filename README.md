# Lightning Dictionary ⚡

A lightning-fast desktop dictionary application with <50ms response time, built with React, TypeScript, and Tauri.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## 🚀 Features

### Core Features (v2.0)
- **⚡ Lightning Fast** - <50ms response time for instant word lookups
- **📚 Multi-Definition Display** - View all meanings grouped by part of speech
- **🔗 Cross-Reference Navigation** - Click any word in definitions to explore
- **🔍 Smart Search** - Fuzzy matching with typo correction and suggestions
- **👤 User Accounts** - Optional cloud sync for preferences and history
- **📜 Word History** - Track and search your lookup history
- **🎯 Pattern Prefetching** - >80% cache hit rate with intelligent prediction
- **🌐 100+ Concurrent Users** - Robust backend architecture

### Coming Soon (Phase 3)
- 🌍 10+ language translations
- 📖 Wikipedia integration
- 🔄 Real-time sync
- 🎓 Language learning tools

## 📦 Installation

### Download Latest Release

| Platform | Download |
|----------|----------|
| Windows | [LightningDictionary-2.0.0-setup.exe](releases) |
| macOS | [LightningDictionary-2.0.0.dmg](releases) |
| Linux | [LightningDictionary-2.0.0.AppImage](releases) |

### Build from Source

#### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+
- Platform-specific build tools

#### Steps
```bash
# Clone the repository
git clone https://github.com/yourusername/DictionaryApp.git
cd DictionaryApp

# Install dependencies
cd lightning-dictionary
npm install

# Start the API server
cd api
npm install
npm run dev

# In another terminal, run the desktop app
cd ..
npm run tauri dev

# Build for production
npm run tauri build
```

## 🎮 Usage

### Quick Start
1. Launch Lightning Dictionary
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to activate
3. Select any word in any application
4. See instant definition popup

### Keyboard Shortcuts
- `Ctrl+Shift+D` - Show/hide popup
- `Ctrl+K` - Focus search
- `Alt+←/→` - Navigate back/forward
- `E/C` - Expand/collapse all definitions
- `Escape` - Close popup

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Desktop**: Tauri 2.0 (Rust)
- **Backend**: Node.js, Fastify, SQLite
- **Caching**: LRU + Redis (optional)
- **Auth**: JWT + bcrypt

### Performance Metrics
- Response time: <50ms
- Cache hit rate: >80%
- Memory usage: ~120MB
- Startup time: <2s

## 📚 Documentation

- [User Guide](docs/USER_GUIDE_v2.md) - Complete feature documentation
- [API Documentation](docs/API.md) - REST API reference
- [Phase 2 Features](docs/PHASE_2_FEATURES.md) - Detailed feature list
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🛠️ Development

### Project Structure
```
DictionaryApp/
├── lightning-dictionary/     # Desktop application
│   ├── src/                 # React frontend
│   ├── src-tauri/          # Rust backend
│   └── api/                # REST API server
├── data/                   # Dictionary data processing
├── docs/                   # Documentation
└── scripts/               # Build and utility scripts
```

### Running Tests
```bash
# Frontend tests
npm test

# API tests
cd api && npm test

# E2E tests
npm run test:e2e
```

### Development Workflow
1. Create feature branch from `main`
2. Follow commit convention: `feat(scope): description`
3. Ensure tests pass and coverage >75%
4. Submit PR with description

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- 🌍 Language translations
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📚 Documentation
- ⚡ Performance optimizations

## 📈 Roadmap

### Phase 2 ✅ (Completed)
- Multi-definitions, cross-references
- User accounts and preferences
- Smart search and suggestions
- Performance optimization

### Phase 3 🚧 (In Progress)
- Multi-language support
- Wikipedia integration
- Advanced caching
- Sync service

### Phase 4 📅 (Planned)
- Plugin architecture
- Premium features
- Analytics dashboard
- Mobile apps

### Phase 5+ 🔮 (Future)
- AI-powered features
- Community platform
- Educational tools
- API marketplace

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dictionary data from [source]
- Icons by [Tabler Icons](https://tabler-icons.io)
- Built with [Tauri](https://tauri.app)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/DictionaryApp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/DictionaryApp/discussions)
- **Email**: support@lightning-dictionary.com

---

Made with ⚡ by the Lightning Dictionary Team