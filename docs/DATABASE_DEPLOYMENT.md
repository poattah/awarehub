# 🚀 Automated Database Deployment Guide

This guide explains how to automatically deploy database changes to Supabase without manual copy-pasting.

## 📋 Overview

We use **Supabase CLI** with **migrations** for automated, version-controlled database deployments.

### Benefits:
- ✅ Version control for database schema
- ✅ Automated deployments
- ✅ Rollback capability
- ✅ No manual SQL copy-pasting
- ✅ CI/CD integration
- ✅ Type-safe database access

---

## 🛠️ Setup (One-Time)

### 1. Install Supabase CLI

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase  # macOS
```

### 2. Login to Supabase

```bash
supabase login
```

This will open your browser for authentication.

### 3. Link Your Project

```bash
# Set your project reference (find it in Supabase dashboard URL)
export SUPABASE_PROJECT_REF=your-project-ref

# Link the project
supabase link --project-ref $SUPABASE_PROJECT_REF
```

### 4. Add to .env

```bash
# Add to .env (don't commit this!)
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
```

---

## 📦 Usage

### Option 1: Quick Deploy Script

```bash
# Run the automated deployment script
./scripts/deploy-db.sh
```

This script will:
1. Check if Supabase CLI is installed
2. Verify authentication
3. Show pending migrations
4. Ask for confirmation
5. Deploy changes
6. Optionally generate TypeScript types

### Option 2: Manual Commands

```bash
# Check pending migrations
npm run supabase:status

# Deploy migrations
npm run supabase:push

# Run seeds
npm run db:seed

# Deploy everything
npm run db:deploy
```

### Option 3: Automatic on Git Push (CI/CD)

When you push to `main` branch, GitHub Actions will automatically:
1. Detect migration changes
2. Deploy to Supabase
3. Generate updated TypeScript types
4. Commit types back to repo

**Setup Required:**
Add these secrets to GitHub (Settings → Secrets → Actions):
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

---

## 📁 Migration Structure

```
supabase/
├── config.toml                          # Supabase configuration
├── migrations/
│   ├── 20240101000000_initial_schema.sql    # Initial schema
│   ├── 20240101000001_seed_data.sql         # Seed data
│   └── 20240115123456_add_new_feature.sql   # Future migrations
└── seed.sql                             # Seed data (optional)
```

---

## ✍️ Creating New Migrations

### Method 1: Auto-generate from changes

```bash
# Make changes in Supabase Dashboard
# Then generate migration from diff
supabase db diff -f new_feature_name

# This creates: supabase/migrations/TIMESTAMP_new_feature_name.sql
```

### Method 2: Manual migration

```bash
# Create new migration file
supabase migration new add_recipient_lists

# Edit the file
# supabase/migrations/TIMESTAMP_add_recipient_lists.sql
```

Example migration:
```sql
-- Add recipient lists feature
CREATE TABLE public.recipient_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_recipient_lists_name ON public.recipient_lists(name);
```

### Method 3: Local Development

```bash
# Start local Supabase
supabase start

# Make changes in local dashboard
# http://localhost:54323

# Generate migration from local changes
supabase db diff -f my_changes

# Stop local instance
supabase stop
```

---

## 🔄 Workflow Examples

### Adding a New Table

```bash
# 1. Create migration
supabase migration new add_announcements_table

# 2. Edit migration file
# supabase/migrations/TIMESTAMP_add_announcements_table.sql

# 3. Deploy
./scripts/deploy-db.sh
```

### Modifying Existing Schema

```bash
# 1. Make changes in Supabase Dashboard (dev project)

# 2. Generate migration from diff
supabase db diff -f update_campaigns_table

# 3. Review the generated migration

# 4. Deploy to production
npm run supabase:push
```

### Rolling Back

```bash
# Reset to specific migration
supabase db reset --version TIMESTAMP

# Reset to clean state (WARNING: deletes all data)
supabase db reset
```

---

## 🎯 Best Practices

### 1. Always Use Migrations
❌ Don't manually edit in production dashboard
✅ Create migrations for all changes

### 2. Test Locally First
```bash
supabase start          # Start local instance
# Test your migration
supabase db reset       # Reset if needed
supabase stop
```

### 3. Never Edit Old Migrations
❌ Don't modify existing migration files
✅ Create new migration to fix issues

### 4. Descriptive Names
❌ `migration_1.sql`
✅ `add_recipient_lists_with_contacts.sql`

### 5. Include Rollback SQL (optional)
```sql
-- Migration: Add feature
CREATE TABLE ...;

-- Rollback (in comments)
-- DROP TABLE IF EXISTS ...;
```

---

## 🚨 Troubleshooting

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Migration already applied"
This is normal - Supabase tracks which migrations have run.

### "Type generation failed"
```bash
# Ensure you have the right permissions
supabase gen types typescript --local > lib/database.types.ts
```

### "Permission denied on script"
```bash
chmod +x scripts/deploy-db.sh
```

---

## 📚 Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/local-development)
- [CI/CD with Supabase](https://supabase.com/docs/guides/cli/managing-environments)

---

## 🎉 Summary

**Before (Manual):**
1. Edit SQL in editor
2. Copy to Supabase Dashboard
3. Paste and run
4. Hope it works
5. No version control

**After (Automated):**
1. Create migration file
2. Run `./scripts/deploy-db.sh`
3. Done! ✨

**Even Better (CI/CD):**
1. Create migration file
2. `git push`
3. Automatically deployed! 🚀
