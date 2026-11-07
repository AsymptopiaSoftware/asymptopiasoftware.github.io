import {solveEquation,generateProblems} from '../src/index.js';
const solution=solveEquation('x/5-4/4=2/5');
for(const step of solution.steps)console.log(step.text);
console.log('Verified:',solution.verification.valid);
for(const problem of generateProblems({seed:'lesson-42',count:3}))console.log(problem.text,'=>',solveEquation(problem.equation).steps.at(-1).text);
