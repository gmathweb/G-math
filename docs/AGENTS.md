# 🧙 Working with the Agent Squad

G-math is built by the **Fellowship of Learning** — an AI agent squad. Each agent has a role and specialty. You interact with them using `@Agent` commands in the Copilot CLI.

The squad manages the full project surface: **backend** (FastAPI), **student frontend** (`frontend/`, port 5173), and **admin frontend** (`admin-frontend/`, port 5174).

## Squad Members

### 🧙‍♂️ Gandalf — Project Manager / Mission Controller

The coordinator. Gandalf breaks features into missions, dispatches parallel developers, and tracks progress.

**When to call Gandalf:**
- Starting a new feature or epic
- Checking task status
- Prioritizing work
- Getting a project overview

```
@Gandalf start working on the API endpoints
@Gandalf what tasks are pending?
@Gandalf show mission board
@Gandalf break this into tasks: add Arabic support to all pages
```

---

### 🌟 Galadriel — UX Designer

Handles all design work — prototypes, mockups, color palettes, layout decisions, accessibility, and RTL support.

**When to call Galadriel:**
- Designing new pages or components
- Reviewing UI/UX
- Choosing colors, typography, spacing
- RTL layout issues
- Accessibility audits

```
@Galadriel redesign the topic page header
@Galadriel create a mockup for the lesson page
@Galadriel review the color palette for accessibility
@Galadriel fix the RTL layout on the dashboard
```

---

### 🛡️ Elrond — Tech Lead / Code Reviewer

Reviews architecture, security, and code quality. Dispatched for code reviews and technical decisions.

**When to call Elrond:**
- Code review after implementing a feature
- Architecture questions
- Security review
- Performance optimization
- Technical debt assessment

```
@Elrond review the latest changes
@Elrond review with focus on security
@Elrond is this the right architecture for file uploads?
@Elrond check the auth middleware for vulnerabilities
```

---

### 🌱 Samwise — DevOps (Future)

Monitoring, deployment, CI/CD pipelines. Currently planned, not yet active.

**Future responsibilities:**
- GitHub Actions workflows
- Docker image optimization
- Health monitoring and alerting
- Deployment automation

---

## How to Give Commands

Talk to any agent using the `@Agent` prefix:

```
@Gandalf start working on the API endpoints
@Galadriel redesign the topic page header
@Elrond review the latest changes
@Gandalf what tasks are pending?
```

You can also describe what you want without a specific agent — Gandalf will route it:

```
I need a new admin page for managing site settings
```

## How Missions Work

When you request a feature, here's the workflow:

1. **Gandalf receives the request** and breaks it into discrete tasks
2. **Tasks are tracked** in SQL (todos table) with dependencies
3. **Independent tasks are dispatched in parallel** — multiple developers work simultaneously
4. **Dependencies are respected** — blocked tasks wait for their prerequisites
5. **Status updates flow** as each developer completes their work
6. **Elrond reviews** when implementation is complete

### Task States

| Status        | Meaning                                    |
|---------------|--------------------------------------------|
| `pending`     | Waiting to be started                      |
| `in_progress` | A developer is actively working on it      |
| `done`        | Completed and verified                     |
| `blocked`     | Cannot proceed — dependency not met yet    |

### Example Mission Flow

```
You: @Gandalf add a "favorites" feature for students

Gandalf breaks it into:
  1. [backend] Add favorites model + migration
  2. [backend] Add favorites API endpoints
  3. [frontend] Add heart/star button component    ← depends on #2
  4. [frontend] Add favorites page                 ← depends on #2
  5. [review] Elrond reviews all changes           ← depends on #3, #4

Tasks #1 and #2 run in parallel.
Tasks #3 and #4 start when #2 finishes.
Elrond reviews when everything is done.
```

## How to Add New Features

1. **Describe** what you want to any agent (or Gandalf specifically)
2. **Gandalf breaks it** into missions with dependencies
3. **Developers execute** in parallel where possible
4. **Elrond reviews** when implementation is complete
5. **Push to GitHub** when approved

```
You: I want students to be able to bookmark lessons

Gandalf: Breaking this into 4 tasks...
  → [in_progress] Creating Bookmark model
  → [in_progress] Adding API endpoints
  → [pending] Frontend bookmark button (waiting for API)
  → [pending] Elrond review (waiting for all)
```

## How to Request Reviews

```
@Elrond please review the latest changes
@Elrond review with focus on security
@Elrond review the auth module for best practices
@Elrond check test coverage for the topics API
```

Elrond will:
- Review code changes (staged, unstaged, or branch diff)
- Only flag issues that matter — bugs, security, logic errors
- Suggest improvements for architecture and performance
- Skip style/formatting nitpicks

## How to Check Status

```
@Gandalf what tasks are pending?
@Gandalf show mission board
@Gandalf what's blocking progress?
@Gandalf summary of today's work
```

## Tips

- **Be specific** — "add Hebrew translations for error messages" is better than "fix i18n"
- **One feature at a time** — let Gandalf manage the breakdown
- **Trust the dependencies** — blocked tasks will start automatically when ready
- **Review often** — call Elrond after completing any significant feature
- **Design first** — call Galadriel before implementing UI changes
