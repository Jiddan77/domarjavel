# 🏈 Dommarjävel

A comprehensive Swedish football referee statistics application that tracks and analyzes referee performance data from Allsvenskan matches.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.13+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)

## ✨ Features

- **📊 Comprehensive Statistics**: Detailed referee performance metrics, cards issued, and match outcomes
- **🏟️ Match Database**: Complete database of Swedish football matches with referee assignments
- **👥 Team Analysis**: Team-specific statistics and referee interaction patterns
- **📱 Responsive Design**: Modern web interface optimized for desktop and mobile
- **⚡ High Performance**: Optimized data chunks for instant loading of common queries
- **🔄 Auto-Updates**: Automated data fetching and backfill system
- **📈 Real-time Insights**: Up-to-date match information and live statistics

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dommarjavel.git
   cd dommarjavel
   ```

2. **Run the automated setup**
   ```bash
   ./setup.sh
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Backend API
   cd Backend
   source .venv/bin/activate
   python run.py

   # Terminal 2 - Frontend
   cd Frontend
   npm run dev
   ```

4. **Access the application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **API**: http://localhost:8000
   - 📚 **API Docs**: http://localhost:8000/docs

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **FastAPI**: Modern, fast web framework with automatic API documentation
- **Hybrid Data System**: JSON database with optimized chunks for performance
- **Automated Updates**: Scripts for fetching and backfilling match data
- **Type Safety**: Full Pydantic validation and type hints

### Frontend (Next.js + TypeScript)
- **Next.js 14**: React framework with App Router and server components
- **TypeScript**: Complete type safety across the application
- **Tailwind CSS**: Utility-first styling with responsive design
- **SWR**: Smart data fetching with caching and error handling

### Data Pipeline
```
External APIs → Data Fetching → Validation → JSON Storage → Optimized Chunks → Fast API Responses
```

## 📊 Performance Optimizations

- **Pre-computed Chunks**: Common queries served instantly (5-10x faster)
- **Smart Caching**: SWR handles client-side caching and revalidation
- **Efficient Filtering**: Backend handles complex multi-filter scenarios
- **Pagination**: Large datasets handled efficiently
- **Responsive Loading**: Progressive loading with skeleton states

## 🔧 Data Management

### Updating Match Data
```bash
# Quick update with automatic backfill
bash Backend/scripts/update_matches.sh

# Check current data status
python3 Backend/scripts/check_status.py

# Dry run to see what would be updated
bash Backend/scripts/update_matches.sh --dry-run
```

### Manual Data Operations
```bash
# Backfill specific data types
python3 Backend/scripts/lib/backfill_referees_2025.py
python3 Backend/scripts/lib/backfill_penalties_2025.py
python3 Backend/scripts/lib/backfill_cards_2025.py

# Rebuild performance chunks
python3 Backend/scripts/lib/create_optimized_chunks.py --season 2025
```

## 📚 Documentation

- **[Development Guide](DEVELOPMENT.md)**: Detailed development setup and workflows
- **[Update Workflow](Backend/UPDATE_WORKFLOW.md)**: Data update and maintenance procedures
- **[Chunks System](Backend/CHUNKS_SYSTEM.md)**: Performance optimization architecture
- **[API Documentation](http://localhost:8000/docs)**: Interactive API reference (when running)

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend API** | FastAPI + Python 3.13 | High-performance API with automatic docs |
| **Frontend** | Next.js 14 + TypeScript | Modern React framework with type safety |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Data Fetching** | SWR | Smart caching and error handling |
| **Database** | JSON + Chunks | Lightweight with performance optimization |
| **Validation** | Pydantic | Runtime type checking and validation |

## 📈 API Endpoints

### Core Endpoints
- `GET /matches` - Retrieve matches with filtering and pagination
- `GET /seasons` - Available seasons with match counts
- `GET /referees` - Referee list with statistics
- `GET /teams` - Team information and match counts
- `GET /stats` - Comprehensive statistics for filtered data
- `GET /leaderboard` - Referee performance rankings

### Performance Endpoints (Chunks)
- `GET /api/chunks/season/{season}/stats` - Instant season statistics
- `GET /api/chunks/season/{season}/team/{team}` - Pre-computed team matches
- `GET /api/chunks/season/{season}/referee/{referee}` - Referee match history
- `GET /api/chunks/health` - System health monitoring

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Follow the code style** (TypeScript/Python standards)
5. **Submit a pull request** with a clear description

### Development Guidelines
- Write type-safe code (TypeScript + Python type hints)
- Add tests for new features
- Update documentation as needed
- Follow existing code patterns and conventions

## 📊 Project Status

- ✅ **Core Features**: Complete match database and statistics
- ✅ **Performance**: Optimized chunks system implemented
- ✅ **Automation**: Automated data updates and backfill
- ✅ **Documentation**: Comprehensive guides and API docs
- 🔄 **Active Development**: Regular updates and improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Swedish Football Association for match data
- Allsvenskan.se for referee information
- Open source community for excellent tools and libraries

---

**Built with ❤️ for Swedish football fans and data enthusiasts**