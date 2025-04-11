# IVR Automation AI

An intelligent IVR navigation system powered by Amazon Q that can automatically interact with IVR systems.

## Overview

IVR Automation AI combines the power of Amazon Q with IVR testing tools to create an automated system that can navigate through Interactive Voice Response (IVR) systems. It sends IVR prompts to Amazon Q, which determines the appropriate action to take, and then sends that action back to the IVR system.

## Features

- **AI-Powered Navigation**: Uses Amazon Q to intelligently navigate IVR systems
- **Multi-Digit Input Handling**: Properly handles multi-digit inputs by splitting them into separate calls
- **Interactive Mode**: Manually test IVR navigation with AI assistance
- **Automated Mode**: Fully automated IVR testing with detailed reporting
- **Blank Response Handling**: Detects and handles blank IVR responses after multi-digit inputs
- **Session Management**: Maintains conversation context throughout the IVR flow
- **Detailed Logging**: Comprehensive logging and session history

## Architecture

The system consists of three main components:

1. **IVR Navigator**: Handles interaction with Amazon Q Session API
2. **IVR Integration**: Connects to real IVR systems and handles the communication
3. **IVR Flow Tester**: Manages the actual IVR calls and responses

## Prerequisites

1. Node.js (v14 or higher)
2. Amazon Q Session API running (`http://localhost:8081`)
3. Amazon Q CLI configured with an IVR_tester profile
4. Access to an IVR system for testing

## Installation

1. Clone the repository:
   ```
   git clone git@github.com:jmhjr316-Git/IVR_Automation_AI.git
   cd IVR_Automation_AI
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

### Multi-Digit Input Handling

The system handles multi-digit inputs (like prescription numbers or DOBs) by:

1. Sending the first digit in one call
2. Waiting briefly for the IVR to process
3. Sending the remaining digits in a second call
4. Checking for blank responses and making additional calls if needed

This approach is necessary because many IVR systems require this pattern for multi-digit inputs.

### Blank Response Handling

After sending multi-digit inputs, the system:

1. Checks if the IVR response is blank
2. If blank, makes an additional call with no input to get the next prompt
3. Ensures no IVR prompts are missed during navigation

## Key Components

### ivr-navigator.js

Interactive tool for testing IVR navigation with Amazon Q.

### ivr-auto-navigator.js

Framework for automated IVR testing with simulated prompts.

### ivr-integration.js

Integration with real IVR systems, handling the communication between Amazon Q and the IVR.

### run-ivr-test.js

Script to run automated IVR tests with detailed reporting.

## Logs and Reports

The system generates:

- **JSON History**: Complete session history in JSON format
- **Markdown Reports**: Human-readable reports of the navigation session
- **Log Files**: Detailed logs for debugging and analysis

## Dependencies

This project depends on:

- **IVR Flow Tester**: From the IVR Crawler project, handles the actual IVR calls
- **IVR State Tracker**: Tracks the state of the IVR system during navigation

## Troubleshooting

If you encounter issues:

1. **Blank Responses**: If the IVR system doesn't respond after multi-digit inputs, try increasing the wait time
2. **Connection Issues**: Ensure the IVR system URL is correct and accessible
3. **Amazon Q Issues**: Check that the Amazon Q Session API is running and properly configured

## Development

### Adding New Features

To add new features:

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Submit a pull request

### Testing

Run the automated tests:

```bash
npm test
```

## License

This project is licensed under the ISC License.
