#!/usr/bin/env node

/**
 * Automated IVR Navigator using Amazon Q Session API
 * 
 * This tool automatically navigates an IVR system by:
 * 1. Connecting to the IVR system
 * 2. Capturing the IVR prompt
 * 3. Sending the prompt to Amazon Q
 * 4. Sending the recommended action back to the IVR
 * 5. Repeating until completion
 */

const axios = require('axios');
const chalk = require('chalk');
const { program } = require('commander');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configure command line options
program
  .version('1.0.0')
  .option('-u, --url <url>', 'Amazon Q Session API URL', 'http://localhost:8081')
  .option('-p, --profile <profile>', 'Amazon Q profile to use', 'IVR_tester')
  .option('-l, --log-dir <directory>', 'Directory for logs', './logs')
  .option('-c, --call <number>', 'Phone number to call', '')
  .option('-m, --max-steps <number>', 'Maximum number of steps', '20')
  .option('-w, --wait-time <ms>', 'Wait time between steps (ms)', '2000')
  .parse(process.argv);

const options = program.opts();

// Configure logger
const logDir = options.logDir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ivr-auto-navigator' },
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

// Main class for IVR navigation
class IvrAutoNavigator {
  constructor(config = {}) {
    this.config = {
      apiUrl: options.url,
      profile: options.profile,
      maxSteps: parseInt(options.maxSteps),
      waitTime: parseInt(options.waitTime),
      ...config
    };
    
    this.sessionId = null;
    this.history = [];
    this.currentStep = 0;
  }
  
  // Create a new session
  async createSession() {
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
  
  // Send a message to the session
  async sendMessage(message) {
    if (!this.sessionId) {
      await this.createSession();
    }
    
    try {
      logger.info('Sending message to session', { 
        sessionId: this.sessionId, 
        message: message.substring(0, 100) + (message.length > 100 ? '...' : '') 
      });
      
      const response = await axios.post(
        `${this.config.apiUrl}/api/sessions/${this.sessionId}/messages`,
        { message }
      );
      
      const answer = response.data.response;
      
      // Add to history
      this.history.push({
        step: ++this.currentStep,
        prompt: message,
        response: answer,
        timestamp: new Date().toISOString()
      });
      
      logger.info('Received response', { 
        sessionId: this.sessionId,
        response: answer.substring(0, 100) + (answer.length > 100 ? '...' : '')
      });
      
      return answer;
    } catch (error) {
      logger.error('Error sending message', { 
        sessionId: this.sessionId,
        error: error.message 
      });
      
      console.error(chalk.red('Error sending message:'), error.message);
      if (error.response) {
        console.error(chalk.red('Response data:'), error.response.data);
      }
      return null;
    }
  }
  
  // End the session
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
  
  // Save session history to a file
  saveHistory() {
    if (this.history.length === 0) {
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const historyFile = path.join(logDir, `auto-session-history-${timestamp}.json`);
      const reportFile = path.join(logDir, `auto-session-report-${timestamp}.md`);
      
      // Save JSON history
      fs.writeFileSync(
        historyFile,
        JSON.stringify(this.history, null, 2)
      );
      
      // Generate and save markdown report
      let report = '# IVR Auto Navigator Report\n\n';
      report += `Generated: ${new Date().toISOString()}\n\n`;
      report += `Total Steps: ${this.history.length}\n\n`;
      
      this.history.forEach(entry => {
        report += `## Step ${entry.step}\n\n`;
        report += `### IVR Prompt\n\n\`\`\`\n${entry.prompt}\n\`\`\`\n\n`;
        report += `### Amazon Q Response\n\n\`\`\`\n${entry.response}\n\`\`\`\n\n`;
        report += `Timestamp: ${entry.timestamp}\n\n`;
        
        if (entry.action) {
          report += `Action Taken: ${entry.action}\n\n`;
        }
        
        report += '---\n\n';
      });
      
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
  
  // Extract the recommended action from Amazon Q's response
  extractAction(response) {
    // Look for specific patterns in the response
    const digitMatch = response.match(/press\s+(\d+)/i);
    if (digitMatch) {
      return digitMatch[1];
    }
    
    if (response.toLowerCase().includes('press asterisk') || 
        response.toLowerCase().includes('press star')) {
      return '*';
    }
    
    if (response.toLowerCase().includes('press pound') || 
        response.toLowerCase().includes('press hash')) {
      return '#';
    }
    
    // Look for standalone digits
    const standaloneDigit = response.match(/^\s*(\d+)\s*$/);
    if (standaloneDigit) {
      return standaloneDigit[1];
    }
    
    // Check for hang up instruction
    if (response.toLowerCase().includes('hang up')) {
      return 'Hang Up';
    }
    
    // Return the full response if we can't extract a specific action
    return response;
  }
  
  // Run the automated navigation
  async runAutomatedNavigation() {
    console.log(chalk.blue('Starting automated IVR navigation'));
    logger.info('Starting automated navigation');
    
    try {
      // Create a session
      await this.createSession();
      
      // Connect to the IVR system
      console.log(chalk.yellow('Connecting to IVR system...'));
      
      // This is where you would integrate with your actual IVR system
      // For now, we'll simulate it with a simple prompt
      let currentPrompt = "Thank you for calling. Press 1 for sales, press 2 for support, or press 0 to speak with an operator.";
      let isComplete = false;
      
      // Main navigation loop
      while (!isComplete && this.currentStep < this.config.maxSteps) {
        console.log(chalk.green(`\n=== Step ${this.currentStep + 1} ===`));
        console.log(chalk.blue('Current IVR Prompt:'));
        console.log(currentPrompt);
        
        // Send the prompt to Amazon Q
        console.log(chalk.yellow('\nSending prompt to Amazon Q...'));
        const response = await this.sendMessage(currentPrompt);
        
        if (!response) {
          console.error(chalk.red('No response from Amazon Q. Ending navigation.'));
          break;
        }
        
        console.log(chalk.blue('\nAmazon Q Response:'));
        console.log(response);
        
        // Extract the recommended action
        const action = this.extractAction(response);
        console.log(chalk.green('\nRecommended Action:'), chalk.yellow(action));
        
        // Update the history with the action
        this.history[this.history.length - 1].action = action;
        
        // Check if we should hang up
        if (action === 'Hang Up') {
          console.log(chalk.green('\nAmazon Q recommends hanging up. Ending call.'));
          isComplete = true;
          break;
        }
        
        // Simulate sending the action to the IVR system
        console.log(chalk.yellow(`\nSending action to IVR: ${action}`));
        
        // Wait for the IVR to respond
        await new Promise(resolve => setTimeout(resolve, this.config.waitTime));
        
        // Simulate the next IVR prompt based on the action
        // In a real implementation, this would come from the actual IVR system
        currentPrompt = this.simulateIvrResponse(action);
      }
      
      if (this.currentStep >= this.config.maxSteps) {
        console.log(chalk.yellow(`\nReached maximum steps (${this.config.maxSteps}). Ending navigation.`));
      }
      
      // End the session
      await this.endSession();
      
      console.log(chalk.green('\nAutomated navigation complete!'));
      logger.info('Automated navigation complete', { 
        steps: this.currentStep,
        complete: isComplete
      });
      
    } catch (error) {
      logger.error('Error in automated navigation', { error: error.message });
      console.error(chalk.red('\nError during automated navigation:'), error.message);
      
      // Try to clean up
      try {
        await this.endSession();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
  
  // Simulate IVR response (for demonstration purposes)
  simulateIvrResponse(action) {
    // This is just a simple simulation
    // In a real implementation, this would be replaced with actual IVR interaction
    
    switch (action) {
      case '1':
        return "You've selected sales. Press 1 for new accounts, press 2 for existing accounts, or press 0 to return to the main menu.";
      case '2':
        return "You've selected support. Press 1 for technical support, press 2 for billing support, or press 0 to return to the main menu.";
      case '0':
        return "Please hold while we connect you to an operator. Your estimated wait time is 5 minutes. Press 1 to continue holding, or press 2 to leave a callback number.";
      default:
        return "I'm sorry, I didn't understand that selection. Press 1 for sales, press 2 for support, or press 0 to speak with an operator.";
    }
  }
}

// Main function
async function main() {
  console.log(chalk.blue('IVR Auto Navigator'));
  console.log(chalk.blue('================='));
  console.log(chalk.blue('Amazon Q Session API URL:'), options.url);
  console.log(chalk.blue('Using profile:'), options.profile);
  console.log(chalk.blue('Log directory:'), options.logDir);
  console.log(chalk.blue('Maximum steps:'), options.maxSteps);
  console.log(chalk.blue('Wait time:'), options.waitTime, 'ms');
  console.log('');
  
  const navigator = new IvrAutoNavigator();
  
  try {
    await navigator.runAutomatedNavigation();
  } catch (error) {
    logger.error('Unhandled error in main function', { error: error.message });
    console.error(chalk.red('\nAn error occurred:'), error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Fatal error', { error: error.message });
  console.error(chalk.red('\nFatal error:'), error.message);
  process.exit(1);
});
