# IVR Q Navigator

A tool for navigating IVR systems using Amazon Q Session API.

## Overview

IVR Q Navigator provides a clean interface for interacting with IVR systems using Amazon Q to determine the appropriate responses. It leverages the Amazon Q Session API to maintain conversation context throughout the IVR flow.

## Features

- **Interactive Navigation**: Manually enter IVR prompts and get recommended actions
- **Automated Navigation**: Simulate or connect to real IVR systems for automated testing
- **Multi-line Support**: Properly handles complex IVR prompts with multiple lines
- **Session Management**: Maintains conversation context throughout the IVR flow
- **Detailed Logging**: Comprehensive logging and session history
- **IVR Integration**: Direct integration with IVR systems for automated navigation

## Prerequisites

1. Node.js (v14 or higher)
2. Amazon Q Session API running (`http://localhost:8081`)
3. Amazon Q CLI configured with an IVR_tester profile

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ivr-q-navigator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make the scripts executable:
   ```
   chmod +x ivr-navigator.js ivr-auto-navigator.js run-ivr-test.js
   ```

## Usage

### Interactive Mode

Run the interactive navigator:

```bash
./ivr-navigator.js
```

Options:
- `-u, --url <url>`: Amazon Q Session API URL (default: http://localhost:8081)
- `-p, --profile <profile>`: Amazon Q profile to use (default: IVR_tester)
- `-l, --log-dir <directory>`: Directory for logs (default: ./logs)

### Automated Mode

Run the automated navigator:

```bash
./ivr-auto-navigator.js
```

Options:
- `-u, --url <url>`: Amazon Q Session API URL (default: http://localhost:8081)
- `-p, --profile <profile>`: Amazon Q profile to use (default: IVR_tester)
- `-l, --log-dir <directory>`: Directory for logs (default: ./logs)
- `-m, --max-steps <number>`: Maximum number of steps (default: 20)
- `-w, --wait-time <ms>`: Wait time between steps in milliseconds (default: 2000)

### IVR Integration Mode

Run the IVR integration test:

```bash
./run-ivr-test.js
```

Options:
- `-u, --url <url>`: Amazon Q Session API URL (default: http://localhost:8081)
- `-p, --profile <profile>`: Amazon Q profile to use (default: IVR_tester)
- `-o, --output <directory>`: Output directory (default: ./ivr_results)
- `-i, --ivr <url>`: IVR system URL (default: https://inbound-ivr-bot-text.pc.q.platform.enlivenhealth.co)
- `-f, --from <number>`: From phone number (default: 7249143802)
- `-t, --to <number>`: To phone number (default: 9193736940)
- `-w, --wait <ms>`: Wait time between steps in milliseconds (default: 2000)
- `-n, --name <name>`: Test name (default: AI_IVR_Test)

## How It Works

1. The tool creates a session with the Amazon Q Session API
2. It connects to the IVR system and captures the initial prompt
3. The prompt is sent to Amazon Q through the Session API
4. Amazon Q determines the appropriate action based on the prompt and conversation history
5. The tool extracts and sends the recommended action to the IVR system
6. The process repeats until completion or maximum steps reached

## Logs and Reports

The tool generates detailed logs and reports:

- **JSON History**: Complete session history in JSON format
- **Markdown Reports**: Human-readable reports of the navigation session
- **Log Files**: Detailed logs for debugging and analysis

## Troubleshooting

If you encounter issues:

1. Ensure the Amazon Q Session API is running at the specified URL
2. Check the logs in the log directory for detailed error information
3. Verify that the IVR_tester profile is properly configured in Amazon Q CLI
4. Make sure the IVR system URL is correct and accessible
