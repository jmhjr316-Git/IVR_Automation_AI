# IVR Automation AI - Dependencies

This document outlines the dependencies of the IVR Automation AI project, including both internal and external dependencies.

## Internal Dependencies

These are the Node.js packages that the project depends on:

| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.8.4 | HTTP client for making requests to Amazon Q Session API and IVR systems |
| chalk | ^4.1.2 | Terminal string styling for colorized console output |
| commander | ^11.1.0 | Command-line interface solution for parsing arguments |
| figlet | ^1.7.0 | ASCII art text generation for CLI headers |
| inquirer | ^8.2.6 | Interactive command-line user interfaces |
| uuid | ^9.0.1 | Generation of unique identifiers for sessions |
| winston | ^3.11.0 | Logging library for comprehensive logging |
| xml2js | ^0.6.2 | XML parsing for IVR system responses |

## External Dependencies

These are external components that the project depends on:

### IVR Flow Tester

**Source Location**: `/home/j15558/Tests/IVR/Crawler/ivr_flow_tester.js`

**Purpose**: Manages the actual IVR calls and responses.

**Key Features**:
- Initiates calls to IVR systems
- Sends DTMF tones
- Parses XML responses
- Extracts text from responses
- Tracks IVR state

**Integration Point**: Used by `ivr-integration.js` to interact with the IVR system.

### IVR State Tracker

**Source Location**: `/home/j15558/Tests/IVR/Crawler/ivr_state_tracker_fixed.js`

**Purpose**: Tracks the state of the IVR system during navigation.

**Key Features**:
- Identifies IVR states based on response text
- Tracks state transitions
- Provides appropriate inputs for each state
- Generates state transition diagrams

**Integration Point**: Used by the IVR Flow Tester to track IVR state.

## Dependency Management

### Current Approach

Currently, the project references the external dependencies from their original locations. This approach has the following characteristics:

**Pros**:
- No duplication of code
- Always uses the latest version of the external components
- Changes to the external components are immediately reflected

**Cons**:
- Depends on the external components being available at the specified locations
- Changes to the external components may break the integration
- Difficult to version control the external components

### Future Approach

For better maintainability and portability, we recommend the following approach:

1. **Extract and Integrate**: Extract the necessary code from the external dependencies and integrate it directly into this project.

2. **Modularize**: Refactor the integrated code into well-defined modules with clear interfaces.

3. **Version Control**: Keep the integrated code under version control within this project.

4. **Document**: Document the integration points and any modifications made to the original code.

## Installation Instructions

To install all dependencies:

```bash
npm install
```

To verify that all dependencies are correctly installed:

```bash
npm list --depth=0
```

## Troubleshooting

If you encounter issues with dependencies:

1. **Missing Dependencies**: Run `npm install` to install all dependencies.

2. **Version Conflicts**: Check the package.json file for the correct versions and run `npm install <package>@<version>` to install a specific version.

3. **External Dependencies**: Ensure that the external dependencies are available at the specified locations.

4. **Path Issues**: If the paths to the external dependencies are incorrect, update them in the code.

## Updating Dependencies

To update dependencies:

```bash
npm update
```

To update a specific dependency:

```bash
npm update <package>
```

Always test thoroughly after updating dependencies to ensure compatibility.
