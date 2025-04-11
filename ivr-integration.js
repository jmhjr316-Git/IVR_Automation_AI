/**
 * IVR Integration Module
 * 
 * This module integrates the Amazon Q Session API with the IVR Flow Tester
 * to create an AI-powered IVR navigation system.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const winston = require('winston');

// Configure logger
const logDir = './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ivr-q-integration' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class IvrIntegration {
  constructor(config = {}) {
    this.config = {
      apiUrl: 'http://localhost:8081',
      profile: 'IVR_tester',
      outputDir: './ivr_results',
      ...config
    };
    
    this.sessionId = null;
    this.ivrTester = null;
    this.history = [];
    this.currentStep = 0;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }
  
  /**
   * Set the IVR tester instance
   * @param {Object} ivrTester - IVR Flow Tester instance
   */
  setIvrTester(ivrTester) {
    this.ivrTester = ivrTester;
  }
  
  /**
   * Start a new Amazon Q session
   * @returns {string} - Session ID
   */
  async startSession() {
    try {
      console.log(chalk.yellow('Creating new Amazon Q session...'));
      logger.info('Creating new session with profile', { profile: this.config.profile });
      
      const response = await axios.post(`${this.config.apiUrl}/api/sessions`, {
        profile: this.config.profile
      });
      
      this.sessionId = response.data.sessionId;
      console.log(chalk.green(`Session created with ID: ${this.sessionId}`));
      logger.info('Session created', { sessionId: this.sessionId });
      
      return this.sessionId;
    } catch (error) {
      logger.error('Error creating session', { error: error.message });
      console.error(chalk.red('Error creating session:'), error.message);
      if (error.response) {
        console.error(chalk.red('Response data:'), error.response.data);
      }
      throw error;
    }
  }
  
  /**
   * End the current Amazon Q session
   */
  async endSession() {
    if (!this.sessionId) {
      return;
    }
    
    try {
      logger.info('Ending session', { sessionId: this.sessionId });
      console.log(chalk.yellow(`Ending session ${this.sessionId}...`));
      
      await axios.delete(`${this.config.apiUrl}/api/sessions/${this.sessionId}`);
      
      console.log(chalk.green('Session ended successfully'));
      logger.info('Session ended successfully', { sessionId: this.sessionId });
      
      // Save session history
      this.saveHistory();
      
      this.sessionId = null;
    } catch (error) {
      logger.error('Error ending session', { 
        sessionId: this.sessionId,
        error: error.message 
      });
      
      console.error(chalk.red('Error ending session:'), error.message);
    }
  }
  
  /**
   * Save session history to a file
   */
  saveHistory() {
    if (this.history.length === 0) {
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const historyFile = path.join(this.config.outputDir, `ivr-session-${timestamp}.json`);
      const reportFile = path.join(this.config.outputDir, `ivr-report-${timestamp}.md`);
      
      // Save JSON history
      fs.writeFileSync(
        historyFile,
        JSON.stringify(this.history, null, 2)
      );
      
      // Generate and save markdown report
      const report = this.generateReport();
      fs.writeFileSync(reportFile, report);
      
      console.log(chalk.green(`Session history saved to ${historyFile}`));
      console.log(chalk.green(`Session report saved to ${reportFile}`));
      logger.info('Session history saved', { 
        jsonFile: historyFile,
        reportFile: reportFile
      });
    } catch (error) {
      logger.error('Error saving history', { error: error.message });
      console.error(chalk.red('Error saving history:'), error.message);
    }
  }
  
  /**
   * Generate a human-readable report
   * @returns {string} - Markdown report
   */
  generateReport() {
    let report = '# AI-Powered IVR Navigation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Total Steps: ${this.history.length}\n\n`;
    
    this.history.forEach(entry => {
      report += `## Step ${entry.step}\n\n`;
      report += `### IVR Prompt\n\n\`\`\`\n${entry.prompt}\n\`\`\`\n\n`;
      report += `### Amazon Q Response\n\n\`\`\`\n${entry.response}\n\`\`\`\n\n`;
      report += `Action Taken: ${entry.action}\n\n`;
      
      if (entry.ivrResponse) {
        report += `### IVR Response\n\n\`\`\`\n${entry.ivrResponse}\n\`\`\`\n\n`;
      }
      
      report += `Timestamp: ${entry.timestamp}\n\n`;
      report += '---\n\n';
    });
    
    return report;
  }
  
  /**
   * Extract the recommended action from Amazon Q's response
   * @param {string} response - Amazon Q response
   * @returns {string} - Extracted action
   */
  extractAction(response) {
    // Split by newlines, trim whitespace, and filter out empty lines
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    // Get the last non-empty line
    const lastLine = lines[lines.length - 1] || '';
    
    logger.info('Extracted action', { action: lastLine });
    return lastLine;
  }
  
  /**
   * Ask Amazon Q what to do based on the current IVR prompt
   * @param {string} ivrPrompt - Text from the IVR system
   * @returns {string} - Action to take
   */
  async askAmazonQ(ivrPrompt) {
    console.log(`Asking Amazon Q about prompt: "${ivrPrompt.substring(0, 100)}${ivrPrompt.length > 100 ? '...' : ''}"`);
    
    // Start a session if we don't have one
    if (!this.sessionId) {
      await this.startSession();
    }
    
    try {
      logger.info('Sending prompt to Amazon Q', { 
        sessionId: this.sessionId, 
        prompt: ivrPrompt.substring(0, 100) + (ivrPrompt.length > 100 ? '...' : '') 
      });
      
      // Send the prompt to Amazon Q Session API
      const response = await axios.post(
        `${this.config.apiUrl}/api/sessions/${this.sessionId}/messages`,
        { message: ivrPrompt }
      );
      
      const answer = response.data.response;
      
      logger.info('Received response from Amazon Q', { 
        sessionId: this.sessionId,
        response: answer.substring(0, 100) + (answer.length > 100 ? '...' : '')
      });
      
      console.log(chalk.blue('\nAmazon Q Response:'));
      console.log(answer);
      
      // Extract the action from the response
      const action = this.extractAction(answer);
      console.log(chalk.green('\nRecommended Action:'), chalk.yellow(action));
      
      return action;
    } catch (error) {
      logger.error('Error asking Amazon Q', { 
        sessionId: this.sessionId,
        error: error.message 
      });
      
      console.error(chalk.red('Error asking Amazon Q:'), error.message);
      if (error.response) {
        console.error(chalk.red('Response data:'), error.response.data);
      }
      throw error;
    }
  }
  
  /**
   * Run an automated IVR navigation session
   * @param {string} testName - Name for the test session
   * @returns {Object} - Test results
   */
  async runAutomatedNavigation(testName = 'AI_IVR_Test') {
    if (!this.ivrTester) {
      throw new Error('IVR tester not set. Call setIvrTester() first.');
    }
    
    console.log(chalk.blue('Starting automated IVR navigation'));
    logger.info('Starting automated navigation', { testName });
    
    try {
      // Start a new session with Amazon Q
      await this.startSession();
      
      // Start a new call with the IVR system
      console.log(chalk.yellow('Starting call to IVR system...'));
      const initialResponse = await this.ivrTester.startCall(testName);
      
      // Wait for greeting to finish
      await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime));
      
      // Extract the initial prompt
      let currentPrompt = this.ivrTester.extractTextFromResponse(initialResponse);
      let testCompleted = false;
      this.currentStep = 0;
      
      // Main navigation loop
      while (!testCompleted) {
        this.currentStep++;
        console.log(`\n=== Step ${this.currentStep} ===`);
        console.log(`Current IVR prompt: "${currentPrompt.substring(0, 100)}${currentPrompt.length > 100 ? '...' : ''}"`);
        
        // Ask Amazon Q what to do
        const action = await this.askAmazonQ(currentPrompt);
        
        // Record the step
        const historyEntry = {
          step: this.currentStep,
          prompt: currentPrompt,
          response: action,
          action: action,
          timestamp: new Date().toISOString()
        };
        
        // Check if we should hang up
        if (action.toLowerCase() === 'hang up') {
          console.log('Amazon Q says to hang up - ending call');
          await this.ivrTester.endCall();
          testCompleted = true;
          historyEntry.ivrResponse = 'Call ended';
          this.history.push(historyEntry);
          break;
        }
        
        // Send the action to the IVR
        console.log(`Sending to IVR: ${action}`);
        let response;
        
        // Handle different types of actions
        if (/^\d+$/.test(action) || action === '*' || action === '#') {
          // If action is digits or special characters, send as DTMF
          
          // Check if this is a multi-digit input that needs to be split
          if (/^\d{2,}$/.test(action)) {
            // For multi-digit inputs, we need to split them
            // First digit goes in first call, remaining digits in second call
            const firstDigit = action.charAt(0);
            const remainingDigits = action.substring(1);
            
            console.log(`Multi-digit input detected: ${action}`);
            console.log(`Sending first digit: ${firstDigit}`);
            
            // Send the first digit
            response = await this.ivrTester.sendDtmf(firstDigit);
            
            // Wait for IVR to process
            await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime / 2));
            
            console.log(`Sending remaining digits: ${remainingDigits}`);
            
            // Send the remaining digits
            response = await this.ivrTester.sendDtmf(remainingDigits);
            
            // Check if we need an additional call to process the input
            let responseText = this.ivrTester.extractTextFromResponse(response);
            if (responseText.trim() === '') {
              console.log('No immediate response after sending digits. Making additional call...');
              
              // Wait a moment
              await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime / 2));
              
              // Make an additional call with no input to get the response
              response = await this.ivrTester.continueCall();
            }
            
            // Log the split operation
            logger.info('Split multi-digit input', { 
              firstDigit, 
              remainingDigits,
              fullInput: action
            });
          } else {
            // Single digit, send as is
            response = await this.ivrTester.sendDtmf(action);
          }
        } else {
          // For now, we only support DTMF
          console.log(`Warning: Non-DTMF action "${action}" - treating as DTMF`);
          
          // Check if the non-DTMF action contains digits we can extract
          const digitMatch = action.match(/\d+/);
          if (digitMatch) {
            const digits = digitMatch[0];
            console.log(`Extracted digits from action: ${digits}`);
            
            // Handle multi-digit input
            if (digits.length > 1) {
              const firstDigit = digits.charAt(0);
              const remainingDigits = digits.substring(1);
              
              console.log(`Sending first digit: ${firstDigit}`);
              response = await this.ivrTester.sendDtmf(firstDigit);
              
              // Wait for IVR to process
              await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime / 2));
              
              console.log(`Sending remaining digits: ${remainingDigits}`);
              response = await this.ivrTester.sendDtmf(remainingDigits);
              
              // Check if we need an additional call to process the input
              let responseText = this.ivrTester.extractTextFromResponse(response);
              if (responseText.trim() === '') {
                console.log('No immediate response after sending digits. Making additional call...');
                
                // Wait a moment
                await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime / 2));
                
                // Make an additional call with no input to get the response
                response = await this.ivrTester.continueCall();
              }
            } else {
              response = await this.ivrTester.sendDtmf(digits);
            }
          } else {
            // No digits found, try to send the first character
            response = await this.ivrTester.sendDtmf(action.charAt(0));
          }
        }
        
        // Wait for IVR to process
        await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime));
        
        // Extract the new prompt
        currentPrompt = this.ivrTester.extractTextFromResponse(response);
        
        // Check if we got a blank response after sending digits
        // This can happen with multi-digit inputs where the IVR needs an additional prompt
        if (currentPrompt.trim() === '' && /^\d{2,}$/.test(action)) {
          console.log('Blank response detected after multi-digit input. Sending empty continue...');
          
          // Send a continue call (no digits) to get the next prompt
          response = await this.ivrTester.continueCall();
          
          // Wait again for processing
          await new Promise(resolve => setTimeout(resolve, this.ivrTester.config.defaultWaitTime));
          
          // Extract the new prompt after continue
          currentPrompt = this.ivrTester.extractTextFromResponse(response);
          console.log(`New prompt after continue: "${currentPrompt.substring(0, 100)}${currentPrompt.length > 100 ? '...' : ''}"`);
        }
        
        historyEntry.ivrResponse = currentPrompt;
        this.history.push(historyEntry);
        
        // Safety check - limit the number of steps
        if (this.currentStep >= 20) {
          console.log('Maximum steps reached - ending test');
          await this.ivrTester.endCall();
          testCompleted = true;
          break;
        }
      }
      
      console.log('\n=== Test Summary ===');
      console.log(`Steps completed: ${this.currentStep}`);
      
      // End the Amazon Q session
      await this.endSession();
      
      return {
        success: true,
        steps: this.currentStep,
        history: this.history
      };
      
    } catch (error) {
      logger.error('Error in automated navigation', { error: error.message });
      console.error(chalk.red('\nError during automated navigation:'), error.message);
      
      // Try to clean up
      try {
        if (this.ivrTester && this.ivrTester.callActive) {
          await this.ivrTester.endCall();
        }
      } catch (endError) {
        logger.error('Error ending IVR call', { error: endError.message });
      }
      
      try {
        await this.endSession();
      } catch (endError) {
        logger.error('Error ending Amazon Q session', { error: endError.message });
      }
      
      return {
        success: false,
        error: error.message,
        steps: this.currentStep,
        history: this.history
      };
    }
  }
}

module.exports = IvrIntegration;
