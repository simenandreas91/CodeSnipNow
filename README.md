# CodeSnipNow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CodeSnipNow is a modern web application designed as a catalog for ServiceNow automation blueprints. It enables users to discover, share, and reuse code snippets related to ServiceNow artifacts such as Business Rules, Client Scripts, Script Includes, UI Actions, and more. Built with a focus on developer productivity, it provides an intuitive interface for managing these snippets with full CRUD operations, search, filtering, and pagination.

## Features

- **User Authentication**: Secure sign-in and sign-up using Supabase Auth.
- **Snippet Management**: Create, view, update, and delete ServiceNow-specific code snippets.
- **Search and Filter**: Search across titles, descriptions, and code; filter by artifact type (e.g., Business Rule, Client Script) or "My Snippets".
- **Pagination**: Efficient browsing with 12 snippets per page.
- **Artifact Support**: Comprehensive types including Business Rules, Client Scripts, Script Includes, UI Actions, Scheduled Jobs, Transform Maps, Background Scripts, Catalog Client Scripts, and Service Portal Widgets.
- **Bulk Import**: Support for creating multiple snippets (e.g., from GitHub repos).
- **Markdown Rendering**: Code snippets rendered with syntax highlighting using Marked.
- **Responsive Design**: Built with Tailwind CSS for a modern, mobile-friendly UI.
- **Mock Data Fallback**: Demo mode with sample snippets when Supabase is not configured.
- **Public Sharing**: Snippets can be marked as public for community reuse.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite (build tool)
- **Styling**: Tailwind CSS, Lucide React (icons)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Utilities**: Marked (Markdown parsing), @supabase/supabase-js
- **Development**: ESLint, PostCSS, TypeScript ESLint

## Installation

1. **Clone the Repository**:
   ```
   git clone https://github.com/simenandreas91/CodeSnipNow.git
   cd CodeSnipNow
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Set Up Environment Variables**:
   - Copy `.env.example` to `.env.local`.
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run the Development Server**:
   ```
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view the app.

5. **Build for Production**:
   ```
   npm run build
   ```
   Preview the build with `npm run preview`.

## Usage

- **Browse Snippets**: Use the search bar to find snippets by keyword or filter by artifact type.
- **Authentication**: Sign up or log in to create and manage personal snippets.
- **Create a Snippet**: Click "Create Snippet" in the header (requires login). Select an artifact type and fill in details like title, description, code, and type-specific fields (e.g., condition for Business Rules).
- **View Snippet**: Click on a snippet card to open a modal with full details and edit options.
- **My Snippets**: Filter by "My Snippets" to view and manage your own creations.
- **Import from GitHub**: Use the GitHub Import Modal (if implemented) for bulk uploads.

For ServiceNow integration, ensure your snippets align with the defined artifact types and fields.

## Database Schema

Snippets are stored in separate Supabase tables per artifact type:
- `business_rules`
- `client_scripts`
- `script_includes`
- `ui_actions`
- `scheduled_jobs`
- `transform_maps`
- `background_scripts`
- `catalog_client_scripts`
- `service_portal_widgets`

Each table includes core fields like `title`, `description`, `code`, `tags`, `is_public`, `author_id`, plus type-specific fields (e.g., `when_to_run` for Business Rules).

Run migrations in the `supabase/migrations/` directory to set up the schema.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Ensure code follows ESLint rules and TypeScript best practices. Focus on ServiceNow artifact accuracy and UI/UX improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com) for the backend services.
- [Tailwind CSS](https://tailwindcss.com) for styling.
- [Vite](https://vitejs.dev) for fast development.
- Inspired by ServiceNow developer needs for snippet sharing.

---

*Built with ❤️ for ServiceNow developers.*
