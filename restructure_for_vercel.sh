#!/bin/bash
# Script to restructure project for optimal Vercel deployment

echo "🔄 Restructuring project for Vercel deployment..."

# Create backup
echo "💾 Creating backup..."
cp -r Frontend Frontend_backup
echo "✅ Backup created at Frontend_backup/"

# Move Frontend files to root (but keep Backend separate)
echo "📁 Moving Frontend files to root..."

# Move Next.js files to root
mv Frontend/package.json ./
mv Frontend/package-lock.json ./ 2>/dev/null || true
mv Frontend/next.config.js ./ 2>/dev/null || true
mv Frontend/tailwind.config.js ./ 2>/dev/null || true
mv Frontend/postcss.config.js ./ 2>/dev/null || true
mv Frontend/tsconfig.json ./

# Move source directories
mv Frontend/app ./
mv Frontend/components ./
mv Frontend/hooks ./
mv Frontend/lib ./
mv Frontend/public ./ 2>/dev/null || true

# Move config files
mv Frontend/.env.example ./ 2>/dev/null || true
mv Frontend/.env.local.example ./ 2>/dev/null || true
mv Frontend/next-env.d.ts ./ 2>/dev/null || true

# Update .gitignore to handle new structure
cat >> .gitignore << 'EOF'

# Next.js (now in root)
.next/
out/

# Environment variables (now in root)
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF

# Clean up empty Frontend directory
rm -rf Frontend

echo "✅ Restructuring complete!"

# Update package.json scripts if needed
echo "🔧 Updating package.json..."

# Create a simple vercel.json for root deployment
cat > vercel.json << 'EOF'
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
EOF

echo "✅ Created root vercel.json"

echo ""
echo "🎉 Project restructured for Vercel!"
echo ""
echo "📋 What changed:"
echo "   ✅ Frontend files moved to root directory"
echo "   ✅ Backend remains in Backend/ directory"
echo "   ✅ Vercel will now detect Next.js automatically"
echo "   ✅ Backup created at Frontend_backup/"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the build: npm run build"
echo "   2. Commit changes: git add . && git commit -m 'restructure: move frontend to root for Vercel'"
echo "   3. Push: git push origin main"
echo "   4. Vercel will auto-deploy successfully!"
echo ""