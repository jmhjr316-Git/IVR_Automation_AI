/**
 * Fixed IVR State Tracker
 * 
 * This module provides improved state tracking functionality for IVR testing
 * with more accurate state identification.
 */

// Define known IVR states with more specific names
const IVR_STATES = {
  GREETING: 'greeting',
  MAIN_MENU: 'main_menu',
  REFILL_PRESCRIPTION: 'refill_prescription',
  CHECK_STATUS: 'check_status',
  PRESCRIBER_MENU: 'prescriber_menu',
  PHARMACY_HOURS: 'pharmacy_hours',
  WEEKLY_HOURS: 'weekly_hours',
  LEAVE_MESSAGE: 'leave_message',
  HOME_DELIVERY: 'home_delivery',
  REPEAT_OPTIONS: 'repeat_options',
  TRANSFER_TO_PHARMACY: 'transfer_to_pharmacy',
  ENTER_RX_NUMBER: 'enter_rx_number',
  CONFIRM_RX: 'confirm_rx',
  INVALID_SELECTION: 'invalid_selection',
  UNKNOWN: 'unknown'
};

// More specific state identification patterns
const STATE_PATTERNS = {
  [IVR_STATES.GREETING]: [
    'global greeting',
    'welcome to',
    'Thank you for calling'
  ],
  [IVR_STATES.MAIN_MENU]: [
    'To refill a prescription, press 1',
    'To check the status of a prescription, press 2',
    'If you are a prescriber, press 3',
    'To hear pharmacy hours and information, press 4',
    'To leave a message, press 5',
    'For our home delivery service, press 7',
    'To repeat these options, press 8',
    'To speak to the pharmacy, press 9'
  ],
  [IVR_STATES.REFILL_PRESCRIPTION]: [
    'Please enter the prescription number',
    'Enter the prescription number you would like to refill'
  ],
  [IVR_STATES.CHECK_STATUS]: [
    'Please enter the prescription number you would like to check',
    'Enter the prescription number to check status'
  ],
  [IVR_STATES.PRESCRIBER_MENU]: [
    'For new prescriptions or to authorize refills, press 1',
    'To transfer to the pharmacy, press 2',
    'If you are a prescriber'
  ],
  [IVR_STATES.PHARMACY_HOURS]: [
    'Today we\'re open until',
    'Press 1 for our weekly hours',
    'pharmacy hours and information'
  ],
  [IVR_STATES.WEEKLY_HOURS]: [
    'Our normal business hours',
    'Monday from',
    'Tuesday from'
  ],
  [IVR_STATES.LEAVE_MESSAGE]: [
    'leave your message after the tone',
    'leave a message',
    'After you\'re finished with your message'
  ],
  [IVR_STATES.HOME_DELIVERY]: [
    'home delivery service',
    'mail order',
    'delivery service'
  ],
  [IVR_STATES.REPEAT_OPTIONS]: [
    'repeat these options',
    'repeat the menu',
    'hear the options again'
  ],
  [IVR_STATES.TRANSFER_TO_PHARMACY]: [
    'transferring you',
    'connect you',
    'speak to the pharmacy'
  ],
  [IVR_STATES.ENTER_RX_NUMBER]: [
    'enter the prescription number',
    'Please enter the prescription',
    'Enter your prescription'
  ],
  [IVR_STATES.CONFIRM_RX]: [
    'confirm',
    'Is this correct',
    'Press 1 to confirm'
  ],
  [IVR_STATES.INVALID_SELECTION]: [
    'You entered an invalid selection',
    'invalid option',
    'not a valid selection'
  ]
};

// State transition map
const STATE_TRANSITIONS = {
  [IVR_STATES.GREETING]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.MAIN_MENU]: [
    IVR_STATES.REFILL_PRESCRIPTION,
    IVR_STATES.CHECK_STATUS,
    IVR_STATES.PRESCRIBER_MENU,
    IVR_STATES.PHARMACY_HOURS,
    IVR_STATES.LEAVE_MESSAGE,
    IVR_STATES.HOME_DELIVERY,
    IVR_STATES.REPEAT_OPTIONS,
    IVR_STATES.TRANSFER_TO_PHARMACY,
    IVR_STATES.INVALID_SELECTION,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.REFILL_PRESCRIPTION]: [
    IVR_STATES.ENTER_RX_NUMBER,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.CHECK_STATUS]: [
    IVR_STATES.ENTER_RX_NUMBER,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.PRESCRIBER_MENU]: [
    IVR_STATES.TRANSFER_TO_PHARMACY,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.PHARMACY_HOURS]: [
    IVR_STATES.WEEKLY_HOURS,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.WEEKLY_HOURS]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.LEAVE_MESSAGE]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.HOME_DELIVERY]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.REPEAT_OPTIONS]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.TRANSFER_TO_PHARMACY]: [],
  [IVR_STATES.ENTER_RX_NUMBER]: [
    IVR_STATES.CONFIRM_RX,
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.CONFIRM_RX]: [
    IVR_STATES.MAIN_MENU,
    IVR_STATES.TRANSFER_TO_PHARMACY
  ],
  [IVR_STATES.INVALID_SELECTION]: [
    IVR_STATES.MAIN_MENU
  ],
  [IVR_STATES.UNKNOWN]: Object.values(IVR_STATES)
};

// Input mapping for each state
const STATE_INPUTS = {
  [IVR_STATES.GREETING]: {
    continue: '',
    default: ''
  },
  [IVR_STATES.MAIN_MENU]: {
    refill: '1',
    status: '2',
    prescriber: '3',
    hours: '4',
    message: '5',
    delivery: '7',
    repeat: '8',
    pharmacy: '9',
    default: '9'
  },
  [IVR_STATES.REFILL_PRESCRIPTION]: {
    default: '0001234' // Default RX number
  },
  [IVR_STATES.CHECK_STATUS]: {
    default: '0001234' // Default RX number
  },
  [IVR_STATES.PRESCRIBER_MENU]: {
    new_rx: '1',
    transfer: '2',
    default: '2'
  },
  [IVR_STATES.PHARMACY_HOURS]: {
    weekly: '1',
    back: '2',
    default: '1'
  },
  [IVR_STATES.WEEKLY_HOURS]: {
    back: '9',
    default: '9'
  },
  [IVR_STATES.LEAVE_MESSAGE]: {
    finish: '#',
    default: '#'
  },
  [IVR_STATES.HOME_DELIVERY]: {
    back: '9',
    default: '9'
  },
  [IVR_STATES.REPEAT_OPTIONS]: {
    default: ''
  },
  [IVR_STATES.TRANSFER_TO_PHARMACY]: {
    default: ''
  },
  [IVR_STATES.ENTER_RX_NUMBER]: {
    default: '0001234' // Default RX number
  },
  [IVR_STATES.CONFIRM_RX]: {
    confirm: '1',
    cancel: '2',
    default: '1'
  },
  [IVR_STATES.INVALID_SELECTION]: {
    default: '9'
  },
  [IVR_STATES.UNKNOWN]: {
    default: ''
  }
};

// Define DTMF options for each state - used for exploration
const STATE_DTMF_OPTIONS = {
  [IVR_STATES.MAIN_MENU]: ['1', '2', '3', '4', '5', '7', '8', '9'],
  [IVR_STATES.PHARMACY_HOURS]: ['1', '2', '9'],
  [IVR_STATES.WEEKLY_HOURS]: ['9'],
  [IVR_STATES.PRESCRIBER_MENU]: ['1', '2'],
  [IVR_STATES.CONFIRM_RX]: ['1', '2'],
  [IVR_STATES.LEAVE_MESSAGE]: ['#'],
  [IVR_STATES.REPEAT_OPTIONS]: ['1', '2', '3', '4', '5', '7', '8', '9'],
  [IVR_STATES.HOME_DELIVERY]: ['9'],
  // For states that expect specific input like RX numbers, we don't define options
  [IVR_STATES.UNKNOWN]: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#']
};

class FixedIvrStateTracker {
  constructor(logger = console.log) {
    this.currentState = IVR_STATES.UNKNOWN;
    this.previousState = null;
    this.stateHistory = [];
    this.stateTransitions = {};
    this.discoveredStates = new Set();
    this.discoveredPatterns = {};
    this.logger = logger;
    
    // Initialize state transition tracking
    Object.keys(IVR_STATES).forEach(state => {
      this.stateTransitions[IVR_STATES[state]] = {};
    });
  }

  /**
   * Identify the current IVR state based on response text
   * @param {string} responseText - Text extracted from IVR response
   * @returns {string} - Identified state
   */
  identifyState(responseText) {
    if (!responseText) {
      return IVR_STATES.UNKNOWN;
    }

    const lowerText = responseText.toLowerCase();
    
    // Special case handling for specific menu options
    if (lowerText.includes('please enter the prescription number')) {
      // Check if it's for refill or status
      if (lowerText.includes('refill') || 
          this.previousState === IVR_STATES.REFILL_PRESCRIPTION) {
        return IVR_STATES.REFILL_PRESCRIPTION;
      } else if (lowerText.includes('status') || 
                this.previousState === IVR_STATES.CHECK_STATUS) {
        return IVR_STATES.CHECK_STATUS;
      } else {
        return IVR_STATES.ENTER_RX_NUMBER;
      }
    }
    
    if (lowerText.includes('for new prescriptions or to authorize refills')) {
      return IVR_STATES.PRESCRIBER_MENU;
    }
    
    if (lowerText.includes('leave your message after the tone')) {
      return IVR_STATES.LEAVE_MESSAGE;
    }
    
    if (lowerText.includes('invalid selection')) {
      return IVR_STATES.INVALID_SELECTION;
    }
    
    // Check each state pattern
    for (const [state, patterns] of Object.entries(STATE_PATTERNS)) {
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          return state;
        }
      }
    }

    // If no match found, check for dynamic patterns we've discovered
    for (const [state, patterns] of Object.entries(this.discoveredPatterns)) {
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          return state;
        }
      }
    }

    return IVR_STATES.UNKNOWN;
  }

  /**
   * Update the current state based on response text
   * @param {string} responseText - Text extracted from IVR response
   * @returns {string} - New current state
   */
  updateState(responseText) {
    const newState = this.identifyState(responseText);
    
    // Add to discovered states
    this.discoveredStates.add(newState);
    
    // Check if this is a valid transition
    const validTransitions = STATE_TRANSITIONS[this.currentState] || [];
    const isValidTransition = validTransitions.includes(newState) || this.currentState === IVR_STATES.UNKNOWN;
    
    if (newState !== this.currentState) {
      // Track the transition
      if (this.currentState !== IVR_STATES.UNKNOWN) {
        if (!this.stateTransitions[this.currentState][newState]) {
          this.stateTransitions[this.currentState][newState] = 0;
        }
        this.stateTransitions[this.currentState][newState]++;
      }
      
      if (isValidTransition) {
        this.logger(`State transition: ${this.currentState} -> ${newState}`);
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateHistory.push(newState);
      } else {
        this.logger(`Warning: Invalid state transition from ${this.currentState} to ${newState}`);
        // Still update the state even if invalid transition
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateHistory.push(newState);
      }
    }
    
    return this.currentState;
  }

  /**
   * Add a new pattern for state identification
   * @param {string} state - State to associate with the pattern
   * @param {string} pattern - Pattern to match
   */
  addStatePattern(state, pattern) {
    if (!this.discoveredPatterns[state]) {
      this.discoveredPatterns[state] = [];
    }
    
    if (!this.discoveredPatterns[state].includes(pattern)) {
      this.discoveredPatterns[state].push(pattern);
      this.logger(`Added new pattern for state ${state}: "${pattern}"`);
    }
  }

  /**
   * Get the appropriate input for the current state and action
   * @param {string} action - The action to perform in the current state
   * @param {string} defaultInput - Default input if no mapping exists
   * @returns {string} - The input to send to the IVR
   */
  getInput(action, defaultInput = '') {
    const stateInputs = STATE_INPUTS[this.currentState] || {};
    return stateInputs[action] || stateInputs.default || defaultInput;
  }

  /**
   * Get the next action to take based on the current state
   * @param {Object} options - Options for determining the next action
   * @returns {Object} - Action information
   */
  getNextAction(options = {}) {
    const { mode = 'normal', explorationDepth = 0 } = options;
    
    // Exploration mode - try different DTMF options
    if (mode === 'explore') {
      const dtmfOptions = STATE_DTMF_OPTIONS[this.currentState] || STATE_DTMF_OPTIONS[IVR_STATES.UNKNOWN];
      
      // If we have options for this state, choose one based on exploration depth
      if (dtmfOptions.length > 0) {
        const optionIndex = explorationDepth % dtmfOptions.length;
        return { 
          action: 'explore', 
          input: dtmfOptions[optionIndex],
          description: `Exploring option ${dtmfOptions[optionIndex]} in state ${this.currentState}`
        };
      }
    }
    
    // Normal mode - follow predefined paths
    switch (this.currentState) {
      case IVR_STATES.GREETING:
        return { action: 'continue', input: '', description: 'Continuing from greeting' };
      
      case IVR_STATES.MAIN_MENU:
        return { action: 'hours', input: '4', description: 'Selecting pharmacy hours' };
      
      case IVR_STATES.PHARMACY_HOURS:
        return { action: 'weekly', input: '1', description: 'Selecting weekly hours' };
      
      case IVR_STATES.WEEKLY_HOURS:
        return { action: 'back', input: '9', description: 'Returning to main menu' };
      
      case IVR_STATES.REFILL_PRESCRIPTION:
      case IVR_STATES.ENTER_RX_NUMBER:
        return { action: 'default', input: '0001234', description: 'Entering prescription number' };
      
      case IVR_STATES.CHECK_STATUS:
        return { action: 'default', input: '0001234', description: 'Entering prescription number for status' };
      
      case IVR_STATES.CONFIRM_RX:
        return { action: 'confirm', input: '1', description: 'Confirming prescription' };
      
      case IVR_STATES.PRESCRIBER_MENU:
        return { action: 'transfer', input: '2', description: 'Transferring to pharmacy' };
      
      case IVR_STATES.LEAVE_MESSAGE:
        return { action: 'finish', input: '#', description: 'Finishing message' };
      
      case IVR_STATES.HOME_DELIVERY:
        return { action: 'back', input: '9', description: 'Returning to main menu' };
      
      case IVR_STATES.REPEAT_OPTIONS:
        return { action: 'hours', input: '4', description: 'Selecting pharmacy hours after repeat' };
      
      case IVR_STATES.TRANSFER_TO_PHARMACY:
        return { action: 'default', input: '', description: 'Waiting during transfer' };
      
      case IVR_STATES.INVALID_SELECTION:
        return { action: 'default', input: '9', description: 'Returning to main menu after invalid selection' };
      
      default:
        return { action: 'default', input: '', description: 'Default action for unknown state' };
    }
  }

  /**
   * Get DTMF options for the current state
   * @returns {Array} - Array of DTMF options
   */
  getDtmfOptions() {
    return STATE_DTMF_OPTIONS[this.currentState] || STATE_DTMF_OPTIONS[IVR_STATES.UNKNOWN];
  }

  /**
   * Reset the state tracker
   */
  reset() {
    this.currentState = IVR_STATES.UNKNOWN;
    this.previousState = null;
    this.stateHistory = [];
    // Keep discovered states and patterns
  }

  /**
   * Get the current state
   * @returns {string} - Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get the state history
   * @returns {Array} - History of states
   */
  getHistory() {
    return this.stateHistory;
  }

  /**
   * Get discovered states
   * @returns {Set} - Set of discovered states
   */
  getDiscoveredStates() {
    return this.discoveredStates;
  }

  /**
   * Get state transitions
   * @returns {Object} - State transition counts
   */
  getStateTransitions() {
    return this.stateTransitions;
  }

  /**
   * Generate a state transition diagram in DOT format
   * @returns {string} - DOT format diagram
   */
  generateStateTransitionDiagram() {
    let dot = 'digraph IVR_States {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n';
    
    // Add nodes for all discovered states
    this.discoveredStates.forEach(state => {
      dot += `  "${state}";\n`;
    });
    
    // Add edges for transitions
    Object.entries(this.stateTransitions).forEach(([fromState, transitions]) => {
      Object.entries(transitions).forEach(([toState, count]) => {
        if (count > 0) {
          dot += `  "${fromState}" -> "${toState}" [label="${count}"];\n`;
        }
      });
    });
    
    dot += '}\n';
    return dot;
  }
}

module.exports = {
  FixedIvrStateTracker,
  IVR_STATES,
  STATE_PATTERNS,
  STATE_TRANSITIONS,
  STATE_INPUTS,
  STATE_DTMF_OPTIONS
};
