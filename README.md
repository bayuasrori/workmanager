# WorkManager

A full-stack work management application built with SvelteKit, Drizzle ORM, and Tailwind CSS.

## Features

- User authentication
- Organization and team management
- Project and task tracking

## Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) with [libSQL](https://turso.tech/libsql)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [daisyUI](https://daisyui.com/)
- **Authentication:** [Oslo](https://oslo.js.org/)
- **Linting/Formatting:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)
- **Package Manager:** [bun](https://bun.sh/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Bun](https://bun.sh/)

### Installation

1.  Clone the repository:

    ```sh
    git clone <repository-url>
    cd workmanager
    ```

2.  Install dependencies:

    ```sh
    bun install
    ```

3.  Set up your environment variables by copying the example file:

    ```sh
    cp .env.example .env
    ```

    Update the `.env` file with your database credentials and other required secrets.

4.  Apply database migrations:

    ```sh
    bun run db:push
    ```

5.  Start the development server:
    ```sh
    bun run dev
    ```

Your application should now be running at `http://localhost:5173`.

## Available Scripts

- `dev`: Starts the development server.
- `build`: Builds the application for production.
- `preview`: Previews the production build.
- `lint`: Lints the codebase using ESLint and Prettier.
- `format`: Formats the codebase with Prettier.
- `db:push`: Pushes database schema changes (for development).
- `db:migrate`: Creates a new database migration.
- `db:studio`: Opens the Drizzle Studio to browse your data.

## Project Structure

- `src/lib/server/db/schema.ts`: Defines the database schema using Drizzle ORM.
- `src/lib/server/service/*`: Contains the business logic for different parts of the application (users, projects, tasks, etc.).
- `src/routes`: Contains the SvelteKit routes for the application. Each route directory has `+page.svelte` for the UI and `+page.server.ts` for server-side logic.
