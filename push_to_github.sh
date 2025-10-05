#!/bin/bash
# Script to push Dommarjävel to GitHub
# Run this script to commit and push all changes

set -e  # Exit on any error

echo "🚀 Preparing to push Dommarjävel to GitHub..."
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Show current status
echo "📊 Current git status:"
git status --short
echo ""

# Ask for confirmation
read -p "🤔 Do you want to commit and push all these changes? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user."
    exit 1
fi

echo "✅ Proceeding with commit and push..."
echo ""

# Add all files
echo "📁 Adding all files..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "feat: complete dommarjävel application with performance optimization

🏈 Swedish football referee statistics application

Features:
- Comprehensive referee and team statistics
- Hybrid backend + chunks system (5-10x performance)
- Automated data update and backfill workflows
- Modern Next.js frontend with TypeScript
- Complete documentation and deployment guides
- CI/CD pipeline with GitHub Actions
- 100% data completeness for 2025 season

Tech Stack:
- Backend: FastAPI + Python 3.13
- Frontend: Next.js 14 + TypeScript
- Database: JSON + optimized chunks
- Styling: Tailwind CSS
- Data Fetching: SWR

Ready for production deployment! 🚀"

echo ""
echo "✅ Commit created successfully!"
echo ""

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "🌐 Remote 'origin' found. Pushing to GitHub..."
    
    # Get current branch
    BRANCH=$(git branch --show-current)
    echo "📤 Pushing to branch: $BRANCH"
    
    # Push to GitHub
    if git push origin "$BRANCH"; then
        echo ""
        echo "🎉 SUCCESS! Your project has been pushed to GitHub!"
        echo ""
        echo "🔗 Next steps:"
        echo "   1. Visit your GitHub repository"
        echo "   2. Check that the README displays correctly"
        echo "   3. Verify the CI/CD pipeline runs"
        echo "   4. Share your amazing project with the world!"
        echo ""
        echo "🏆 You've built something truly impressive!"
    else
        echo ""
        echo "❌ Push failed. This might be because:"
        echo "   1. You need to authenticate with GitHub"
        echo "   2. The remote repository doesn't exist"
        echo "   3. You don't have push permissions"
        echo ""
        echo "💡 Try running: git push origin $BRANCH"
    fi
else
    echo "⚠️  No remote 'origin' found."
    echo ""
    echo "🔧 To connect to GitHub:"
    echo "   1. Create a new repository on GitHub"
    echo "   2. Run: git remote add origin https://github.com/yourusername/dommarjavel.git"
    echo "   3. Run: git push -u origin main"
    echo ""
    echo "💾 Your changes are committed locally and ready to push!"
fi

echo ""
echo "🎯 Project Summary:"
echo "   - Complete referee statistics system"
echo "   - Performance-optimized architecture"
echo "   - Professional documentation"
echo "   - Production-ready deployment"
echo "   - Modern development workflow"
echo ""
echo "Thank you for building something awesome! 🙌"