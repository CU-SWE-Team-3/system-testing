# system-testing
## Running E2E Tests

# Install dependencies
npm install
npx playwright install

# Run all tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# View HTML report
npx playwright show-report