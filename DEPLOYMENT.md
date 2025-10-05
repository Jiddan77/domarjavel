# Deployment Guide

This guide covers different deployment options for the Dommarjävel application.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended for Frontend + API)

Vercel provides seamless deployment for Next.js applications with API routes.

#### Setup
1. **Connect to Vercel**:
   ```bash
   cd Frontend
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   ```
   DATA_DIR=../Backend/data
   API_CORS_ORIGINS=https://yourdomain.vercel.app
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/ .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY Frontend/package*.json ./
RUN npm ci --only=production

COPY Frontend/ .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: Backend/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./Backend/data:/app/data
    environment:
      - API_CORS_ORIGINS=http://localhost:3000

  frontend:
    build:
      context: .
      dockerfile: Frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

### Option 3: Traditional VPS/Server

#### Backend Setup
```bash
# Install Python and dependencies
sudo apt update
sudo apt install python3.13 python3-pip nginx

# Setup application
git clone https://github.com/yourusername/dommarjavel.git
cd dommarjavel/Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Setup systemd service
sudo cp deployment/dommarjavel-api.service /etc/systemd/system/
sudo systemctl enable dommarjavel-api
sudo systemctl start dommarjavel-api
```

#### Frontend Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build and setup
cd ../Frontend
npm install
npm run build

# Setup with PM2
npm install -g pm2
pm2 start npm --name "dommarjavel-frontend" -- start
pm2 startup
pm2 save
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# API Configuration
API_CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
DATA_DIR=./data

# Optional: Database URL for future PostgreSQL migration
# DATABASE_URL=postgresql://user:password@localhost/dommarjavel
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/dommarjavel
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Performance Optimization

### Backend Optimizations
- **Enable gzip compression** in reverse proxy
- **Use Redis caching** for frequently accessed data
- **Implement rate limiting** to prevent abuse
- **Monitor with APM tools** (e.g., Sentry, DataDog)

### Frontend Optimizations
- **Enable Next.js Image Optimization**
- **Use CDN** for static assets
- **Implement service worker** for offline support
- **Monitor Core Web Vitals**

### Database Considerations
For production with large datasets, consider migrating to PostgreSQL:

```python
# Future migration example
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

## 🔒 Security Checklist

### Backend Security
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Regular dependency updates

### Frontend Security
- [ ] Sanitize user inputs
- [ ] Use Content Security Policy (CSP)
- [ ] Implement proper authentication (if needed)
- [ ] Secure API endpoints
- [ ] Regular dependency updates

## 📈 Monitoring and Logging

### Application Monitoring
```python
# Backend logging setup
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI()

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
    return response
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
```

## 🔄 CI/CD Pipeline

The project includes GitHub Actions for:
- **Automated testing** on push/PR
- **Code quality checks** (linting, type checking)
- **Security scanning** with Trivy
- **Integration testing**

### Manual Deployment Steps
1. **Test locally**: Ensure all tests pass
2. **Update version**: Bump version numbers
3. **Create release**: Tag and create GitHub release
4. **Deploy**: Use chosen deployment method
5. **Verify**: Check health endpoints and functionality

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues
- **Port conflicts**: Change port in uvicorn command
- **Permission errors**: Check file permissions for data directory
- **Import errors**: Ensure virtual environment is activated

#### Frontend Issues
- **Build failures**: Check Node.js version compatibility
- **API connection**: Verify NEXT_PUBLIC_API_URL is correct
- **Static files**: Ensure proper nginx configuration

#### Data Issues
- **Missing data**: Run data update scripts
- **Chunk errors**: Rebuild chunks with optimization script
- **Performance**: Check if chunks are being served correctly

### Logs and Debugging
```bash
# Backend logs
tail -f /var/log/dommarjavel-api.log

# Frontend logs (PM2)
pm2 logs dommarjavel-frontend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review GitHub Issues for similar problems
3. Create a new issue with deployment details
4. Include logs and error messages

---

**Happy deploying! 🚀**