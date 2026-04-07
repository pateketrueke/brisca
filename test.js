import { expect } from '@japa/expect';
import { configure, run } from '@japa/runner';

configure({
  files: ['api/**/*.test.js', 'app/**/*.test.js', 'src/**/*.test.js'],
  plugins: [expect()],
});
run();
