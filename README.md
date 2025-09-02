# FileSure Backend (TypeScript)

This repository contains the backend server code for the FileSure web app, implemented in TypeScript.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Running the Server](#running-the-server)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Linting and Formatting](#linting-and-formatting)
- [Environment Configuration](#environment-configuration)
- [Development Principle](#development-principles)
- [Modular Development Patter](#modular-development-pattern)
- [How to commit in git](#how-to-commit-in-git)
<!-- - [Dependencies](#dependencies)
- [License](#license) -->

## Getting Started

### Prerequisites

Before running the server, make sure you have the following installed on your machine:

- Node.js
- npm (Node Package Manager)
- MongoDB

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/FileSure/filesure-backend.git

   ```

2. **Installation Dependencies**

   To install dependencies, navigate to the project directory and run:

   ```bash
   cd filesure-backend
   npm install
   ```

## Folder Structure

The project follows an MVC (Model-View-Controller) pattern:

- **src**
  - **app**
    - **config**
    - **modules**
      - **user**
        - **user.interface.ts**
        - **user.model.ts**
        - **user.routes.ts**
        - **user.controller.ts**
  - **app.js**: Entry point for the application.
  - **server.js**: Entry point for the server.

## Running the Server

1. **Development Mode**

   To run the server in development mode with auto-reloading on file changes:

   ```bash
   npm run start:dev
   ```

1. **Production Mode**

   To build the TypeScript code and run the server in production mode:

   ```bash
   npm run build
   npm start:prod
   ```

## Linting and Formatting

1. **Run ESLint:**

   ```bash
   npm run lint
   ```

1. **Auto Fix ESLint issues:**

   ```bash
   npm run lint:fix
   ```

1. **Run Prettier:**

   ```bash
   npm run prettier
   ```

1. **Auto Fix Prettier issues:**

   ```bash
   npm run prettier:fix
   ```

## Development Principles

### DRY - Don't Repeat Yourself

As a team, let's adhere to the DRY principle, which stands for "Don't Repeat Yourself." This principle emphasizes the importance of avoiding code repetition. Instead of duplicating similar code segments, let's focus on creating reusable components or functions. By doing so, we can improve the maintainability of our codebase, minimize errors, and ensure consistency throughout our projects.

### Fat Model/Thin Controller

In our development approach, we encourage the "Fat Model/Thin Controller" principle. This suggests that the majority of our application logic should reside within our data models (Models), making them "fat" with business logic. Controllers, in contrast, should remain "thin" and primarily handle the interaction between the user and the models.

By embracing this principle, we aim for better separation of concerns, making our codebase more modular and easier to maintain. Let's work together to keep our models robust and controllers focused on managing the flow of data.

## Modular Development Pattern

To maintain a modular and organized codebase, we'll follow a development pattern that includes the following components:

### 1. Interface

Create clear and well-defined interfaces for our data structures. Interfaces act as blueprints that define the structure and properties of our data objects. This enhances code readability and helps maintain consistency.

```typescript
// Example Interface
interface User {
  id: string;
  username: string;
  email: string;
}
```

### 2. Schema

Implement schemas based on the defined interfaces. Schemas define the structure of our data models and provide a set of validation rules. This ensures that our data adheres to a specific format, improving data integrity.

```typescript
// Example Schema
const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  email: String,
});
```

### 3. Model

Create models that utilize both the interface and schema. Models serve as an abstraction layer between our application logic and the database. They provide methods for interacting with the database and enforce the defined structure through the schema.

```typescript
// Example Model
const UserModel = mongoose.model<User>('User', userSchema);
```

### 4. DB Query

Implement database queries using the created models. Database queries should be isolated within dedicated modules or services. This ensures a separation of concerns, making our codebase more maintainable and scalable.

```typescript
// Example DB Query
const getUserById = async (userId: string): Promise<User | null> => {
  return UserModel.findById(userId).exec();
};
```

## How To Commit In Git

For this repo you must follow conventional commit for better commit history. If you know then you can follow regular git commit -m 'your commit', otherwise after git add then run git cz

## Global Error Handling

## Types of Errors must need to handle

# Operational Error

- invalid user inputs
- failed to run server
- failed to connect database
- invalid token

# Programmmitical Error

- using undefined variables
- using properties that does not exist
- passing number instead of string

# Unhandled Rejection (Async Code)

# Uncaught Exception (Synchronous Code)
# course-mate-backend
