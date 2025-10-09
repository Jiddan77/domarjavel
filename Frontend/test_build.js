#!/usr/bin/env node
/**
 * Frontend build and type checking test
 * Run this to verify the frontend builds without errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Dommarjävel Frontend');
console.log('=' .repeat(50));

// Check if package.json exists
if (!fs.existsSync('package.json')) {
    console.log('❌ package.json not found. Run this from the Frontend directory.');
    process.exit(1);
}

const tests = [
    {
        name: 'Dependencies Check',
        command: 'npm list --depth=0',
        description: 'Verify all dependencies are installed'
    },
    {
        name: 'TypeScript Check',
        command: 'npx tsc --noEmit',
        description: 'Check for TypeScript errors'
    },
    {
        name: 'ESLint Check',
        command: 'npx eslint . --ext .ts,.tsx --max-warnings 0',
        description: 'Check for linting errors'
    },
    {
        name: 'Build Test',
        command: 'npm run build',
        description: 'Test production build'
    }
];

let passedTests = 0;
const totalTests = tests.length;

for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
        execSync(test.command, { 
            stdio: 'pipe',
            cwd: process.cwd()
        });
        console.log('   ✅ Passed');
        passedTests++;
    } catch (error) {
        console.log('   ❌ Failed');
        console.log(`   Error: ${error.message}`);
        
        // Show stderr if available
        if (error.stderr) {
            const stderr = error.stderr.toString();
            console.log(`   Details: ${stderr.slice(0, 500)}${stderr.length > 500 ? '...' : ''}`);
        }
    }
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All frontend tests passed!');
    console.log('✅ Ready for testing');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Fix issues before testing.');
    process.exit(1);
}