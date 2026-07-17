import fs from 'fs';
const content = fs.readFileSync('/app/applet/src/components/MaterialEngineeringDatabase.tsx', 'utf8');

const lines = content.split('\n');
const stack = [];
let inString = null;
let isComment = false;
let isMultilineComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j-1] : '';
    const nextChar = j < line.length - 1 ? line[j+1] : '';
    
    // Handle comments
    if (isMultilineComment) {
      if (char === '*' && nextChar === '/') {
        isMultilineComment = false;
        j++;
      }
      continue;
    }
    if (isComment) {
      break; // single line comment ends at end of line
    }
    if (char === '/' && nextChar === '/') {
      break;
    }
    if (char === '/' && nextChar === '*') {
      isMultilineComment = true;
      j++;
      continue;
    }
    
    // Handle string literals
    if (inString) {
      if (char === inString && prevChar !== '\\') {
        inString = null;
      }
      continue;
    }
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      inString = char;
      continue;
    }
    
    // Bracket tracking
    if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: lineNum, col: j + 1 });
    } else if (char === '}' || char === ')' || char === ']') {
      if (stack.length === 0) {
        console.log(`Extra closing bracket: ${char} at line ${lineNum}, col ${j + 1}`);
        continue;
      }
      const last = stack.pop();
      const expected = char === '}' ? '{' : char === ')' ? '(' : '[';
      if (last.char !== expected) {
        console.log(`Mismatch: expected closing for ${last.char} (from line ${last.line}, col ${last.col}), but found ${char} at line ${lineNum}, col ${j + 1}`);
      }
    }
  }
  isComment = false; // single line comment reset
}

console.log(`Parsed ${lines.length} lines. Stack size left: ${stack.length}`);
if (stack.length > 0) {
  console.log('Unclosed brackets at end of file:');
  stack.slice(-10).forEach(b => console.log(`Unclosed ${b.char} at line ${b.line}, col ${b.col}`));
}
