#!/usr/bin/env node

/**
 * AI-Powered IVR Test Runner
 * 
 * This script runs an automated IVR test using Amazon Q to navigate the IVR system.
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const IvrFlowTester = require('../Tests/IVR/Crawler/ivr_flow_tester');
const IvrIntegration = require('./ivr-integration');

// Configure command line options
program
  .version('1.0.0')
  .option('-u, --url <url>', 'Amazon Q Session API URL', 'http://localhost:8081')
  .option('-p, --profile <profile>', 'Amazon Q profile to use', 'IVR_tester')
  .option('-o, --output <directory>', 'Output directory', './ivr_results')
  .option('-i, --ivr <url>', 'IVR system URL', 'https://inbound-ivr-bot-text.pc.q.platform.enlivenhealth.co')
  .option('-f, --from <number>', 'From phone number', '7249143802')
  .option('-t, --to <number>', 'To phone number', '9193736940')
  .option('-w, --wait <ms>', 'Wait time between steps (ms)', '2000')
  .option('-n, --name <name>', 'Test name', 'AI_IVR_Test')
  .parse(process.argv);

const options = program.opts();

// Create output directory if it doesn't exist
if (!fs.existsSync(options.output)) {
  fs.mkdirSync(options.output, { recursive: true });
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('AI-Powered IVR Test Runner'));
  console.log(chalk.blue('========================='));
  console.log(chalk.blue('Amazon Q Session API URL:'), options.url);
  console.log(chalk.blue('Using profile:'), options.profile);
  console.log(chalk.blue('Output directory:'), options.output);
  console.log(chalk.blue('IVR system URL:'), options.ivr);
  console.log(chalk.blue('Wait time:'), options.wait, 'ms');
  console.log('');
  
  // Initialize IVR Flow Tester
  const ivrTester = new IvrFlowTester({
    baseUrl: options.ivr,
    from: options.from,
    to: options.to,
    defaultWaitTime: parseInt(options.wait),
    outputDir: path.join(options.output, 'ivr_logs'),
    logFile: path.join(options.output, 'ivr_flow_tester.log')
  });
  
  // Initialize IVR Integration
  const integration = new IvrIntegration({
    apiUrl: options.url,
    profile: options.profile,
    outputDir: options.output
  });
  
  // Connect the components
  integration.setIvrTester(ivrTester);
  
  try {
    // Run the automated navigation
    console.log(chalk.yellow(`Starting automated IVR test: ${options.name}`));
    const results = await integration.runAutomatedNavigation(options.name);
    
    if (results.success) {
      console.log(chalk.green('\nTest completed successfully!'));
      console.log(`Completed ${results.steps} steps`);
    } else {
      console.error(chalk.red('\nTest failed:'), results.error);
      console.log(`Completed ${results.steps} steps before failure`);
    }
    
    console.log(chalk.blue('\nResults saved to:'), options.output);
    
  } catch (error) {
    console.error(chalk.red('\nUnhandled error:'), error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('\nFatal error:'), error.message);
  process.exit(1);
});
