#!/bin/bash

# BeredskapsPlanRevisjon - Automated Deployment Script
# This script automates the entire deployment process

set -e  # Exit on any error

echo "🚀 BeredskapsPlanRevisjon - Automated Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\$input"
    fi
}

# Function to confirm action
confirm_action() {
    local prompt="$1"
    read -p "$prompt (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================
echo "📋 Step 1: Checking Prerequisites"
echo "--------------------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "Git installed: $GIT_VERSION"
else
    print_error "Git not found. Please install Git from https://git-scm.com/"
    exit 1
fi

# Check Supabase CLI
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_success "Supabase CLI installed: $SUPABASE_VERSION"
else
    print_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
    if command_exists supabase; then
        print_success "Supabase CLI installed successfully"
    else
        print_error "Failed to install Supabase CLI"
        exit 1
    fi
fi

echo ""

# ============================================================================
# STEP 2: Gather Configuration
# ============================================================================
echo "⚙️  Step 2: Gathering Configuration"
echo "--------------------------------"

prompt_input "Enter your Supabase Project URL" SUPABASE_URL
prompt_input "Enter your Supabase Anon Key" SUPABASE_ANON_KEY
prompt_input "Enter your Supabase Service Role Key" SUPABASE_SERVICE_ROLE_KEY
prompt_input "Enter your Anthropic API Key" ANTHROPIC_API_KEY
prompt_input "Enter your GitHub username" GITHUB_USERNAME
prompt_input "Enter your project name (for GitHub repo)" PROJECT_NAME "beredskapsplan-revisjon"

echo ""
print_info "Configuration gathered. Proceeding with deployment..."
echo ""

# ============================================================================
# STEP 3: Setup Frontend
# ============================================================================
echo "📦 Step 3: Setting Up Frontend"
echo "----------------------------"

cd frontend

# Install dependencies
print_info "Installing npm dependencies..."
npm install
print_success "Dependencies installed"

# Create .env.local
print_info "Creating .env.local file..."
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
print_success ".env.local created"

cd ..
echo ""

# ============================================================================
# STEP 4: Deploy Edge Functions
# ============================================================================
echo "🔧 Step 4: Deploying Edge Functions"
echo "----------------------------------"

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

print_info "Linking to Supabase project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

print_info "Deploying Edge Functions..."
supabase functions deploy compliance-sync --no-verify-jwt
print_success "Deployed: compliance-sync"

supabase functions deploy pre-revision-sync --no-verify-jwt
print_success "Deployed: pre-revision-sync"

supabase functions deploy analyze-documents --no-verify-jwt
print_success "Deployed: analyze-documents"

supabase functions deploy upload-document --no-verify-jwt
print_success "Deployed: upload-document"

supabase functions deploy cleanup-session --no-verify-jwt
print_success "Deployed: cleanup-session"

echo ""

# ============================================================================
# STEP 5: Setup Git Repository
# ============================================================================
echo "📝 Step 5: Setting Up Git Repository"
echo "-----------------------------------"

cd frontend

if [ ! -d ".git" ]; then
    print_info "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - BeredskapsPlanRevisjon"
    print_success "Git repository initialized"
else
    print_warning "Git repository already exists"
fi

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    print_info "Adding remote origin..."
    git remote add origin https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git
    print_success "Remote origin added"
fi

cd ..
echo ""

# ============================================================================
# STEP 6: Push to GitHub
# ============================================================================
echo "📤 Step 6: Pushing to GitHub"
echo "---------------------------"

cd frontend

print_info "Pushing to GitHub..."
git branch -M main
git push -u origin main || {
    print_error "Failed to push to GitHub. Please ensure:"
    print_error "1. GitHub repository exists at: https://github.com/$GITHUB_USERNAME/$PROJECT_NAME"
    print_error "2. You have proper permissions"
    print_error "3. GitHub credentials are configured"
    print_info "You can create the repository manually at: https://github.com/new"
    exit 1
}

print_success "Code pushed to GitHub"

cd ..
echo ""

# ============================================================================
# STEP 7: Vercel Deployment Instructions
# ============================================================================
echo "🌐 Step 7: Vercel Deployment"
echo "---------------------------"

print_info "To complete deployment to Vercel, follow these steps:"
echo ""
echo "1. Go to https://vercel.com"
echo "2. Sign up/login with GitHub"
echo "3. Click 'Add New Project'"
echo "4. Select '$PROJECT_NAME' repository"
echo "5. Configure:"
echo "   - Framework Preset: Next.js"
echo "   - Root Directory: frontend"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo "6. Add Environment Variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "   - ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
echo "   - NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app"
echo "7. Click 'Deploy'"
echo ""

# ============================================================================
# STEP 8: Test Local Development
# ============================================================================
echo "🧪 Step 8: Testing Local Development"
echo "-----------------------------------"

if confirm_action "Do you want to test the app locally now?"; then
    cd frontend
    print_info "Starting development server..."
    print_info "Open http://localhost:3000 in your browser"
    print_info "Press Ctrl+C to stop"
    echo ""
    npm run dev
fi

# ============================================================================
# STEP 9: Summary
# ============================================================================
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo ""
print_success "✓ Frontend dependencies installed"
print_success "✓ Environment variables configured"
print_success "✓ Edge Functions deployed to Supabase"
print_success "✓ Git repository initialized"
print_success "✓ Code pushed to GitHub"
echo ""
print_info "Next Steps:"
echo "1. Deploy to Vercel (see instructions above)"
echo "2. Test the deployed application"
echo "3. Configure Stripe for payments (optional)"
echo "4. Set up custom domain (optional)"
echo ""
print_info "Important URLs:"
echo "- Supabase Dashboard: https://supabase.com/dashboard"
echo "- GitHub Repository: https://github.com/$GITHUB_USERNAME/$PROJECT_NAME"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo ""
print_info "Documentation:"
echo "- QUICK_START.md - Quick start guide"
echo "- DEPLOYMENT.md - Detailed deployment guide"
echo "- DEPLOYMENT_CHECKLIST.md - Complete checklist"
echo ""
print_success "Automated deployment script completed! 🚀"