# AWS Serverless Notes App

A full-stack serverless notes application built on AWS to explore and learn AWS serverless services as proof of concept for a real-world app development and deployment.

The idea is simple: build a small note-taking app where users can sign up, log in, and manage their personal notes with a fully serverless backend on AWS.

## Why This Project?

I built this project to get practical experience with AWS serverless services for the purpose of the development of a more complex project. Instead of just reading docs, I wanted to actually wire together the services.


## Architecture

```
Browser → Route 53 → CloudFront → /* (S3 Frontend)
                                 → /api/* (API Gateway) → Lambda → DynamoDB
```

CloudFront serves as the single entry point with two behaviors:
- **Default (`/*`)** — serves the static frontend from S3
- **API (`/api/*`)** — forwards requests to API Gateway, which triggers the Lambda functions

Cognito handles authentication. On sign-in, it issues a JWT token. The frontend attaches this token to every API call, and API Gateway validates it before anything reaches Lambda. The user ID is always extracted from the token server-side — it never comes from the client.

## AWS Services Used

| Service | Role |
|---------|------|
| **Lambda** | Executes the Node.js backend functions (CRUD operations for notes) |
| **API Gateway** | Creates REST API endpoints that route to the Lambda functions |
| **DynamoDB** | NoSQL database storing all notes with a composite key (`userId` + `noteId`) |
| **S3** | Hosts the static frontend files (HTML, CSS, JS) |
| **Cognito** | User authentication — sign-up, email verification, and sign-in via a User Pool |
| **CloudFront** | CDN that caches and serves both frontend and API from edge locations worldwide |
| **Route 53** | DNS management — maps the custom domain to the CloudFront distribution |
| **ACM** | Provisions and manages the SSL certificate for HTTPS |

## Project Structure

```
Aws-serverless-note-app/
├── backend/
│   ├── layers/
│   │   └── nodejs/
│   │       ├── shared/
│   │       │   ├── dynamodb.mjs        # DynamoDB client, table name, command exports
│   │       │   └── response.mjs        # HTTP response helpers with CORS headers
│   │       └── package.json            # AWS SDK dependencies for the layer
│   ├── functions/
│   │   ├── createNote/createNote.mjs   # POST /notes — create a new note
│   │   ├── getNotes/getNotes.mjs       # GET /notes — list all notes for a user
│   │   ├── getNote/getNote.mjs         # GET /notes/:noteId — get a single note
│   │   ├── updateNote/updateNote.mjs   # PUT /notes/:noteId — update a note
│   │   └── deleteNote/deleteNote.mjs   # DELETE /notes/:noteId — delete a note
│   ├── scripts/
│   │   ├── zip-layer.mjs              # Zips the Lambda Layer for deployment
│   │   └── zip-functions.mjs          # Zips each Lambda function for deployment
│   └── package.json                   # Backend tooling (archiver for zipping)
├── frontend/                          # 
├── documentation/
│   └── instructions                   # Full implementation plan and technical reference
└── README.md
```

## Backend

### Lambda Layer (Shared Code)

The layer contains two shared modules that all Lambda functions import from:

- **`dynamodb.mjs`** — sets up the DynamoDB Document Client, exports the table name and all DynamoDB commands (`GetCommand`, `PutCommand`, `UpdateCommand`, `DeleteCommand`, `QueryCommand`)
- **`response.mjs`** — provides standardized HTTP response functions (`success`, `created`, `badRequest`, `notFound`, `error`) with CORS headers baked in

### Lambda Functions

Five functions handle the full CRUD lifecycle:

| Function | Method & Route | What It Does |
|----------|---------------|-------------|
| `createNote` | `POST /notes` | Validates input, generates a UUID for the note, saves to DynamoDB |
| `getNotes` | `GET /notes` | Queries all notes for the authenticated user, sorted by newest first |
| `getNote` | `GET /notes/:noteId` | Fetches a single note by its composite key |
| `updateNote` | `PUT /notes/:noteId` | Partially updates title and/or content, auto-updates the timestamp |
| `deleteNote` | `DELETE /notes/:noteId` | Deletes a note with an ownership check to prevent unauthorized access |

### DynamoDB Table

| Setting | Value |
|---------|-------|
| Table Name | `Notes` |
| Partition Key | `userId` (String) |
| Sort Key | `noteId` (String) |
| Billing | On-demand (PAY_PER_REQUEST) |

Each note item contains: `userId`, `noteId`, `title`, `content`, `createdAt`, and `updatedAt`.

## Getting Started

### Prerequisites

- Node.js 22.x
- An AWS IAM user account with least privilege access to Lambda, DynamoDB, API Gateway, S3, CloudFront, Cognito, Route 53, and ACM

### Install Dependencies

```bash
# Lambda Layer dependencies
cd /backend/layers/nodejs
npm install

# Backend tooling (archiver for zipping)
cd /backend
npm install
```

### Zip for Deployment

```bash
# From the backend/ directory
npm run zip:layer        # Zips the Lambda Layer → dist/layer.zip
npm run zip:functions    # Zips all functions → dist/functions/*.zip
npm run zip:all          # Runs both
```

## What I Learned

This project is a learning exercise, and I'm documenting everything along the way. Some key takeaways so far:

- **Composite keys in DynamoDB** eliminate the need for secondary indexes when your access patterns are well-defined
- **Lambda Layers** keep shared code across functions.
- **CORS in serverless** requires attention at multiple layers: Lambda response headers, API Gateway configuration, and CloudFront behavior settings

## Status

- [x] Project structure and folder setup
- [x] Lambda Layer — DynamoDB client and response helpers
- [x] Lambda Functions — all five CRUD operations
- [x] Zip scripts for deployment
- [x] DynamoDB table creation
- [x] Lambda deployment and testing
- [x] API Gateway setup
- [ ] Cognito User Pool and authentication
- [ ] Frontend development
- [ ] CloudFront distribution and custom domain
- [ ] End-to-end testing

