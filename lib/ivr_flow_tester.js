/**
 * IVR Flow Tester
 * 
 * This module provides functionality to test specific IVR flows
 * with multi-digit inputs and detailed state tracking.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const xml2js = require('xml2js');
const fs = require('fs');
const { FixedIvrStateTracker, IVR_STATES } = require('./ivr_state_tracker_fixed');

class IvrFlowTester {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      baseUrl: 'https://inbound-ivr-bot-text.pc.q.platform.enlivenhealth.co',
      from: '7249143802',
      to: '9193736940',
      defaultWaitTime: 2000,
      debug: true,
      logToFile: true,
      logFile: 'ivr_flow_tester.log',
      outputDir: './ivr_test_results',
      // Default test values
      testRxNumber: '9009400',
      testDob: '01011970', // MMDDYYYY format
      acceptAll: false, // Whether to accept all prompts automatically
      ...config
    };
    
    // Initialize components
    this.stateTracker = new FixedIvrStateTracker(this.log.bind(this));
    this.parser = new xml2js.Parser({ explicitArray: false });
    
    // Initialize session variables
    this.sid = null;
    this.lastResponse = null;
    this.callActive = false;
    this.testResults = {};
    this.currentFlow = null;
    this.flowSteps = [];
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
    
    // Initialize log file
    if (this.config.logToFile) {
      fs.writeFileSync(this.config.logFile, `=== IVR Flow Tester Session Started at ${new Date().toISOString()} ===\n\n`);
    }
  }

  /**
   * Log a message
   * @param {string} message - Message to log
   * @param {any} data - Optional data to log
   * @param {string} level - Log level
   */
  log(message, data = null, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warn' ? '⚠️ WARNING: ' : '✅ ';
    const formattedMessage = `[${timestamp}] ${prefix}${message}`;
    
    if (this.config.debug || level === 'error' || level === 'warn') {
      console.log(formattedMessage);
      if (data) {
        if (typeof data === 'string') {
          console.log(data);
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      }
    }
    
    if (this.config.logToFile) {
      let logEntry = formattedMessage + '\n';
      if (data) {
        logEntry += typeof data === 'string' ? data + '\n' : JSON.stringify(data, null, 2) + '\n';
      }
      fs.appendFileSync(this.config.logFile, logEntry + '\n');
    }
    
    // Record step in flow
    if (this.currentFlow && level !== 'error') {
      this.flowSteps.push({
        timestamp,
        message,
        data: data || '',
        state: this.stateTracker.getState()
      });
    }
  }

  /**
   * Parse XML response
   * @param {string} xmlData - XML data to parse
   * @returns {Object} - Parsed response
   */
  async parseXmlResponse(xmlData) {
    try {
      const result = await this.parser.parseStringPromise(xmlData);
      return result;
    } catch (error) {
      this.log(`Error parsing XML: ${error.message}`, xmlData, 'error');
      return null;
    }
  }

  /**
   * Extract text from response
   * @param {Object} response - Parsed XML response
   * @returns {string} - Extracted text
   */
  extractTextFromResponse(response) {
    if (!response || !response.Response) {
      return '';
    }
    
    let text = '';
    const resp = response.Response;
    
    // Extract from Say elements
    if (resp.Say) {
      if (Array.isArray(resp.Say)) {
        text += resp.Say.map(s => typeof s === 'string' ? s : '').join(' ');
      } else if (typeof resp.Say === 'string') {
        text += resp.Say;
      }
    }
    
    // Extract from Gather.Say elements
    if (resp.Gather && resp.Gather.Say) {
      if (Array.isArray(resp.Gather.Say)) {
        text += resp.Gather.Say.map(s => typeof s === 'string' ? s : '').join(' ');
      } else if (typeof resp.Gather.Say === 'string') {
        text += resp.Gather.Say;
      }
    }
    
    return text;
  }

  /**
   * Start a new call
   * @param {string} testName - Name of the test
   * @returns {Object} - Response from IVR
   */
  async startCall(testName = 'FlowTest') {
    this.sid = `${testName}_${uuidv4().substring(0, 8)}`;
    this.log(`Starting call with SID: ${this.sid}`);
    
    try {
      const response = await axios({
        method: 'post',
        url: `${this.config.baseUrl}/twilio/v1/voice`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          CallSid: this.sid,
          CallStatus: 'in-progress',
          From: this.config.from,
          To: this.config.to
        }
      });
      
      this.log('Call started successfully');
      
      // Log raw XML for debugging
      if (this.config.logToFile) {
        fs.appendFileSync(this.config.logFile, '--- RAW XML RESPONSE ---\n' + response.data + '\n----------------------\n\n');
      }
      
      const parsedResponse = await this.parseXmlResponse(response.data);
      this.lastResponse = parsedResponse;
      
      // Extract text and update state
      const responseText = this.extractTextFromResponse(parsedResponse);
      this.stateTracker.updateState(responseText);
      
      this.callActive = true;
      
      return parsedResponse;
    } catch (error) {
      this.log(`Error starting call: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  }

  /**
   * Send DTMF tones - supports multi-digit input
   * @param {string} digits - DTMF digits to send
   * @returns {Object} - Response from IVR
   */
  async sendDtmf(digits) {
    if (!this.callActive || !this.sid) {
      this.log('Cannot send DTMF: No active call', null, 'error');
      throw new Error('No active call');
    }
    
    this.log(`Sending DTMF: ${digits}`);
    
    try {
      const response = await axios({
        method: 'post',
        url: `${this.config.baseUrl}/twilio/v1/voice`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          CallSid: this.sid,
          CallStatus: 'in-progress',
          Digits: digits,
          From: this.config.from,
          To: this.config.to
        }
      });
      
      this.log(`DTMF ${digits} sent successfully`);
      
      // Log raw XML for debugging
      if (this.config.logToFile) {
        fs.appendFileSync(this.config.logFile, '--- RAW XML RESPONSE ---\n' + response.data + '\n----------------------\n\n');
      }
      
      const parsedResponse = await this.parseXmlResponse(response.data);
      this.lastResponse = parsedResponse;
      
      // Extract text and update state
      const responseText = this.extractTextFromResponse(parsedResponse);
      const newState = this.stateTracker.updateState(responseText);
      
      return parsedResponse;
    } catch (error) {
      this.log(`Error sending DTMF ${digits}: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  }

  /**
   * Continue call without input
   * @returns {Object} - Response from IVR
   */
  async continueCall() {
    if (!this.callActive || !this.sid) {
      this.log('Cannot continue call: No active call', null, 'error');
      throw new Error('No active call');
    }
    
    this.log('Continuing call without input');
    
    try {
      const response = await axios({
        method: 'post',
        url: `${this.config.baseUrl}/twilio/v1/voice`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          CallSid: this.sid,
          CallStatus: 'in-progress',
          From: this.config.from,
          To: this.config.to
        }
      });
      
      this.log('Call continued successfully');
      
      // Log raw XML for debugging
      if (this.config.logToFile) {
        fs.appendFileSync(this.config.logFile, '--- RAW XML RESPONSE ---\n' + response.data + '\n----------------------\n\n');
      }
      
      const parsedResponse = await this.parseXmlResponse(response.data);
      this.lastResponse = parsedResponse;
      
      // Extract text and update state
      const responseText = this.extractTextFromResponse(parsedResponse);
      this.stateTracker.updateState(responseText);
      
      return parsedResponse;
    } catch (error) {
      this.log(`Error continuing call: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  }

  /**
   * End the call
   * @returns {Object} - Response from IVR
   */
  async endCall() {
    if (!this.sid) {
      this.log('Cannot end call: No SID', null, 'error');
      throw new Error('No SID');
    }
    
    this.log(`Ending call with SID: ${this.sid}`);
    
    try {
      const response = await axios({
        method: 'post',
        url: `${this.config.baseUrl}/twilio/v1/voice/status`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          CallSid: this.sid,
          CallStatus: 'completed',
          From: this.config.from,
          To: this.config.to
        }
      });
      
      this.log('Call ended successfully');
      
      // Log raw XML for debugging
      if (this.config.logToFile) {
        fs.appendFileSync(this.config.logFile, '--- RAW XML RESPONSE ---\n' + response.data + '\n----------------------\n\n');
      }
      
      const parsedResponse = await this.parseXmlResponse(response.data);
      this.callActive = false;
      
      return parsedResponse;
    } catch (error) {
      this.log(`Error ending call: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  }

  /**
   * Test the refill prescription flow
   * @param {string} rxNumber - Prescription number to use
   * @returns {boolean} - Success status
   */
  async testRefillPrescription(rxNumber = null) {
    const testRx = rxNumber || this.config.testRxNumber;
    this.currentFlow = 'refill_prescription';
    this.flowSteps = [];
    
    this.log(`Testing refill prescription flow with RX #${testRx}`);
    
    try {
      // Start a new call
      await this.startCall(`RefillRx_${testRx}`);
      
      // Wait for greeting to finish
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Continue to main menu
      await this.continueCall();
      
      // Press 1 to refill a prescription
      await this.sendDtmf('1');
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Enter the prescription number
      this.log(`Entering prescription number: ${testRx}`);
      await this.sendDtmf(testRx);
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Check if we need to confirm
      const responseText = this.extractTextFromResponse(this.lastResponse);
      if (responseText.toLowerCase().includes('confirm') || responseText.toLowerCase().includes('is this correct')) {
        // Press 1 to confirm
        this.log('Confirming prescription number');
        await this.sendDtmf('1');
        await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      }
      
      // Continue with any additional steps
      await this.continueCall();
      
      // End the call
      await this.endCall();
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: true,
        rxNumber: testRx,
        steps: this.flowSteps,
        finalState: this.stateTracker.getState()
      };
      
      this.log(`Refill prescription test completed successfully`);
      return true;
    } catch (error) {
      this.log(`Refill prescription test failed: ${error.message}`, error, 'error');
      
      // Try to end the call if it's still active
      if (this.callActive) {
        try {
          await this.endCall();
        } catch (endError) {
          this.log(`Error ending call after failure: ${endError.message}`, null, 'error');
        }
      }
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: false,
        rxNumber: testRx,
        steps: this.flowSteps,
        error: error.message,
        finalState: this.stateTracker.getState()
      };
      
      return false;
    }
  }

  /**
   * Test the check status flow
   * @param {string} rxNumber - Prescription number to use
   * @returns {boolean} - Success status
   */
  async testCheckStatus(rxNumber = null) {
    const testRx = rxNumber || this.config.testRxNumber;
    this.currentFlow = 'check_status';
    this.flowSteps = [];
    
    this.log(`Testing check status flow with RX #${testRx}`);
    
    try {
      // Start a new call
      await this.startCall(`CheckStatus_${testRx}`);
      
      // Wait for greeting to finish
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Continue to main menu
      await this.continueCall();
      
      // Press 2 to check status
      await this.sendDtmf('2');
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Enter the prescription number
      this.log(`Entering prescription number: ${testRx}`);
      await this.sendDtmf(testRx);
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Check if we need to confirm
      const responseText = this.extractTextFromResponse(this.lastResponse);
      if (responseText.toLowerCase().includes('confirm') || responseText.toLowerCase().includes('is this correct')) {
        // Press 1 to confirm
        this.log('Confirming prescription number');
        await this.sendDtmf('1');
        await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      }
      
      // Continue with any additional steps
      await this.continueCall();
      
      // End the call
      await this.endCall();
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: true,
        rxNumber: testRx,
        steps: this.flowSteps,
        finalState: this.stateTracker.getState()
      };
      
      this.log(`Check status test completed successfully`);
      return true;
    } catch (error) {
      this.log(`Check status test failed: ${error.message}`, error, 'error');
      
      // Try to end the call if it's still active
      if (this.callActive) {
        try {
          await this.endCall();
        } catch (endError) {
          this.log(`Error ending call after failure: ${endError.message}`, null, 'error');
        }
      }
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: false,
        rxNumber: testRx,
        steps: this.flowSteps,
        error: error.message,
        finalState: this.stateTracker.getState()
      };
      
      return false;
    }
  }

  /**
   * Test the pharmacy hours flow
   * @returns {boolean} - Success status
   */
  async testPharmacyHours() {
    this.currentFlow = 'pharmacy_hours';
    this.flowSteps = [];
    
    this.log('Testing pharmacy hours flow');
    
    try {
      // Start a new call
      await this.startCall('PharmacyHours');
      
      // Wait for greeting to finish
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Continue to main menu
      await this.continueCall();
      
      // Press 4 for pharmacy hours
      await this.sendDtmf('4');
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Press 1 for weekly hours
      this.log('Selecting weekly hours');
      await this.sendDtmf('1');
      await new Promise(resolve => setTimeout(resolve, this.config.defaultWaitTime));
      
      // Continue with any additional steps
      await this.continueCall();
      
      // End the call
      await this.endCall();
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: true,
        steps: this.flowSteps,
        finalState: this.stateTracker.getState()
      };
      
      this.log(`Pharmacy hours test completed successfully`);
      return true;
    } catch (error) {
      this.log(`Pharmacy hours test failed: ${error.message}`, error, 'error');
      
      // Try to end the call if it's still active
      if (this.callActive) {
        try {
          await this.endCall();
        } catch (endError) {
          this.log(`Error ending call after failure: ${endError.message}`, null, 'error');
        }
      }
      
      // Save test results
      this.testResults[this.currentFlow] = {
        success: false,
        steps: this.flowSteps,
        error: error.message,
        finalState: this.stateTracker.getState()
      };
      
      return false;
    }
  }

  /**
   * Run all tests
   * @returns {Object} - Test results
   */
  async runAllTests() {
    this.log('Running all IVR flow tests');
    
    await this.testRefillPrescription();
    await this.testCheckStatus();
    await this.testPharmacyHours();
    
    // Save test results
    const resultsPath = `${this.config.outputDir}/test_results.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate report
    const report = this.generateReport();
    const reportPath = `${this.config.outputDir}/test_report.md`;
    fs.writeFileSync(reportPath, report);
    
    this.log(`All tests completed. Results saved to ${resultsPath}`);
    
    return this.testResults;
  }

  /**
   * Generate a human-readable report of the test results
   * @returns {string} - Report text
   */
  generateReport() {
    let report = '# IVR Flow Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Summary
    report += '## Test Summary\n\n';
    report += '| Flow | Status | Final State |\n';
    report += '|------|--------|-------------|\n';
    
    Object.entries(this.testResults).forEach(([flow, result]) => {
      const status = result.success ? '✅ Success' : '❌ Failed';
      report += `| ${flow} | ${status} | ${result.finalState} |\n`;
    });
    
    // Details
    report += '\n## Test Details\n\n';
    
    Object.entries(this.testResults).forEach(([flow, result]) => {
      report += `### ${flow}\n\n`;
      report += `Status: ${result.success ? '✅ Success' : '❌ Failed'}\n`;
      report += `Final State: ${result.finalState}\n`;
      
      if (result.rxNumber) {
        report += `RX Number: ${result.rxNumber}\n`;
      }
      
      if (result.error) {
        report += `Error: ${result.error}\n`;
      }
      
      report += '\n#### Steps\n\n';
      result.steps.forEach((step, index) => {
        report += `${index + 1}. [${step.state}] ${step.message}\n`;
        if (step.data && typeof step.data === 'string' && step.data.length > 0) {
          report += `   ${step.data}\n`;
        }
      });
      
      report += '\n';
    });
    
    return report;
  }
}

module.exports = IvrFlowTester;
