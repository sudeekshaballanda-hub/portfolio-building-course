/**
 * NEXUS Standard Calculator - Controller Script
 * 
 * This script manages the state of the calculator, processes user input
 * (both screen clicks and physical keyboard events), formats expressions,
 * and parses/evaluates expressions using standard operator precedence.
 */

// ==========================================================================
// Calculator State Variables
// ==========================================================================
let expression = '';   // Stores the current mathematical expression (e.g., "5+6*3/8")
let isEvaluated = false; // Tracks if the current displayed result is a final answer
let memoryValue = 0;   // Stores the value currently in calculator memory
let hasMemory = false;  // Tracks if a value is currently active in memory

// ==========================================================================
// DOM Element References
// ==========================================================================
const expressionDisplay = document.getElementById('expression-display');
const resultDisplay = document.getElementById('result-display');
const memoryIndicator = document.getElementById('memory-indicator');
const buttons = document.querySelectorAll('.btn');

// Defined operators
const OPERATORS = ['+', '-', '*', '/'];

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Add click listeners to all keypad buttons
    buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });

    // Add keyboard input listener
    document.addEventListener('keydown', handleKeyboardInput);
});

// ==========================================================================
// Input Event Handling (Keypad Clicks)
// ==========================================================================
function handleButtonClick(event) {
    const button = event.currentTarget;
    const value = button.getAttribute('data-val');
    const operator = button.getAttribute('data-operator');
    const action = button.getAttribute('data-action');
    const memoryAction = button.getAttribute('data-memory');

    // Make the button flash slightly for visual feedback on click
    flashButton(button);

    if (value !== null) {
        handleNumberInput(value);
    } else if (operator !== null) {
        handleOperatorInput(operator);
    } else if (action !== null) {
        handleActionInput(action);
    } else if (memoryAction !== null) {
        handleMemoryInput(memoryAction);
    }
}

// ==========================================================================
// Input Event Handling (Keyboard typing)
// ==========================================================================
function handleKeyboardInput(event) {
    const key = event.key;

    // Check for Alt key memory shortcuts
    if (event.altKey) {
        const char = key.toLowerCase();
        if (char === 'c') {
            event.preventDefault();
            handleMemoryInput('MC');
            highlightButtonByKey('MC');
            return;
        } else if (char === 'r') {
            event.preventDefault();
            handleMemoryInput('MR');
            highlightButtonByKey('MR');
            return;
        } else if (char === 'p') {
            event.preventDefault();
            handleMemoryInput('M+');
            highlightButtonByKey('M+');
            return;
        } else if (char === 'm') {
            event.preventDefault();
            handleMemoryInput('M-');
            highlightButtonByKey('M-');
            return;
        }
    }

    // Prevent default actions for keys like Enter, / (which opens search in some browsers)
    if (key === 'Enter' || key === '/' || key === 'Backspace' || key === 'Escape') {
        event.preventDefault();
    }

    // Number keys 0-9
    if (/^[0-9]$/.test(key)) {
        handleNumberInput(key);
        highlightButtonByKey(key);
    }
    // Decimal point
    else if (key === '.') {
        handleNumberInput('.');
        highlightButtonByKey('.');
    }
    // Basic operators
    else if (OPERATORS.includes(key)) {
        handleOperatorInput(key);
        highlightButtonByKey(key);
    }
    // Multiply alternate keyboard binding
    else if (key.toLowerCase() === 'x') {
        handleOperatorInput('*');
        highlightButtonByKey('*');
    }
    // Equal key / Enter key
    else if (key === 'Enter' || key === '=') {
        handleActionInput('calculate');
        highlightButtonByKey('=');
    }
    // Backspace key (delete last character)
    else if (key === 'Backspace') {
        handleActionInput('delete');
        highlightButtonByKey('delete');
    }
    // Escape key (clear all)
    else if (key === 'Escape') {
        handleActionInput('clear');
        highlightButtonByKey('clear');
    }
}

// ==========================================================================
// Button Micro-Animations & Visual Feedback
// ==========================================================================
function flashButton(button) {
    // Add a temporary class to trigger micro-animations
    button.classList.add('btn-active-flash');
    setTimeout(() => {
        button.classList.remove('btn-active-flash');
    }, 150);
}

function highlightButtonByKey(key) {
    let button;
    if (key === 'delete') {
        button = document.getElementById('btn-delete');
    } else if (key === 'clear') {
        button = document.getElementById('btn-clear');
    } else if (key === '=') {
        button = document.getElementById('btn-equals');
    } else if (key === '+') {
        button = document.getElementById('btn-add');
    } else if (key === '-') {
        button = document.getElementById('btn-subtract');
    } else if (key === '*') {
        button = document.getElementById('btn-multiply');
    } else if (key === '/') {
        button = document.getElementById('btn-divide');
    } else if (key === '.') {
        button = document.getElementById('btn-decimal');
    } else if (key === 'MC') {
        button = document.getElementById('btn-mc');
    } else if (key === 'MR') {
        button = document.getElementById('btn-mr');
    } else if (key === 'M+') {
        button = document.getElementById('btn-mplus');
    } else if (key === 'M-') {
        button = document.getElementById('btn-mminus');
    } else {
        // Find number button with data-val match
        button = Array.from(buttons).find(btn => btn.getAttribute('data-val') === key);
    }

    if (button) {
        flashButton(button);
    }
}

// ==========================================================================
// Calculator Core Logic Functions
// ==========================================================================

/**
 * Handle typing digits and the decimal point
 */
function handleNumberInput(val) {
    // If the expression was just evaluated and we start typing a number, start a clean slate
    if (isEvaluated) {
        expression = '';
        isEvaluated = false;
    }

    // Extract the active number part (everything after the last operator)
    const lastOpIndex = Math.max(
        expression.lastIndexOf('+'),
        expression.lastIndexOf('-'),
        expression.lastIndexOf('*'),
        expression.lastIndexOf('/')
    );
    const currentNumStr = expression.slice(lastOpIndex + 1);

    // 1. Handle Decimal Input
    if (val === '.') {
        // Prevent duplicate decimals within the same number
        if (currentNumStr.includes('.')) {
            return;
        }
        // If current number string is empty (e.g. at start or after operator), make it "0."
        if (currentNumStr === '') {
            expression += '0.';
            updateDisplay();
            return;
        }
    }

    // 2. Handle Leading Zeros
    if (val === '0') {
        // Prevent typing multiple leading zeros if current number is already exactly "0"
        if (currentNumStr === '0') {
            return;
        }
    } else if (val !== '.') {
        // If the current number is just "0", replace it with the new digit (e.g. "0" + "5" -> "5")
        if (currentNumStr === '0') {
            expression = expression.slice(0, -1) + val;
            updateDisplay();
            return;
        }
    }

    // Append to mathematical expression
    expression += val;
    updateDisplay();
}

/**
 * Handle operator inputs (+, -, *, /)
 */
function handleOperatorInput(op) {
    if (isEvaluated) {
        // If an expression was just evaluated, start next expression with the current result
        const currentResult = resultDisplay.textContent;
        if (currentResult !== 'Error' && !currentResult.includes('Error')) {
            expression = currentResult;
        } else {
            expression = '';
        }
        isEvaluated = false;
    }

    // If expression is empty, only allow minus sign (representing negative start values)
    if (expression === '') {
        if (op === '-') {
            expression = '-';
        }
        updateDisplay();
        return;
    }

    const lastChar = expression.slice(-1);

    // If last character is already an operator, replace it with the new operator
    if (OPERATORS.includes(lastChar)) {
        expression = expression.slice(0, -1) + op;
    } 
    // If last character is a decimal point, strip it and add operator
    else if (lastChar === '.') {
        expression = expression.slice(0, -1) + op;
    } 
    // Normal operator append
    else {
        expression += op;
    }

    updateDisplay();
}

/**
 * Handle special actions (Clear, Delete, Calculate)
 */
function handleActionInput(action) {
    if (action === 'clear') {
        expression = '';
        isEvaluated = false;
        resultDisplay.textContent = '0';
        updateDisplay();
    } 
    else if (action === 'delete') {
        if (isEvaluated) {
            // If already evaluated, clear result on deletion
            expression = '';
            isEvaluated = false;
            resultDisplay.textContent = '0';
            updateDisplay();
        } else {
            // Remove the last character from expression
            expression = expression.slice(0, -1);
            updateDisplay();
        }
    } 
    else if (action === 'calculate') {
        performCalculation();
    }
}

/**
 * Handle memory actions (MC, MR, M+, M-)
 */
function handleMemoryInput(action) {
    // Treat "Error" screen displays as numeric 0
    const screenText = resultDisplay.textContent;
    const currentVal = (screenText === 'Error' || screenText.includes('Error')) ? 0 : parseFloat(screenText);

    if (action === 'MC') {
        memoryValue = 0;
        hasMemory = false;
    } else if (action === 'MR') {
        recallMemory();
    } else if (action === 'M+') {
        if (!isNaN(currentVal) && isFinite(currentVal)) {
            memoryValue += currentVal;
            hasMemory = true;
        }
    } else if (action === 'M-') {
        if (!isNaN(currentVal) && isFinite(currentVal)) {
            memoryValue -= currentVal;
            hasMemory = true;
        }
    }

    updateMemoryIndicator();
}

/**
 * Recall stored memory value and replace/append to expression
 */
function recallMemory() {
    if (isEvaluated) {
        expression = '';
        isEvaluated = false;
    }

    // Find the index of the last operator to determine where active number starts
    const lastOpIndex = Math.max(
        expression.lastIndexOf('+'),
        expression.lastIndexOf('-'),
        expression.lastIndexOf('*'),
        expression.lastIndexOf('/')
    );

    // Format recalled value to string (strip trailing decimal zeros if it's float)
    const memStr = parseFloat(memoryValue.toFixed(10)).toString();

    // Replace or append the recalled memory value
    expression = expression.slice(0, lastOpIndex + 1) + memStr;
    updateDisplay();
}

/**
 * Update the visibility of the visual 'M' memory indicator
 */
function updateMemoryIndicator() {
    if (hasMemory) {
        memoryIndicator.classList.remove('hidden');
    } else {
        memoryIndicator.classList.add('hidden');
    }
}

/**
 * Update HTML Displays based on the current expression state
 */
function updateDisplay() {
    // 1. Format the expression display (top display) for premium readability
    expressionDisplay.textContent = formatDisplayString(expression);

    // 2. Extract and format the active number for the main display (bottom display)
    const lastOpIndex = Math.max(
        expression.lastIndexOf('+'),
        expression.lastIndexOf('-'),
        expression.lastIndexOf('*'),
        expression.lastIndexOf('/')
    );

    let activeNum = expression.slice(lastOpIndex + 1);

    // Check if the screen should show the current active number, or default to "0"
    if (activeNum === '' && expression !== '') {
        // If user just typed an operator, keep showing the active expression context
        const lastChar = expression.slice(-1);
        if (OPERATORS.includes(lastChar)) {
            // Display the operator temporarily or keep showing "0"
            resultDisplay.textContent = formatDisplayString(lastChar);
        } else {
            resultDisplay.textContent = '0';
        }
    } else {
        // Format the active number string (e.g. keeping decimal notation neat)
        resultDisplay.textContent = activeNum === '' ? '0' : formatDisplayString(activeNum);
    }

    // Auto-adjust font size for large inputs to prevent display breaking
    adjustFontSize();
}

/**
 * Replace internal operator symbols with beautiful user-facing glyphs (x and ÷)
 * and add balanced spacing for clean design.
 */
function formatDisplayString(str) {
    if (str === '-') return '-';
    return str
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/\+/g, ' + ')
        .replace(/\-/g, ' - ');
}

/**
 * Scale font size down slightly if the displayed number starts getting too long
 */
function adjustFontSize() {
    const textLength = resultDisplay.textContent.length;
    if (textLength > 12) {
        resultDisplay.classList.add('long-output');
    } else {
        resultDisplay.classList.remove('long-output');
    }
}

// ==========================================================================
// Expression Parser & Evaluator (BODMAS/PEMDAS Order of Operations)
// ==========================================================================

/**
 * Entry point for evaluating the final expression
 */
function performCalculation() {
    if (expression === '') return;

    // Clean trailing operators or decimals before evaluating
    let cleanExpr = expression;
    while (OPERATORS.includes(cleanExpr.slice(-1)) || cleanExpr.slice(-1) === '.') {
        cleanExpr = cleanExpr.slice(0, -1);
    }

    // Edge case check: expression became empty after cleanup
    if (cleanExpr === '') {
        resultDisplay.textContent = '0';
        expression = '';
        updateDisplay();
        return;
    }

    try {
        // 1. Tokenize the expression string (split into numbers and operator tags)
        const tokens = tokenize(cleanExpr);

        // 2. Evaluate tokens using precedence rules
        const result = evaluateTokens(tokens);

        // 3. Format result (precision rounding, handling overflow)
        const formattedResult = formatResultValue(result);

        // Display results
        expressionDisplay.textContent = formatDisplayString(cleanExpr) + ' =';
        resultDisplay.textContent = formattedResult;
        
        // Cache result in expression in case the user wants to continue calculating
        expression = result.toString();
        isEvaluated = true;
    } catch (error) {
        // Display user friendly error messages without crashing application
        resultDisplay.textContent = error.message === 'Division by zero' ? 'Error' : 'Error';
        console.error('Calculation Error:', error);
        isEvaluated = true; // allow clear-on-click behaviour
    }
    
    adjustFontSize();
}

/**
 * Tokenizes a math expression string into an array of floats and operators.
 * Properly manages negative numbers (unary minus) at start or after operators.
 */
function tokenize(exprStr) {
    const tokens = [];
    let i = 0;
    
    while (i < exprStr.length) {
        const char = exprStr[i];

        // 1. Check for standard operator
        if (OPERATORS.includes(char)) {
            // Check for negative numbers (unary minus)
            // A minus sign represents a negative value instead of subtraction if:
            // - It is the very first character of the expression.
            // - The previous parsed token is another operator.
            if (char === '-') {
                const prevToken = tokens[tokens.length - 1];
                const isUnary = tokens.length === 0 || OPERATORS.includes(prevToken);
                
                if (isUnary) {
                    let numStr = '-';
                    i++;
                    
                    // Consume subsequent digits and decimals
                    while (i < exprStr.length && /[0-9.]/.test(exprStr[i])) {
                        numStr += exprStr[i];
                        i++;
                    }
                    
                    // If we only got a "-" sign with no digits, it's invalid syntax
                    if (numStr === '-') {
                        throw new Error("Invalid Syntax");
                    }
                    
                    tokens.push(parseFloat(numStr));
                    continue;
                }
            }
            
            // Standard operator token
            tokens.push(char);
            i++;
        }
        // 2. Check for numeric characters
        else if (/[0-9.]/.test(char)) {
            let numStr = '';
            while (i < exprStr.length && /[0-9.]/.test(exprStr[i])) {
                numStr += exprStr[i];
                i++;
            }
            
            // Verify there is only one decimal point inside the token
            const decimalCount = (numStr.match(/\./g) || []).length;
            if (decimalCount > 1) {
                throw new Error("Invalid Number Format");
            }
            
            tokens.push(parseFloat(numStr));
        } 
        // 3. Fallback for illegal characters
        else {
            throw new Error("Invalid Character");
        }
    }
    
    return tokens;
}

/**
 * Evaluates token list adhering to mathematical precedence (Multiplication/Division -> Addition/Subtraction).
 * Left-to-right processing order is maintained for operations with equal precedence.
 */
function evaluateTokens(tokens) {
    if (tokens.length === 0) return 0;

    // --- Pass 1: Handle Multiplication (*) and Division (/) ---
    const pass1Tokens = [];
    let i = 0;
    
    while (i < tokens.length) {
        const currentToken = tokens[i];
        
        if (currentToken === '*' || currentToken === '/') {
            // Retrieve left operand (must be a number and already loaded into output list)
            const leftOperand = pass1Tokens.pop();
            // Retrieve right operand (must be next token)
            const rightOperand = tokens[i + 1];
            
            if (leftOperand === undefined || rightOperand === undefined || typeof rightOperand !== 'number') {
                throw new Error("Invalid Expression");
            }
            
            // Validate division by zero
            if (currentToken === '/' && rightOperand === 0) {
                throw new Error("Division by zero");
            }
            
            // Compute intermediate operation result
            const intermediateResult = currentToken === '*' 
                ? leftOperand * rightOperand 
                : leftOperand / rightOperand;
                
            pass1Tokens.push(intermediateResult);
            i += 2; // Jump past operator and right operand
        } else {
            // Pass numbers and addition/subtraction tokens through unchanged
            pass1Tokens.push(currentToken);
            i++;
        }
    }

    // --- Pass 2: Handle Addition (+) and Subtraction (-) ---
    if (pass1Tokens.length === 0) return 0;
    
    let total = pass1Tokens[0];
    if (typeof total !== 'number') {
        throw new Error("Invalid Expression");
    }
    
    let j = 1;
    while (j < pass1Tokens.length) {
        const operator = pass1Tokens[j];
        const rightOperand = pass1Tokens[j + 1];
        
        if (rightOperand === undefined || typeof rightOperand !== 'number') {
            throw new Error("Invalid Expression");
        }
        
        if (operator === '+') {
            total += rightOperand;
        } else if (operator === '-') {
            total -= rightOperand;
        } else {
            throw new Error("Invalid Expression");
        }
        
        j += 2; // Skip past operator and operand
    }
    
    return total;
}

/**
 * Truncate, scale, or format numerical outputs for precise displays and overflow prevention
 */
function formatResultValue(val) {
    if (isNaN(val)) return 'Error';
    if (!isFinite(val)) return 'Error';
    
    let resultStr = val.toString();
    
    // Manage floating point approximation issues (e.g. 0.1 + 0.2)
    if (resultStr.includes('.')) {
        // Lock decimals to 10 indices and parse back to strip trailing zeros
        const rounded = parseFloat(val.toFixed(10));
        resultStr = rounded.toString();
    }
    
    // Prevent screen overflow for very long integer results
    if (resultStr.length > 12) {
        const exponential = val.toExponential(6);
        // If exponential string is somehow longer than normal display limits, fallback to simple trim
        if (exponential.length > 15) {
            return val.toPrecision(8);
        }
        return exponential;
    }
    
    return resultStr;
}
