# Testing with Vitest

> Add comprehensive test coverage to a React shopping cart application

- **Course:** CPSC 6175 – Web Engineering Technology (Section V01, Fall 2026), Columbus State University
- **Due:** Nov 9, 2025 11:59 PM

---

### 📋 Assignment Objectives

In this assignment, you will:

- Install and configure Vitest in a React application
- Write unit tests for utility functions using various assertions
- Test React components with user interactions
- Achieve >80% code coverage across all files
- Generate and interpret code coverage reports
- Apply best practices for test organization and naming

## Part 1: Setup Instructions

### Step 0: Create a New GitHub Repository

Start by creating a new repo in GitHub, make sure to initialize with a readme, with the following format: `lastName_react_testing` (e.g., `Canedo_react_testing`)

### Step 1: Create a New React Project

Start by creating a new React project with Vite:

```bash
$ npm create vite@latest shopping-cart-app -- --template react-ts
$ cd shopping-cart-app
$ npm install
```

### Step 2: Install Vitest and Testing Libraries

Install all the necessary testing dependencies:

```bash
$ npm install -D vitest @vitest/ui @vitest/coverage-v8
$ npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
$ npm install -D jsdom
```

### Step 3: Configure Vitest

Update your `vite.config.ts` file to include Vitest configuration:

**`vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
```

### Step 4: Create Test Setup File

Create a directory `src/test` and add a setup file:

**`src/test/setup.ts`**

```ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Step 5: Add Test Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

> **✓ Setup Complete!**  
> Your testing environment is now configured. You can verify it works by running `npm test` (though you don't have any tests yet).

## Part 2: The Application Code

You will be testing a shopping cart application with the following components and utilities. Create these files exactly as shown:

### Utility Functions

**`src/utils/cartUtils.ts`**

```ts
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Calculates the total price for a single cart item
 */
export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

/**
 * Calculates the subtotal for all items in the cart
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Calculates discount based on subtotal
 * 10% discount if subtotal >= $100
 * 5% discount if subtotal >= $50
 * No discount otherwise
 */
export function calculateDiscount(subtotal: number): number {
  if (subtotal >= 100) {
    return subtotal * 0.1;
  } else if (subtotal >= 50) {
    return subtotal * 0.05;
  }
  return 0;
}

/**
 * Calculates tax (8% of amount after discount)
 */
export function calculateTax(amount: number): number {
  return amount * 0.08;
}

/**
 * Calculates the final total (subtotal - discount + tax)
 */
export function calculateTotal(items: CartItem[]): number {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal);
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount);
  return Number((afterDiscount + tax).toFixed(2));
}

/**
 * Formats a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Validates that quantity is a positive integer
 */
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}
```

### React Component

**`src/components/ShoppingCart.tsx`**

```tsx
import { useState } from 'react';
import {
  CartItem,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  formatCurrency,
} from '../utils/cartUtils';

export function ShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const addItem = () => {
    if (!productName.trim() || !productPrice) {
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      return;
    }

    const newItem: CartItem = {
      id: Date.now(),
      name: productName.trim(),
      price: price,
      quantity: 1,
    };

    setItems([...items, newItem]);
    setProductName('');
    setProductPrice('');
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal);
  const tax = calculateTax(subtotal - discount);
  const total = calculateTotal(items);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Shopping Cart</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name"
          aria-label="Product name"
        />
        <input
          type="number"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          placeholder="Price"
          aria-label="Product price"
        />
        <button onClick={addItem}>Add to Cart</button>
      </div>

      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map((item) => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                <span>{item.name}</span> - 
                <span>{formatCurrency(item.price)}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  min="1"
                  style={{ width: '60px', margin: '0 10px' }}
                  aria-label={`Quantity for ${item.name}`}
                />
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            <p>Discount: -{formatCurrency(discount)}</p>
            <p>Tax: {formatCurrency(tax)}</p>
            <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
              Total: {formatCurrency(total)}
            </p>
          </div>

          <button onClick={clearCart} style={{ marginTop: '10px' }}>
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}
```

## Part 3: Your Testing Tasks

### 📝 Requirements

You must create comprehensive test files that achieve greater than 80% code coverage. Your tests should demonstrate understanding of:

- Different assertion types (`toBe`, `toEqual`, `toBeCloseTo`, etc.)
- Testing edge cases and boundary conditions
- Testing React components with user interactions
- Using `describe` blocks to organize tests logically
- Writing clear, descriptive test names

### Task 1: Test the Utility Functions

Create a file `src/utils/cartUtils.test.ts` and write tests for all utility functions. Your tests must cover all edge cases and achieve >80% coverage.

#### 💡 Testing Tips

- Use `describe` blocks to group related tests
- Give each test a clear, descriptive name starting with "should"
- For React components, use `userEvent` instead of `fireEvent`
- Use `toBeCloseTo` for floating-point comparisons when needed
- Remember to `await` user interactions

### Task 2: Test the React Component

Create a file `src/components/ShoppingCart.test.tsx` and write comprehensive tests for all component behaviors including adding items, removing items, updating quantities, and verifying calculations.

## Part 4: Running Tests and Generating Coverage

### Running Tests in Watch Mode

```bash
$ npm test
```

### Generating Coverage Report

```bash
$ npm run test:coverage
```

You should achieve >80% coverage across all metrics. An HTML coverage report will be generated at `coverage/index.html`.

### 📦 Deliverables

1. **`src/utils/cartUtils.test.ts`** - Complete test suite for utility functions
2. **`src/components/ShoppingCart.test.tsx`** - Complete test suite for React component
3. **Coverage Screenshot** - Screenshot showing >80% coverage
4. **HTML Coverage Report** - Include the generated coverage folder
5. **Brief Write-up** (1-2 paragraphs) describing your testing strategy and what you learned

**All of this should be in your GitHub repo and you will submit the link to the repo. Make sure it's set to public.**

## Grading Rubric

| Criteria                   | Points  | Description                                           |
|----------------------------|---------|-------------------------------------------------------|
| **Setup & Configuration**  | 10      | Vitest properly installed and configured              |
| **Utility Function Tests** | 30      | All utility functions tested with edge cases          |
| **Component Tests**        | 30      | All component behaviors tested with user interactions |
| **Code Coverage**          | 15      | >80% coverage achieved                               |
| **Test Organization**      | 5       | Proper use of describe blocks and clear test names    |
| **Assertion Variety**      | 5       | Appropriate use of different assertion types          |
| **Write-up**               | 5       | Thoughtful reflection on testing process              |
| **Total**                  | **100** |                                                       |

### 💪 Good Luck!

Remember: The goal is not just to achieve >80% coverage, but to write meaningful tests that actually verify your code behaves correctly. Think about edge cases, error conditions, and user interactions. Happy testing!

---

## Testing Strategy & Reflection

<!-- TODO: 1–2 paragraphs describing your testing strategy and what you learned -->

## Coverage

<!-- TODO: add coverage screenshot, e.g. ![Coverage report](./coverage-screenshot.png) -->

Full HTML report: [`coverage/index.html`](./coverage/index.html)

