const fs = require('fs'); 
const lines = fs.readFileSync('c:/SRC/CODE/HP/style.css', 'utf-8').split('\n'); 
let stack = []; 
lines.forEach((line, i) => { 
  for(let char of line) { 
    if (char==='{') stack.push(i+1); 
    else if (char==='}') { 
      if(stack.length) stack.pop(); 
      else console.log('Unmatched } at line ' + (i+1)); 
    } 
  } 
}); 
if(stack.length) console.log('Unmatched { at: ' + stack.join(', ')); 
else console.log('All braces match!');
