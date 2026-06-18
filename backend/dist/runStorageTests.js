"use strict";
/**
 * Storage tests runner
 * Run with: npm run test:storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tests_1 = require("./storage/tests");
(0, tests_1.runStorageTests)().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
