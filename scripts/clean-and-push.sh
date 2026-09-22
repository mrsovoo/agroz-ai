#!/usr/bin/env bash
set -e

# Clean frontend
echo "Cleaning frontend..."
cd frontend && npm run clean && cd ..

# Clean admin panel
echo "Cleaning admin..."
cd admin && npm run clean && cd ..

# Clean backend
echo "Cleaning backend..."
cd backend && npm run clean && cd ..

# Optional: reset database (uncomment if needed)
# echo "Resetting database..."
# cd backend && npm run db:clear -- --yes && npm run db:seed && cd ..

# Git add, commit and push
echo "Committing and pushing to GitHub..."
git add .
# Use a generic commit message; adjust as needed
git commit -m "chore: clean project artifacts and prepare for fresh deployment"
# Ensure remote is set; push to main
git push origin main

echo "All done!"

