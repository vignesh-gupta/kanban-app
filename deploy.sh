#!/bin/bash

# Kanban Board Deployment Script
# This script helps deploy the Kanban application to a server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands exist
check_dependencies() {
    print_status "Checking dependencies..."
    
    for cmd in docker docker-compose git; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
    
    print_status "All dependencies are installed."
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example"
        cp .env.example .env
        print_warning "Please edit .env file with your actual values before continuing."
        read -p "Press enter to continue after editing .env file..."
    fi
    
    source .env
}

# Build and deploy
deploy() {
    local environment=${1:-production}
    
    print_status "Deploying to $environment environment..."
    
    if [ "$environment" = "production" ]; then
        docker-compose -f docker-compose.production.yml down
        docker-compose -f docker-compose.production.yml pull
        docker-compose -f docker-compose.production.yml up -d
    else
        docker-compose down
        docker-compose up -d --build
    fi
    
    print_status "Waiting for services to start..."
    sleep 30
    
    # Health check
    if [ "$environment" = "production" ]; then
        docker-compose -f docker-compose.production.yml ps
    else
        docker-compose ps
    fi
    
    print_status "Deployment completed!"
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    
    local backup_dir="./backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/kanban_backup_$timestamp.gz"
    
    mkdir -p $backup_dir
    
    docker exec kanban-mongodb mongodump --db kanban --gzip --archive > $backup_file
    
    print_status "Database backup created: $backup_file"
}

# Restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please provide backup file path"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "Restoring database from: $backup_file"
    
    docker exec -i kanban-mongodb mongorestore --db kanban --gzip --archive < $backup_file
    
    print_status "Database restored successfully!"
}

# Show logs
show_logs() {
    local service=${1:-}
    local environment=${2:-development}
    
    if [ "$environment" = "production" ]; then
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.production.yml logs -f $service
        else
            docker-compose -f docker-compose.production.yml logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose logs -f $service
        else
            docker-compose logs -f
        fi
    fi
}

# Cleanup
cleanup() {
    print_status "Cleaning up unused Docker resources..."
    
    docker system prune -f
    docker volume prune -f
    
    print_status "Cleanup completed!"
}

# Main script
case "${1:-}" in
    "deploy")
        check_dependencies
        setup_environment
        deploy ${2:-production}
        ;;
    "dev")
        check_dependencies
        setup_environment
        deploy development
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database $2
        ;;
    "logs")
        show_logs $2 ${3:-development}
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {deploy|dev|backup|restore|logs|cleanup|status}"
        echo ""
        echo "Commands:"
        echo "  deploy [production|staging]  - Deploy to specified environment (default: production)"
        echo "  dev                          - Deploy in development mode"
        echo "  backup                       - Create database backup"
        echo "  restore <backup_file>        - Restore database from backup"
        echo "  logs [service] [env]         - Show logs for service (default: all services)"
        echo "  cleanup                      - Clean up Docker resources"
        echo "  status                       - Show status of services"
        echo ""
        exit 1
        ;;
esac
