# Amazon Q Session API

A session-based API for interacting with Amazon Q CLI that maintains conversation context.

## Overview

This API provides a way to interact with Amazon Q through persistent sessions, allowing for conversational context to be maintained across multiple requests. This is particularly useful for applications like IVR systems that need to maintain context throughout a call flow.

## Features

- **Session Management**: Create, use, and terminate Amazon Q sessions
- **Conversation History**: Maintain the full history of a conversation
- **Profile Support**: Use different Amazon Q profiles for different use cases
- **Automatic Cleanup**: Sessions are automatically cleaned up after inactivity

## Prerequisites

1. Node.js (v14 or higher)
2. Amazon Q CLI installed and configured
3. At least one Amazon Q profile set up

## Installation

1. Install dependencies:
   ```
   cd api
   npm install
   ```

2. Start the server:
   ```
   ./run.sh
   ```

The API will be available at `http://localhost:8081`.

## API Endpoints

### Create a new session

```
POST /api/sessions
```

Request body:
```json
{
  "profile": "IVR_tester"  // Optional, defaults to "IVR_tester"
}
```

Response:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get session info

```
GET /api/sessions/:sessionId
```

Response:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "profile": "IVR_tester",
  "messageCount": 3,
  "lastActivity": "2023-04-01T12:34:56.789Z"
}
```

### Get session messages

```
GET /api/sessions/:sessionId/messages
```

Response:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "What is AWS S3?",
      "timestamp": "2023-04-01T12:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "AWS S3 (Simple Storage Service) is an object storage service...",
      "timestamp": "2023-04-01T12:30:05.000Z"
    }
  ]
}
```

### Send a message to a session

```
POST /api/sessions/:sessionId/messages
```

Request body:
```json
{
  "message": "What should I do when the IVR asks for my account number?"
}
```

Response:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "When the IVR asks for your account number, you should enter the digits..."
}
```

### End a session

```
DELETE /api/sessions/:sessionId
```

Response:
```json
{
  "success": true
}
```

## Integration with IVR Navigator

This API is designed to work with the IVR Automation AI tool. The integration is already set up in the main project.

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "sessions": 5
}
```

## Session Timeout

Sessions automatically timeout after 10 minutes of inactivity to free up resources.

## Logs

Logs are stored in:
- `combined.log` - All logs
- `error.log` - Error logs only
- `logs/{sessionId}/` - Session-specific logs
