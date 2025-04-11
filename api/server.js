/**
 * Amazon Q Session API
 * 
 * A session-based API for interacting with Amazon Q CLI
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure logger
const logger = winston.createLogger({
  level: 'debug', // Changed from 'info' to 'debug' for more detailed logs
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'amazon-q-session-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Store active sessions
const sessions = {};

// Session cleanup interval (check every minute, timeout after 10 minutes of inactivity)
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Create a new Amazon Q session
 * @param {string} sessionId - Unique session identifier
 * @param {string} profile - Amazon Q profile to use
 * @returns {string} - Session ID
 */
function createSession(sessionId, profile = 'IVR_tester') {
  logger.info(`Creating new session ${sessionId} with profile ${profile}`);
  
  try {
    // Create log files for this session
    const sessionLogDir = path.join(logsDir, sessionId);
    if (!fs.existsSync(sessionLogDir)) {
      fs.mkdirSync(sessionLogDir, { recursive: true });
    }
    
    // Store the session (no process needed with the new approach)
    sessions[sessionId] = {
      profile,
      messages: [],
      lastActivity: Date.now()
    };
    
    return sessionId;
  } catch (error) {
    logger.error(`Error creating session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Clean up a session and its resources
 * @param {string} sessionId - Session to clean up
 */
function cleanupSession(sessionId) {
  if (sessions[sessionId]) {
    logger.info(`Cleaning up session ${sessionId}`);
    
    // Remove the session
    delete sessions[sessionId];
  }
}

/**
 * Extract a response from the Amazon Q output buffer
 * @param {string} buffer - Output buffer to process
 * @returns {string} - Extracted response
 */
function extractResponse(buffer) {
  // Log the buffer for debugging
  logger.debug(`Extracting response from buffer: ${buffer.substring(0, 200)}${buffer.length > 200 ? '...' : ''}`);
  
  // First, check for common response patterns
  
  // Pattern 1: Look for "Amazon Q:" followed by text
  const amazonQPattern = /Amazon Q:([\s\S]+?)(?=Human:|> |$)/;
  const amazonQMatch = buffer.match(amazonQPattern);
  if (amazonQMatch && amazonQMatch[1].trim()) {
    logger.debug(`Found Amazon Q pattern match: ${amazonQMatch[1].trim().substring(0, 50)}...`);
    return amazonQMatch[1].trim();
  }
  
  // Pattern 2: Look for any text after the input message
  const inputLines = buffer.split('\n');
  for (let i = 0; i < inputLines.length; i++) {
    if (inputLines[i].includes('Human:') || inputLines[i].includes('> ')) {
      // Found the input line, return everything after it until the next prompt
      const responseLines = [];
      for (let j = i + 1; j < inputLines.length; j++) {
        if (inputLines[j].includes('Human:') || inputLines[j].includes('> ')) {
          break;
        }
        if (inputLines[j].trim() && !inputLines[j].includes('To exit')) {
          responseLines.push(inputLines[j]);
        }
      }
      if (responseLines.length > 0) {
        const response = responseLines.join('\n');
        logger.debug(`Found response after input: ${response.substring(0, 50)}...`);
        return response;
      }
    }
  }
  
  // Pattern 3: If we can't find a clear pattern, look for any non-empty lines
  // that don't contain prompts or system messages
  const filteredLines = inputLines.filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.includes('Human:') && 
           !trimmed.includes('> ') && 
           !trimmed.includes('To exit') &&
           !trimmed.includes('Amazon Q Developer');
  });
  
  if (filteredLines.length > 0) {
    const response = filteredLines.join('\n');
    logger.debug(`Using filtered lines as response: ${response.substring(0, 50)}...`);
    return response;
  }
  
  // If all else fails, return the whole buffer
  logger.debug('No clear response pattern found, returning whole buffer');
  return buffer.trim();
}

/**
 * Send a message to an existing session
 * @param {string} sessionId - Session ID
 * @param {string} message - Message to send
 * @returns {Promise<string>} - Response from Amazon Q
 */
function sendMessage(sessionId, message) {
  return new Promise((resolve, reject) => {
    if (!sessions[sessionId]) {
      return reject(new Error('Session not found'));
    }
    
    logger.info(`Sending message to session ${sessionId}: ${message}`);
    
    // Update last activity time
    sessions[sessionId].lastActivity = Date.now();
    
    // Add message to history
    sessions[sessionId].messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Create a temporary file with conversation history
    const historyFile = path.join(os.tmpdir(), `q_history_${sessionId}.txt`);
    let historyContent = '';
    
    // Format the conversation history for IVR context
    for (let i = 0; i < sessions[sessionId].messages.length - 1; i += 2) {
      const userMsg = sessions[sessionId].messages[i];
      // Check if there's a corresponding assistant message
      if (i + 1 < sessions[sessionId].messages.length) {
        const assistantMsg = sessions[sessionId].messages[i + 1];
        
        // Format user message with IVR context if needed
        let formattedUserMsg = userMsg.content;
        if (!formattedUserMsg.includes('the IVR says') && !formattedUserMsg.includes('The IVR says')) {
          formattedUserMsg = `The IVR says "${formattedUserMsg}" what next?`;
        }
        
        historyContent += `Human: ${formattedUserMsg}\n`;
        historyContent += `Amazon Q: ${assistantMsg.content}\n\n`;
      }
    }
    
    // Write history to temp file
    fs.writeFileSync(historyFile, historyContent);
    logger.debug(`Wrote conversation history to ${historyFile}`);
    
    // Use the wrapper script with history
    const wrapperPath = path.join(__dirname, 'q_wrapper_with_history.sh');
    
    try {
      // Execute the wrapper script with the message and history
      logger.debug(`Executing wrapper script: ${wrapperPath} ${sessions[sessionId].profile} ${historyFile} "${message}"`);
      
      const result = require('child_process').execSync(
        `${wrapperPath} ${sessions[sessionId].profile} ${historyFile} "${message.replace(/"/g, '\\"')}"`,
        { encoding: 'utf8', timeout: 60000 }
      );
      
      const response = result.trim();
      logger.info(`Received response from wrapper for session ${sessionId}: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
      
      // Add response to history
      sessions[sessionId].messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });
      
      // Clean up temp file
      try {
        fs.unlinkSync(historyFile);
      } catch (e) {
        logger.warn(`Failed to delete temp history file: ${e.message}`);
      }
      
      resolve(response);
    } catch (error) {
      logger.error(`Error executing wrapper script: ${error.message}`);
      
      // Clean up temp file
      try {
        fs.unlinkSync(historyFile);
      } catch (e) {
        logger.warn(`Failed to delete temp history file: ${e.message}`);
      }
      
      reject(error);
    }
  });
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: Object.keys(sessions).length });
});

// Create a new session
app.post('/api/sessions', (req, res) => {
  try {
    const profile = req.body.profile || 'IVR_tester';
    const sessionId = uuidv4();
    
    createSession(sessionId, profile);
    
    logger.info(`Created new session: ${sessionId}`);
    res.json({ sessionId });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions[sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Return session info without sensitive data
  res.json({
    sessionId,
    profile: sessions[sessionId].profile,
    messageCount: sessions[sessionId].messages.length,
    lastActivity: new Date(sessions[sessionId].lastActivity).toISOString()
  });
});

// Get session messages
app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions[sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId,
    messages: sessions[sessionId].messages
  });
});

// Send a message to a session
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }
  
  if (!sessions[sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    const response = await sendMessage(sessionId, message);
    res.json({ sessionId, response });
  } catch (error) {
    logger.error(`Error sending message to session ${sessionId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// End a session
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions[sessionId]) {
    cleanupSession(sessionId);
    logger.info(`Session ${sessionId} terminated by request`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Session cleanup interval
setInterval(() => {
  const now = Date.now();
  
  Object.keys(sessions).forEach(sessionId => {
    const session = sessions[sessionId];
    const inactiveTime = now - session.lastActivity;
    
    if (inactiveTime > SESSION_TIMEOUT) {
      logger.info(`Session ${sessionId} timed out after ${inactiveTime}ms of inactivity`);
      cleanupSession(sessionId);
    }
  });
}, SESSION_CHECK_INTERVAL);

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  logger.info(`Amazon Q Session API running on port ${PORT}`);
});
