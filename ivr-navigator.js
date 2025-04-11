#!/usr/bin/env node

/**
 * IVR Navigator using Amazon Q Session API
 * 
 * A simple, focused tool for navigating IVR systems using Amazon Q.
 */

const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const { program } = require('commander');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Configure command line options
program
  .version('1.0.0')
  .option('-u, --url <url>', 'Amazon Q Session API URL', 'http://localhost:8081')
  .option('-p, --profile <profile>', 'Amazon Q profile to use', 'IVR_tester')
  .option('-l, --log-dir <directory>', 'Directory for logs', './logs')
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
  defaultMeta: { service: 'ivr-q-navigator' },
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

// Display welcome banner
console.log(chalk.blue(figlet.textSync('IVR Navigator', { horizontalLayout: 'full' })));
console.log(chalk.green('Powered by Amazon Q Session API\n'));

// Main class for IVR navigation
class IvrNavigator {
  constructor(config = {}) {
    this.config = {
      apiUrl: options.url,
      profile: options.profile,
      ...config
    };
    
    this.sessionId = null;
    this.history = [];
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
      const historyFile = path.join(logDir, `session-history-${timestamp}.json`);
      
      fs.writeFileSync(
        historyFile,
        JSON.stringify(this.history, null, 2)
      );
      
      console.log(chalk.green(`Session history saved to ${historyFile}`));
      logger.info('Session history saved', { file: historyFile });
    } catch (error) {
      logger.error('Error saving history', { error: error.message });
      console.error(chalk.red('Error saving history:'), error.message);
    }
  }
  
  // Extract the recommended action from Amazon Q's response
  // extractAction(response) {
  //   console.log('Extracting action from response:', response.substring(0, 100) + '...');
    
  //   // Look for the last line that contains just a digit, *, #, or "Hang Up"
  //   const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
  //   for (let i = lines.length - 1; i >= 0; i--) {
  //     const line = lines[i];
      
  //     // Check for standalone digit, *, or #
  //     if (/^\d+$/.test(line)) {
  //       console.log(`Found standalone digit on line ${i}: ${line}`);
  //       return line;
  //     }
      
  //     if (line === '*' || line === '#') {
  //       console.log(`Found special character on line ${i}: ${line}`);
  //       return line;
  //     }
      
  //     if (line.toLowerCase() === 'hang up') {
  //       console.log(`Found hang up instruction on line ${i}`);
  //       return 'Hang Up';
  //     }
  //   }
    
  //   // If we didn't find a standalone action, look for specific patterns
  //   const pressDigitMatch = response.match(/press\s+(\d+)/i);
  //   if (pressDigitMatch) {
  //     console.log(`Found press digit instruction: ${pressDigitMatch[1]}`);
  //     return pressDigitMatch[1];
  //   }
    
  //   if (response.toLowerCase().includes('press asterisk') || 
  //       response.toLowerCase().includes('press star')) {
  //     return '*';
  //   }
    
  //   if (response.toLowerCase().includes('press pound') || 
  //       response.toLowerCase().includes('press hash')) {
  //     return '#';
  //   }
    
  //   // Look for any digit in the response
  //   const anyDigitMatch = response.match(/\d+/);
  //   if (anyDigitMatch) {
  //     console.log(`Found any digit: ${anyDigitMatch[0]}`);
  //     return anyDigitMatch[0];
  //   }
    
  //   // Return the last non-empty line as a fallback
  //   return lines[lines.length - 1] || response;
  // }
  extractAction(response) {
    console.log('Extracting action from response:', response.substring(0, 100) + '...');
    
    // Split by newlines, trim whitespace, and filter out empty lines
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    // Get the last non-empty line
    const lastLine = lines[lines.length - 1] || '';
    
    console.log(`Using last line as action: "${lastLine}"`);
    return lastLine;
  }
  
}

// Function to read multi-line input
async function readMultilineInput() {
  const { useMultiline } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useMultiline',
      message: 'Do you want to enter a multi-line IVR prompt?',
      default: false
    }
  ]);
  
  if (useMultiline) {
    console.log(chalk.yellow('Enter your multi-line prompt (type "END" on a new line when finished):'));
    
    return new Promise((resolve) => {
      let lines = [];
      
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
      });
      
      rl.on('line', (line) => {
        if (line.trim() === 'END') {
          rl.close();
          resolve(lines.join('\n'));
        } else {
          lines.push(line);
        }
      });
    });
  } else {
    const { prompt } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: 'Enter the IVR prompt:',
        validate: input => input.trim() ? true : 'Please enter a prompt'
      }
    ]);
    
    return prompt;
  }
}

// Main function
async function main() {
  console.log(chalk.blue('Amazon Q Session API URL:'), options.url);
  console.log(chalk.blue('Using profile:'), options.profile);
  console.log(chalk.blue('Log directory:'), options.logDir);
  console.log('');
  
  const navigator = new IvrNavigator();
  
  try {
    // Create a session
    await navigator.createSession();
    
    let exitRequested = false;
    
    while (!exitRequested) {
      console.log(chalk.yellow('\n--- IVR Navigation ---'));
      
      // Get user input
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            'Enter IVR Prompt',
            'View Session History',
            'Exit'
          ]
        }
      ]);
      
      switch (action) {
        case 'Enter IVR Prompt':
          // Get the IVR prompt
          const prompt = await readMultilineInput();
          
          console.log(chalk.green('\nSending prompt to Amazon Q...'));
          const response = await navigator.sendMessage(prompt);
          
          if (response) {
            console.log(chalk.blue('\nAmazon Q Response:'));
            console.log(response);
            
            const extractedAction = navigator.extractAction(response);
            console.log(chalk.green('\nRecommended Action:'), chalk.yellow(extractedAction));
          }
          break;
          
        case 'View Session History':
          console.log(chalk.blue('\nSession History:'));
          
          if (navigator.history.length === 0) {
            console.log(chalk.yellow('No history yet'));
          } else {
            navigator.history.forEach((entry, index) => {
              console.log(chalk.green(`\n--- Step ${index + 1} ---`));
              console.log(chalk.blue('Prompt:'), entry.prompt);
              console.log(chalk.blue('Response:'), entry.response);
              console.log(chalk.blue('Timestamp:'), entry.timestamp);
            });
          }
          break;
          
        case 'Exit':
          exitRequested = true;
          break;
      }
    }
    
    // End the session
    await navigator.endSession();
    
  } catch (error) {
    logger.error('Unhandled error in main function', { error: error.message });
    console.error(chalk.red('\nAn error occurred:'), error.message);
    
    // Try to clean up
    try {
      await navigator.endSession();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
  
  console.log(chalk.green('\nThank you for using IVR Navigator!'));
  process.exit(0);
}

// Run the main function
main().catch(error => {
  logger.error('Fatal error', { error: error.message });
  console.error(chalk.red('\nFatal error:'), error.message);
  process.exit(1);
});
