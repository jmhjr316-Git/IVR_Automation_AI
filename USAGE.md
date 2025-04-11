# IVR Automation AI - Usage Guide

This document provides detailed instructions on how to use the IVR Automation AI system for various scenarios.

## Getting Started

Before using the system, ensure you have:

1. Node.js (v14 or higher) installed
2. Amazon Q Session API running at http://localhost:8081
3. Amazon Q CLI configured with an IVR_tester profile
4. Access to an IVR system for testing

## Basic Usage

### Interactive Mode

The interactive mode allows you to manually enter IVR prompts and get recommended actions from Amazon Q.

```bash
./ivr-navigator.js
```

This will:
1. Start a new Amazon Q session
2. Prompt you to enter an IVR prompt
3. Send the prompt to Amazon Q
4. Display the recommended action
5. Allow you to continue with more prompts or end the session

#### Example Session:

```
=== IVR Navigator ===

Starting new Amazon Q session...
Session created with ID: 12345678-1234-1234-1234-123456789012

Enter IVR prompt: Welcome to our pharmacy system. Press 1 to refill a prescription, press 2 to check status, press 3 to speak to a pharmacist.

Sending prompt to Amazon Q...

Amazon Q Response:
I'll help you navigate this IVR system.

Based on the options provided, you can:
- Press 1 to refill a prescription
- Press 2 to check the status of a prescription
- Press 3 to speak with a pharmacist

Since you want to refill a prescription, you should:

1

Recommended Action: 1

Enter IVR prompt: Please enter your prescription number followed by the pound key.

Sending prompt to Amazon Q...

Amazon Q Response:
You need to enter your prescription number followed by the pound key.

If your prescription number is 9009400, you would enter:
9009400#

Recommended Action: 9009400#

Enter IVR prompt: Thank you. Your prescription will be ready for pickup in 24 hours. Press 1 to hear this again, press 2 to return to the main menu, or press 9 to end the call.

Sending prompt to Amazon Q...

Amazon Q Response:
Your prescription refill has been processed and will be ready for pickup in 24 hours.

You have these options:
- Press 1 to hear this information again
- Press 2 to return to the main menu
- Press 9 to end the call

Since you've completed your task of refilling a prescription, you should:

9

Recommended Action: 9

Enter IVR prompt: Thank you for calling. Goodbye.

Sending prompt to Amazon Q...

Amazon Q Response:
The call is ending. You don't need to press anything else.

Hang Up

Recommended Action: Hang Up

End session? (y/n): y

Ending session...
Session ended successfully
Session history saved to ./logs/ivr-session-2025-04-11T16-45-32.123Z.json
Session report saved to ./logs/ivr-report-2025-04-11T16-45-32.123Z.md
```

### Automated Mode

The automated mode simulates IVR prompts and gets responses from Amazon Q.

```bash
./ivr-auto-navigator.js
```

This will:
1. Start a new Amazon Q session
2. Simulate an initial IVR prompt
3. Send the prompt to Amazon Q
4. Extract the recommended action
5. Simulate the next IVR prompt based on the action
6. Repeat until completion or maximum steps reached

#### Example Output:

```
=== Automated IVR Navigator ===

Starting new Amazon Q session...
Session created with ID: 12345678-1234-1234-1234-123456789012

=== Step 1 ===
Simulated IVR prompt: Welcome to our pharmacy system. Press 1 to refill a prescription, press 2 to check status, press 3 to speak to a pharmacist.

Sending prompt to Amazon Q...

Amazon Q Response:
I'll help you navigate this IVR system.

Based on the options provided, you can:
- Press 1 to refill a prescription
- Press 2 to check the status of a prescription
- Press 3 to speak with a pharmacist

Since you want to refill a prescription, you should:

1

Recommended Action: 1

=== Step 2 ===
Simulated IVR prompt: Please enter your prescription number followed by the pound key.

Sending prompt to Amazon Q...

Amazon Q Response:
You need to enter your prescription number followed by the pound key.

If your prescription number is 9009400, you would enter:
9009400#

Recommended Action: 9009400#

=== Step 3 ===
Simulated IVR prompt: Thank you. Your prescription will be ready for pickup in 24 hours. Press 1 to hear this again, press 2 to return to the main menu, or press 9 to end the call.

Sending prompt to Amazon Q...

Amazon Q Response:
Your prescription refill has been processed and will be ready for pickup in 24 hours.

You have these options:
- Press 1 to hear this information again
- Press 2 to return to the main menu
- Press 9 to end the call

Since you've completed your task of refilling a prescription, you should:

9

Recommended Action: 9

=== Step 4 ===
Simulated IVR prompt: Thank you for calling. Goodbye.

Sending prompt to Amazon Q...

Amazon Q Response:
The call is ending. You don't need to press anything else.

Hang Up

Recommended Action: Hang Up

=== Test Summary ===
Steps completed: 4
Session ended successfully
Session history saved to ./logs/ivr-session-2025-04-11T16-50-45.678Z.json
Session report saved to ./logs/ivr-report-2025-04-11T16-50-45.678Z.md
```

### IVR Integration Mode

The IVR integration mode connects to a real IVR system and uses Amazon Q to navigate it.

```bash
./run-ivr-test.js
```

This will:
1. Start a new Amazon Q session
2. Connect to the IVR system
3. Capture the initial IVR prompt
4. Send the prompt to Amazon Q
5. Extract the recommended action
6. Send the action to the IVR system
7. Repeat until completion or maximum steps reached

#### Example Output:

```
AI-Powered IVR Test Runner
=========================
Amazon Q Session API URL: http://localhost:8081
Using profile: IVR_tester
Output directory: ./ivr_results
IVR system URL: https://inbound-ivr-bot-text.pc.q.platform.enlivenhealth.co
Wait time: 2000 ms

Starting automated IVR test: AI_IVR_Test
Starting automated IVR navigation
Creating new Amazon Q session...
Session created with ID: 12345678-1234-1234-1234-123456789012
Starting call to IVR system...
Call started successfully

=== Step 1 ===
Current IVR prompt: "Welcome to our pharmacy system. Press 1 to refill a prescription, press 2 to check status, press 3 to speak to a pharmacist."
Asking Amazon Q about prompt: "Welcome to our pharmacy system. Press 1 to refill a prescription, press 2 to check status, press 3 to speak to a pharmacist."

Amazon Q Response:
I'll help you navigate this IVR system.

Based on the options provided, you can:
- Press 1 to refill a prescription
- Press 2 to check the status of a prescription
- Press 3 to speak with a pharmacist

Since you want to refill a prescription, you should:

1

Recommended Action: 1

Sending to IVR: 1
DTMF 1 sent successfully

=== Step 2 ===
Current IVR prompt: "Please enter your prescription number followed by the pound key."
Asking Amazon Q about prompt: "Please enter your prescription number followed by the pound key."

Amazon Q Response:
You need to enter your prescription number followed by the pound key.

If your prescription number is 9009400, you would enter:
9009400#

Recommended Action: 9009400#

Sending to IVR: 9009400#
Multi-digit input detected: 9009400#
Sending first digit: 9
DTMF 9 sent successfully
Sending remaining digits: 009400#
DTMF 009400# sent successfully
No immediate response after sending digits. Making additional call...
Call continued successfully

=== Step 3 ===
Current IVR prompt: "Thank you. Your prescription will be ready for pickup in 24 hours. Press 1 to hear this again, press 2 to return to the main menu, or press 9 to end the call."
Asking Amazon Q about prompt: "Thank you. Your prescription will be ready for pickup in 24 hours. Press 1 to hear this again, press 2 to return to the main menu, or press 9 to end the call."

Amazon Q Response:
Your prescription refill has been processed and will be ready for pickup in 24 hours.

You have these options:
- Press 1 to hear this information again
- Press 2 to return to the main menu
- Press 9 to end the call

Since you've completed your task of refilling a prescription, you should:

9

Recommended Action: 9

Sending to IVR: 9
DTMF 9 sent successfully

=== Step 4 ===
Current IVR prompt: "Thank you for calling. Goodbye."
Asking Amazon Q about prompt: "Thank you for calling. Goodbye."

Amazon Q Response:
The call is ending. You don't need to press anything else.

Hang Up

Recommended Action: Hang Up

Amazon Q says to hang up - ending call
Call ended successfully

=== Test Summary ===
Steps completed: 4

Test completed successfully!
Completed 4 steps

Results saved to: ./ivr_results
```

## Advanced Usage

### Custom IVR System

To use a custom IVR system:

```bash
./run-ivr-test.js --ivr https://your-ivr-url --from 1234567890 --to 0987654321
```

### Custom Wait Time

To adjust the wait time between steps:

```bash
./run-ivr-test.js --wait 3000
```

### Custom Test Name

To specify a custom test name:

```bash
./run-ivr-test.js --name RefillPrescription
```

### Custom Output Directory

To specify a custom output directory:

```bash
./run-ivr-test.js --output ./custom_results
```

## Handling Multi-Digit Inputs

The system automatically handles multi-digit inputs by:

1. Detecting multi-digit inputs (2 or more digits)
2. Sending the first digit in one call
3. Waiting briefly for the IVR to process
4. Sending the remaining digits in a second call
5. Checking for blank responses and making additional calls if needed

This approach is necessary because many IVR systems require this pattern for multi-digit inputs.

## Handling Blank Responses

The system includes specialized handling for blank responses after multi-digit inputs:

1. After sending the remaining digits, it checks if the response is blank
2. If blank, it makes an additional call with no input to get the next prompt
3. After the standard wait time, it checks again if the response is still blank
4. If still blank, it makes another additional call

This ensures that no IVR prompts are missed during navigation.

## Interpreting Results

After running a test, the system generates:

1. **JSON History**: Complete session history in JSON format
2. **Markdown Report**: Human-readable report of the navigation session
3. **Log Files**: Detailed logs for debugging and analysis

### Example Report:

```markdown
# AI-Powered IVR Navigation Report

Generated: 2025-04-11T16:55:12.345Z

Total Steps: 4

## Step 1

### IVR Prompt

```
Welcome to our pharmacy system. Press 1 to refill a prescription, press 2 to check status, press 3 to speak to a pharmacist.
```

### Amazon Q Response

```
I'll help you navigate this IVR system.

Based on the options provided, you can:
- Press 1 to refill a prescription
- Press 2 to check the status of a prescription
- Press 3 to speak with a pharmacist

Since you want to refill a prescription, you should:

1
```

Action Taken: 1

### IVR Response

```
Please enter your prescription number followed by the pound key.
```

Timestamp: 2025-04-11T16:55:12.345Z

---

## Step 2

...
```

## Troubleshooting

### Blank Responses

If the IVR system doesn't respond after multi-digit inputs:

1. Increase the wait time: `--wait 3000`
2. Check the IVR system URL
3. Verify that the IVR system is accepting DTMF tones

### Connection Issues

If you can't connect to the IVR system:

1. Check that the IVR system URL is correct
2. Verify that the IVR system is accessible
3. Check the network connectivity

### Amazon Q Issues

If you encounter issues with Amazon Q:

1. Ensure the Amazon Q Session API is running at the specified URL
2. Verify that the IVR_tester profile is properly configured
3. Check the logs for detailed error information
