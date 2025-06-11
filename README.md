# Kanban Board - Deployment Guide

A real-time collaborative Kanban board application with automated CI/CD pipeline.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Local Development

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd kanban-board
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Start development environment**
   ```bash
   # Using the deployment script
   ./deploy.sh dev
   
   # Or manually
   docker-compose up -d --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB Express: http://localhost:8081 (with tools profile)
   - Redis Commander: http://localhost:8082 (with tools profile)

4. **Start with database tools**
   ```bash
   docker-compose --profile tools up -d
   ```

## 🏗️ Production Deployment

### Server Setup

1. **Server requirements**
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker & Docker Compose installed
   - Minimum 2GB RAM, 20GB storage
   - Domain name (optional but recommended)

2. **Initial server setup**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker-compose/docker-compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Create deployment directory
   mkdir -p ~/kanban
   cd ~/kanban
   ```

### GitHub Actions Deployment

1. **Setup GitHub secrets**
   ```
   DOCKER_USERNAME          # Docker Hub username
   DOCKER_PASSWORD          # Docker Hub password/token
   SSH_PRIVATE_KEY          # Private key for server access
   SERVER_HOST              # Server IP or domain
   SERVER_USER              # Server username
   MONGODB_URI              # MongoDB connection string
   JWT_SECRET               # JWT signing secret
   REDIS_URL                # Redis connection string
   RESEND_API_KEY           # Email service API key
   FRONTEND_URL             # Frontend domain
   BACKEND_URL              # Backend domain
   ```

2. **Deploy**
   - Push to `main` branch for automatic deployment
   - Or use manual workflow dispatch in GitHub Actions

### Manual Deployment

1. **Prepare environment**
   ```bash
   # Copy files to server
   scp docker-compose.production.yml user@server:~/kanban/
   scp nginx.conf user@server:~/kanban/
   scp mongo-init.js user@server:~/kanban/
   scp .env.example user@server:~/kanban/
   
   # SSH to server
   ssh user@server
   cd ~/kanban
   
   # Setup environment
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy using script**
   ```bash
   # Make script executable
   chmod +x deploy.sh
   
   # Deploy
   ./deploy.sh deploy production
   ```

3. **Or deploy manually**
   ```bash
   # Pull images
   docker-compose -f docker-compose.production.yml pull
   
   # Start services
   docker-compose -f docker-compose.production.yml up -d
   
   # Check status
   docker-compose -f docker-compose.production.yml ps
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Application environment | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `RESEND_API_KEY` | Email service API key | Yes |
| `FRONTEND_URL` | Frontend domain URL | Yes |
| `BACKEND_URL` | Backend domain URL | Yes |

### SSL/HTTPS Setup

1. **Using Let's Encrypt with Certbot**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d your-domain.com
   
   # Update nginx configuration
   # Uncomment HTTPS server block in nginx.conf
   ```

2. **Using custom certificates**
   - Place certificates in `./ssl/` directory
   - Update `docker-compose.production.yml` to mount certificates
   - Enable HTTPS server block in `nginx.conf`

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check service status
./deploy.sh status

# View logs
./deploy.sh logs
./deploy.sh logs backend
./deploy.sh logs frontend

# Health check endpoints
curl http://your-domain/health
curl http://your-domain/api/health
```

### Database Management

```bash
# Create backup
./deploy.sh backup

# Restore from backup
./deploy.sh restore /path/to/backup.gz

# Access MongoDB shell
docker exec -it kanban-mongodb mongosh
```

### Updates and Rollbacks

```bash
# Update to latest
git pull origin main
./deploy.sh deploy production

# Rollback (automatic in GitHub Actions on failure)
# Or manually revert to previous commit and redeploy
```

## 🛠️ Development

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│   (React/Vite)  │    │   (Node.js)     │    │   (MongoDB)     │
│                 │───▶│                 │───▶│                 │
│   Nginx/Docker  │    │   Express/      │    │   Redis         │
│                 │    │   Socket.io     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Local Development Setup

```bash
# Backend
cd backend
pnpm install
pnpm run dev

# Frontend
cd frontend
pnpm install
pnpm run dev
```

### Running Tests

```bash
# Backend tests (when enabled)
cd backend && pnpm test

# Frontend tests (when enabled)
cd frontend && pnpm test
```

## 🔐 Security

### Production Security Checklist

- [ ] Use strong passwords for all services
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall to only allow necessary ports
- [ ] Regular security updates for the server
- [ ] Use environment variables for all secrets
- [ ] Enable database authentication
- [ ] Configure rate limiting in nginx
- [ ] Regular backups with secure storage
- [ ] Monitor logs for suspicious activity

### Recommended Firewall Settings

```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🆘 Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check logs
   docker-compose logs
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

2. **Database connection issues**
   ```bash
   # Verify MongoDB is running
   docker exec kanban-mongodb mongosh --eval "db.adminCommand('ping')"
   
   # Check network connectivity
   docker network ls
   docker network inspect kanban_kanban-network
   ```

3. **Frontend not loading**
   ```bash
   # Check nginx configuration
   docker exec kanban-frontend nginx -t
   
   # Check backend connectivity
   curl http://backend:5000/health
   ```

### Performance Optimization

1. **Resource limits**
   ```yaml
   # Add to docker-compose.production.yml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

2. **Nginx caching**
   - Static assets are cached for 1 year
   - API responses can be cached based on needs
   - Enable gzip compression

## 📝 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the logs for error messages
