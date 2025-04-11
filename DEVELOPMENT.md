# IVR Automation AI - Development Guide

This document provides guidance for developers who want to extend or modify the IVR Automation AI system.

## Project Structure

```
ivr-q-navigator/
├── ivr-navigator.js         # Interactive IVR navigator
├── ivr-auto-navigator.js    # Automated IVR navigator
├── ivr-integration.js       # Integration with IVR systems
├── run-ivr-test.js          # Script to run IVR tests
├── package.json             # Project configuration
├── README.md                # Main documentation
├── ARCHITECTURE.md          # Architecture documentation
├── DEPENDENCIES.md          # Dependencies documentation
├── USAGE.md                 # Usage documentation
├── DEVELOPMENT.md           # Development documentation
├── WORKING_NOTES.md         # Working notes
├── .gitignore               # Git ignore file
└── logs/                    # Log directory
```

## Development Environment Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:jmhjr316-Git/IVR_Automation_AI.git
   cd IVR_Automation_AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the Amazon Q Session API:
   - Ensure the API is running at http://localhost:8081
   - Configure the IVR_tester profile in Amazon Q CLI

4. Set up the IVR system:
   - Ensure the IVR system is accessible
   - Update the IVR system URL in the configuration if needed

## Code Organization

### ivr-navigator.js

The interactive navigator that allows manual testing of IVR navigation with Amazon Q.

**Key Classes and Functions:**
- `IvrNavigator`: Main class for the interactive navigator
  - `startSession()`: Creates a new Amazon Q session
  - `askAmazonQ(prompt)`: Sends a prompt to Amazon Q and gets a response
  - `extractAction(response)`: Extracts the action from Amazon Q's response
  - `saveHistory()`: Saves the session history to a file

### ivr-auto-navigator.js

The automated navigator that simulates IVR prompts and gets responses from Amazon Q.

**Key Classes and Functions:**
- `IvrAutoNavigator`: Main class for the automated navigator
  - `runAutomatedSession()`: Runs an automated session with simulated prompts
  - `simulateIvrPrompt()`: Simulates an IVR prompt based on the current state
  - `processAction(action)`: Processes the action from Amazon Q

### ivr-integration.js

The integration layer that connects Amazon Q with the IVR Flow Tester.

**Key Classes and Functions:**
- `IvrIntegration`: Main class for the integration layer
  - `setIvrTester(ivrTester)`: Sets the IVR tester instance
  - `runAutomatedNavigation(testName)`: Runs an automated navigation session
  - `askAmazonQ(ivrPrompt)`: Asks Amazon Q what to do based on the IVR prompt
  - `extractAction(response)`: Extracts the action from Amazon Q's response

### run-ivr-test.js

The main script for running automated IVR tests.

**Key Functions:**
- `main()`: Main function that runs the test

## Key Algorithms

### Action Extraction

The system extracts actions from Amazon Q responses using a simple algorithm:

```javascript
extractAction(response) {
  // Split by newlines, trim whitespace, and filter out empty lines
  const lines = response.split('\n').map(line => line.trim()).filter(line => line);
  
  // Get the last non-empty line
  const lastLine = lines[lines.length - 1] || '';
  
  return lastLine;
}
```

This algorithm assumes that Amazon Q will provide the recommended action as the last line of its response.

### Multi-Digit Input Handling

The system handles multi-digit inputs using the following algorithm:

```javascript
if (/^\d{2,}$/.test(action)) {
  // For multi-digit inputs, we need to split them
  // First digit goes in first call, remaining digits in second call
  const firstDigit = action.charAt(0);
  const remainingDigits = action.substring(1);
  
  // Send the first digit
  response = await this.ivrTester.sendDtmf(firstDigit);
  
  // Wait for IVR to process
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  // Send the remaining digits
  response = await this.ivrTester.sendDtmf(remainingDigits);
  
  // Check if we need an additional call to process the input
  let responseText = this.ivrTester.extractTextFromResponse(response);
  if (responseText.trim() === '') {
    // Make an additional call with no input to get the response
    response = await this.ivrTester.continueCall();
  }
}
```

This algorithm splits multi-digit inputs into two separate calls and checks for blank responses.

### Blank Response Handling

The system handles blank responses using the following algorithm:

```javascript
// Extract the new prompt
currentPrompt = this.ivrTester.extractTextFromResponse(response);

// Check if we got a blank response after sending digits
if (currentPrompt.trim() === '' && /^\d{2,}$/.test(action)) {
  console.log('Blank response detected after multi-digit input. Sending empty continue...');
  
  // Send a continue call (no digits) to get the next prompt
  response = await this.ivrTester.continueCall();
  
  // Wait again for processing
  await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime));
  
  // Extract the new prompt after continue
  currentPrompt = this.ivrTester.extractTextFromResponse(response);
}
```

This algorithm checks for blank responses after multi-digit inputs and makes additional calls if needed.

## Adding New Features

### Adding a New Command-Line Option

To add a new command-line option:

1. Update the `program` configuration in the relevant script:

```javascript
program
  .option('-n, --new-option <value>', 'Description of the new option', 'default-value');
```

2. Access the option in the code:

```javascript
const options = program.opts();
const newOption = options.newOption;
```

### Adding a New IVR System

To add support for a new IVR system:

1. Create a new class that extends or adapts the IVR Flow Tester
2. Implement the required methods:
   - `startCall()`
   - `sendDtmf(digits)`
   - `continueCall()`
   - `endCall()`
   - `extractTextFromResponse(response)`
3. Update the IVR Integration to use the new class

### Modifying Action Extraction

To modify how actions are extracted from Amazon Q responses:

1. Update the `extractAction()` method in the relevant class:

```javascript
extractAction(response) {
  // Your custom extraction logic here
  return extractedAction;
}
```

## Testing

### Manual Testing

To manually test the system:

1. Run the interactive navigator:
   ```bash
   ./ivr-navigator.js
   ```

2. Enter IVR prompts and verify that Amazon Q provides appropriate actions

### Automated Testing

To run automated tests:

1. Run the automated navigator:
   ```bash
   ./ivr-auto-navigator.js
   ```

2. Verify that the simulated IVR prompts and Amazon Q responses are appropriate

### Integration Testing

To test the integration with a real IVR system:

1. Run the IVR integration test:
   ```bash
   ./run-ivr-test.js
   ```

2. Verify that the system correctly navigates the IVR system

## Debugging

### Logging

The system uses Winston for logging. To enable debug logging:

```javascript
logger.level = 'debug';
```

### Troubleshooting

If you encounter issues:

1. Check the logs in the log directory
2. Enable debug logging
3. Add console.log statements to trace the execution flow
4. Use Node.js debugging tools:
   ```bash
   node --inspect-brk ivr-navigator.js
   ```

## Best Practices

1. **Error Handling**: Always handle errors and provide meaningful error messages
2. **Logging**: Use the logger for all logging, not console.log
3. **Configuration**: Use command-line options for configuration, not hardcoded values
4. **Documentation**: Document all changes and new features
5. **Testing**: Test all changes thoroughly before committing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Submit a pull request

## Code Style

Follow these code style guidelines:

1. Use 2 spaces for indentation
2. Use camelCase for variable and function names
3. Use PascalCase for class names
4. Use UPPER_CASE for constants
5. Use single quotes for strings
6. Add JSDoc comments for all functions and classes
