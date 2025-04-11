# IVR Automation AI - Architecture

This document provides a detailed overview of the architecture and design of the IVR Automation AI system.

## System Architecture

The IVR Automation AI system consists of three main components that work together to provide intelligent IVR navigation:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Amazon Q API   │◄────┤  IVR Navigator  │────►│   IVR System    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Components

1. **IVR Navigator**
   - Manages the interaction with Amazon Q Session API
   - Extracts actions from Amazon Q responses
   - Provides both interactive and automated interfaces

2. **IVR Integration**
   - Connects the IVR Navigator to the IVR Flow Tester
   - Handles multi-digit input splitting
   - Manages blank response detection and handling

3. **IVR Flow Tester**
   - Manages the actual IVR calls
   - Parses XML responses from the IVR system
   - Extracts text from IVR responses

## Data Flow

The system follows this data flow pattern:

1. IVR prompt is captured from the IVR system
2. Prompt is sent to Amazon Q via the Session API
3. Amazon Q determines the appropriate action
4. Action is extracted from Amazon Q's response
5. Action is sent to the IVR system (with multi-digit handling)
6. IVR response is captured and the cycle continues

## Key Files

### ivr-navigator.js

The interactive navigator that allows manual testing of IVR navigation with Amazon Q.

**Key Functions:**
- `startSession()`: Creates a new Amazon Q session
- `askAmazonQ(prompt)`: Sends a prompt to Amazon Q and gets a response
- `extractAction(response)`: Extracts the action from Amazon Q's response
- `saveHistory()`: Saves the session history to a file

### ivr-auto-navigator.js

The automated navigator that simulates IVR prompts and gets responses from Amazon Q.

**Key Functions:**
- `runAutomatedSession()`: Runs an automated session with simulated prompts
- `simulateIvrPrompt()`: Simulates an IVR prompt based on the current state
- `processAction(action)`: Processes the action from Amazon Q

### ivr-integration.js

The integration layer that connects Amazon Q with the IVR Flow Tester.

**Key Functions:**
- `setIvrTester(ivrTester)`: Sets the IVR tester instance
- `runAutomatedNavigation(testName)`: Runs an automated navigation session
- `askAmazonQ(ivrPrompt)`: Asks Amazon Q what to do based on the IVR prompt
- `extractAction(response)`: Extracts the action from Amazon Q's response

### run-ivr-test.js

The main script for running automated IVR tests.

**Key Functions:**
- Parses command-line arguments
- Initializes the IVR Flow Tester and IVR Integration
- Runs the automated navigation
- Reports the results

## Multi-Digit Input Handling

The system handles multi-digit inputs using a specialized approach:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Detect Multi-  │────►│  Send First     │────►│  Send Remaining │
│  Digit Input    │     │  Digit          │     │  Digits         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Process IVR    │◄────┤  Send Continue  │◄────┤  Check for      │
│  Response       │     │  If Needed      │     │  Blank Response │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

This approach is necessary because many IVR systems require multi-digit inputs to be sent in this specific pattern.

## Blank Response Handling

The system includes specialized handling for blank responses after multi-digit inputs:

1. After sending the remaining digits, it checks if the response is blank
2. If blank, it makes an additional call with no input to get the next prompt
3. After the standard wait time, it checks again if the response is still blank
4. If still blank, it makes another additional call

This ensures that no IVR prompts are missed during navigation.

## Dependencies

The system has the following key dependencies:

- **axios**: For making HTTP requests to the Amazon Q Session API and IVR system
- **xml2js**: For parsing XML responses from the IVR system
- **uuid**: For generating unique session IDs
- **winston**: For logging
- **chalk**: For colorized console output
- **commander**: For parsing command-line arguments
- **inquirer**: For interactive prompts

## External Dependencies

The system also depends on external components:

- **IVR Flow Tester**: From the IVR Crawler project
- **IVR State Tracker**: From the IVR Crawler project

These components are currently imported from their original locations but could be integrated directly into this project in the future.

## Future Enhancements

Potential future enhancements include:

1. **Direct Integration**: Integrate the IVR Flow Tester directly into this project
2. **Voice Recognition**: Add support for voice recognition to handle voice-based IVR systems
3. **Test Case Generation**: Automatically generate test cases based on IVR flows
4. **Performance Optimization**: Optimize the multi-digit handling for better performance
5. **Web Interface**: Add a web interface for easier management and monitoring
