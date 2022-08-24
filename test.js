import { expect } from '@japa/expect';
import { pathToFileURL } from 'node:url';
import { specReporter } from '@japa/spec-reporter';
import { processCliArgs, configure, run } from '@japa/runner';

configure({
  ...processCliArgs(process.argv.slice(2)),
  ...{
    files: ['api/**/*.test.js', 'app/**/*.test.js'],
    plugins: [expect()],
    reporters: [specReporter()],
    importer: filePath => import(pathToFileURL(filePath).href),
  },
});
run();
