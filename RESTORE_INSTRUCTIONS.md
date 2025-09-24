# How to Restore CodeSnipNow v0.1

If you need to restore this exact version, follow these steps:

## Option 1: Using This Bolt Project
1. Keep this Bolt project saved in your account
2. You can always return to this exact state
3. All files and database schema are preserved here

## Option 2: Manual Restoration
If you need to recreate this version elsewhere:

### 1. Database Setup
Run the SQL migrations in this order:
1. `create_servicenow_tables.sql` - Creates all artifact tables
2. `update_ui_actions_table.sql` - Adds UI Action specific fields

### 2. Environment Variables
Create `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Dependencies
Install with: `npm install`

Key dependencies:
- React 18.3.1
- @supabase/supabase-js 2.57.4
- Tailwind CSS 3.4.1
- Lucide React 0.344.0
- TypeScript 5.5.3

### 4. File Verification
Ensure these key files match the v0.1 versions:
- `src/App.tsx` - Main application component
- `src/hooks/useSnippets.ts` - Data management
- `src/components/CreateSnippetModal.tsx` - UI Action form
- `src/types/snippet.ts` - Type definitions

## Version Verification
After restoration, verify:
- ✅ All 6 artifact types display correctly
- ✅ UI Action creation form shows all fields
- ✅ Search and filtering works
- ✅ Authentication functions properly
- ✅ Database queries return data from correct tables

## Rollback Strategy
If issues occur after changes:
1. Return to this Bolt project
2. Copy the working files
3. Restore database schema from SQL files
4. Test all functionality

---
*Keep this documentation with your v0.1 backup for easy restoration.*