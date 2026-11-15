import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {userEvent} from '@testing-library/user-event';
import {render, screen, fireEvent} from '@testing-library/react';
import { ShoppingCart } from './ShoppingCart';
import '@testing-library/jest-dom/vitest';

// Task 2: Test the React Component
// Create a file src/components/ShoppingCart.test.tsx and write
// comprehensive tests for all component behaviors including adding
// items, removing items, updating quantities, and verifying calculations.

describe('empty cart', () => {
    it('should show the empty cart message', () => {
        render(<ShoppingCart />);
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not show the totals or the Clear Cart button', () => {
        render(<ShoppingCart />);

        expect(screen.queryByText(/Subtotal/)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Clear Cart' })).not.toBeInTheDocument();
    });
});

describe('adding items', () => {
    it('should add an item to the cart', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('$2.00')).toBeInTheDocument();
        expect(screen.getByLabelText('Quantity for Apple')).toHaveValue(1);
        expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
    });

    it('should clear the inputs after adding an item', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByLabelText('Product name')).toHaveValue('');
        expect(screen.getByLabelText('Product price')).toHaveValue(null);
    });

    it('should add multiple items', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
        await user.type(screen.getByLabelText('Product name'), 'Bread');
        await user.type(screen.getByLabelText('Product price'), '3');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should not add an item without a name', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item when the name is only spaces', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), '   ');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item without a price', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item with a price of 0', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '0');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item with a negative price', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);

        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '-5');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
});

describe('removing items', () => {
    it('should remove only the item whose Remove button was clicked', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);
        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
        await user.type(screen.getByLabelText('Product name'), 'Bread');
        await user.type(screen.getByLabelText('Product price'), '3');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        // Apple was added first, so its Remove button is the first one
        await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
    });
});

describe('clearing the cart', () => {
    it('should remove every item when Clear Cart is clicked', async () => {
        const user = userEvent.setup();
        render(<ShoppingCart />);
        await user.type(screen.getByLabelText('Product name'), 'Apple');
        await user.type(screen.getByLabelText('Product price'), '2');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
        await user.type(screen.getByLabelText('Product name'), 'Bread');
        await user.type(screen.getByLabelText('Product price'), '3');
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        await user.click(screen.getByRole('button', { name: 'Clear Cart' }));

        expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
});
