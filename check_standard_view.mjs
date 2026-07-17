import fs from 'fs';
const content = fs.readFileSync('/app/applet/src/components/MaterialEngineeringDatabase.tsx', 'utf8');

const lines = content.split('\n');
// We want to check lines 6727 to 7362 (1-indexed, so index 6726 to 7361)
const subLines = lines.slice(6726, 7362);

// Keep track of original line numbers for characters
const charLineMap = [];
let merged = "";
for (let i = 0; i < subLines.length; i++) {
  const lineNum = 6727 + i;
  const line = subLines[i];
  for (let j = 0; j < line.length; j++) {
    merged += line[j];
    charLineMap.push(lineNum);
  }
  merged += "\n";
  charLineMap.push(lineNum);
}

// Strip comments from merged string
let noComments = "";
const cleanLineMap = [];
let isMLComment = false;
let isSLComment = false;
for (let i = 0; i < merged.length; i++) {
  if (isMLComment) {
    if (merged[i] === '*' && merged[i+1] === '/') {
      isMLComment = false;
      i++;
    }
    continue;
  }
  if (isSLComment) {
    if (merged[i] === '\n') {
      isSLComment = false;
      noComments += '\n';
      cleanLineMap.push(charLineMap[i]);
    }
    continue;
  }
  if (merged[i] === '/' && merged[i+1] === '*') {
    isMLComment = true;
    i++;
    continue;
  }
  if (merged[i] === '/' && merged[i+1] === '/') {
    isSLComment = true;
    i++;
    continue;
  }
  noComments += merged[i];
  cleanLineMap.push(charLineMap[i]);
}

// Strip strings and JS curly brace blocks { ... }
let cleanJSX = "";
const jsxLineMap = [];
let braceCount = 0;
let inString = null;

for (let i = 0; i < noComments.length; i++) {
  const char = noComments[i];
  const prevChar = i > 0 ? noComments[i-1] : '';
  
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
  
  if (char === '{') {
    braceCount++;
    continue;
  }
  if (char === '}') {
    braceCount--;
    continue;
  }
  
  if (braceCount === 0) {
    cleanJSX += char;
    jsxLineMap.push(cleanLineMap[i]);
  }
}

// Now match HTML/JSX tags on cleanJSX
const tagStack = [];
const tagRegex = /<(\/?)([a-zA-Z0-9_\-]+)([^>]*?)>/g;
let match;

while ((match = tagRegex.exec(cleanJSX)) !== null) {
  const isClosing = match[1] === '/';
  const tagName = match[2];
  const rest = match[3];
  const isSelfClosing = rest.trim().endsWith('/');
  const lineNum = jsxLineMap[match.index];
  
  if (isSelfClosing) {
    continue;
  }
  
  if (!isClosing) {
    tagStack.push({ tag: tagName, line: lineNum });
  } else {
    if (tagStack.length === 0) {
      console.log(`Extra closing tag: </${tagName}> at line ${lineNum}`);
    } else {
      const last = tagStack.pop();
      if (last.tag !== tagName) {
        console.log(`Tag Mismatch: expected </${last.tag}> (opened at line ${last.line}), but found </${tagName}> at line ${lineNum}`);
        tagStack.push(last); // keep it on stack
      }
    }
  }
}

console.log(`Standard View tags checked. Stack size left: ${tagStack.length}`);
if (tagStack.length > 0) {
  console.log('Unclosed tags in Standard View:');
  tagStack.forEach(t => console.log(`Unclosed <${t.tag}> opened at line ${t.line}`));
}
