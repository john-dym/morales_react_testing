import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {    type CartItem,
    calculateItemTotal,
    calculateSubtotal,
    calculateDiscount,
    calculateTax,
    calculateTotal,
    formatCurrency,
    isValidQuantity,} from './cartUtils';

describe('calculateItemTotal', () => {
    it('should multiply price by quantity', () => {
        expect(calculateItemTotal({id: 1, name: 'Thing', price: 10, quantity: 3})).toBe(30);
    });

    it('should return the price itself when quantity is 1', () => {
        expect(calculateItemTotal({id: 1, name: 'Thing', price: 24.5, quantity: 1})).toBe(24.5);
    });

    it('should return 0 when quantity is 0', () => {
        expect(calculateItemTotal({id: 1, name: 'Thing', price: 10, quantity: 0})).toBe(0);
    });

    it('should return 0 when the item is free', () => {
        expect(calculateItemTotal({id: 1, name: 'Thing', price: 0, quantity: 5})).toBe(0);
    });

    it('should handle decimal prices', () => {
        expect(calculateItemTotal({id: 1, name: 'Thing', price: 1.1, quantity: 3})).toBeCloseTo(3.3, 2);
    });
})

describe('calculateSubtotal', () => {
    it('should return 0 for an empty cart', () => {
        expect(calculateSubtotal([])).toBe(0);
    });

    it('should return the item total for a single item', () => {
        expect(calculateSubtotal([{id: 1, name: 'Thing', price: 12, quantity: 2}])).toBe(24);
    });

    it('should sum the totals of every item', () => {
        const items = [
            {id: 1, name: 'Thing', price: 10, quantity: 2},
            {id: 2, name: 'Thing', price: 5.5, quantity: 4},
            {id: 3, name: 'Thing', price: 100, quantity: 1}
        ];

        expect(calculateSubtotal(items)).toBe(142);
    });

    it('should add decimal prices accurately to the cent', () => {
        const items = [
            {id: 1, name: 'Thing', price: 0.1, quantity: 1},
            {id: 2, name: 'Thing', price: 0.2, quantity: 1}
        ];

        // 0.1 + 0.2 === 0.30000000000000004, so toBe(0.3) would fail here
        expect(calculateSubtotal(items)).toBeCloseTo(0.3, 2);
    });

    it('should ignore items with a quantity of 0', () => {
        const items = [
            {id: 1, name: 'Thing', price: 10, quantity: 1},
            {id: 2, name: 'Thing', price: 999, quantity: 0}
        ];

        expect(calculateSubtotal(items)).toBe(10);
    });

    it('should not modify the items it is given', () => {
        const items = [{id: 1, name: 'Thing', price: 10, quantity: 2}];
        const snapshot = structuredClone(items);

        calculateSubtotal(items);

        expect(items).toEqual(snapshot);
    });

    describe('calculateDiscount', () => {
        it.each([0, 0.01, 25, 49.99])('should give no discount for a subtotal of $%s', (subtotal) => {
            expect(calculateDiscount(subtotal)).toBe(0);
        });

        it('should give 5% at exactly $50', () => {
            expect(calculateDiscount(50)).toBe(2.5);
        });

        it.each([
            [60, 3],
            [75, 3.75],
            [99.99, 4.9995],
        ])('should give 5%% for a subtotal of $%s', (subtotal, expected) => {
            expect(calculateDiscount(subtotal)).toBeCloseTo(expected, 4);
        });

        it('should give 10% at exactly $100', () => {
            expect(calculateDiscount(100)).toBe(10);
        });

        it.each([
            [100.01, 10.001],
            [250, 25],
            [1000, 100],
        ])('should give 10%% for a subtotal of $%s', (subtotal, expected) => {
            expect(calculateDiscount(subtotal)).toBeCloseTo(expected, 4);
        });

        it('should jump to the larger discount when the subtotal crosses $100', () => {
            expect(calculateDiscount(100)).toBeGreaterThan(calculateDiscount(99.99));
        });

        it('should give no discount for a negative subtotal', () => {
            expect(calculateDiscount(-100)).toBe(0);
        });
    });

    describe('calculateTax', () => {
        it('should return 8% of the amount', () => {
            expect(calculateTax(100)).toBe(8);
        });

        it('should return 0 for an amount of 0', () => {
            expect(calculateTax(0)).toBe(0);
        });

        it.each([
            [47.5, 3.8],
            [19.99, 1.5992],
            [0.5, 0.04],
        ])('should calculate tax on a decimal amount of $%s', (amount, expected) => {
            expect(calculateTax(amount)).toBeCloseTo(expected, 4);
        });
    });

    describe('calculateTotal', () => {
        it('should return 0 for an empty cart', () => {
            expect(calculateTotal([])).toBe(0);
        });

        it('should add tax only when the subtotal is under $50', () => {
            // 20 + 8% tax = 21.60
            expect(calculateTotal([{id: 1, name: 'Thing', price: 20, quantity: 1}])).toBe(21.6);
        });

        it('should apply the 5% discount before tax at exactly $50', () => {
            // 50 - 2.50 = 47.50, + 3.80 tax = 51.30
            expect(calculateTotal([{id: 1, name: 'Thing', price: 50, quantity: 1}])).toBe(51.3);
        });

        it('should apply the 10% discount before tax at exactly $100', () => {
            // 100 - 10 = 90, + 7.20 tax = 97.20
            expect(calculateTotal([{id: 1, name: 'Thing', price: 100, quantity: 1}])).toBe(97.2);
        });

        it('should take quantity into account when picking the discount tier', () => {
            // 4 x 25 = 100, which qualifies for 10%
            expect(calculateTotal([{id: 1, name: 'Thing', price: 25, quantity: 4}])).toBe(97.2);
        });

        it('should combine several items into one total', () => {
            const items = [
                {id: 1, name: 'Thing', price: 30, quantity: 1},
                {id: 2, name: 'Thing', price: 40, quantity: 1}
            ];

            // 70 - 3.50 = 66.50, + 5.32 tax = 71.82
            expect(calculateTotal(items)).toBe(71.82);
        });

        it('should round the result to two decimal places', () => {
            // 29.97 + 2.3976 tax = 32.3676
            const total = calculateTotal([{id: 1, name: 'Thing', price: 9.99, quantity: 3}]);

            expect(total).toBe(32.37);
            expect(total.toString()).toMatch(/^\d+\.\d{1,2}$/);
        });

        it('should cost less at $50.00 than at $49.99 because the discount starts', () => {
            const justBelow = calculateTotal([{id: 1, name: 'Thing', price: 49.99, quantity: 1}]);
            const atThreshold = calculateTotal([{id: 1, name: 'Thing', price: 50, quantity: 1}]);

            expect(justBelow).toBe(53.99);
            expect(atThreshold).toBeLessThan(justBelow);
        });

        it('should agree with the individual helpers it is built from', () => {
            const items = [
                {id: 1, name: 'Thing', price: 19.99, quantity: 2},
                {id: 2, name: 'Thing', price: 45.5, quantity: 1}
            ];
            const subtotal = calculateSubtotal(items);
            const afterDiscount = subtotal - calculateDiscount(subtotal);

            expect(calculateTotal(items)).toBeCloseTo(afterDiscount + calculateTax(afterDiscount), 2);
        });
    });

    describe('formatCurrency', () => {
        it.each([
            [5, '$5.00'],
            [5.5, '$5.50'],
            [12.34, '$12.34'],
            [0, '$0.00'],
        ])('should format %s as %s', (amount, expected) => {
            expect(formatCurrency(amount)).toBe(expected);
        });

        it('should round to two decimal places', () => {
            expect(formatCurrency(3.14159)).toBe('$3.14');
            expect(formatCurrency(2.999)).toBe('$3.00');
        });

        it('should format large amounts without thousands separators', () => {
            expect(formatCurrency(1234567.891)).toBe('$1234567.89');
        });

        it('should put the minus sign after the dollar sign for negative amounts', () => {
            expect(formatCurrency(-5)).toBe('$-5.00');
        });

        it('should always produce a dollar sign followed by exactly two decimals', () => {
            const formatted = formatCurrency(42);

            expect(formatted).toBeTypeOf('string');
            expect(formatted).toMatch(/^\$\d+\.\d{2}$/);
            expect(formatted).toHaveLength(6);
        });
    });

    describe('isValidQuantity', () => {
        it.each([1, 2, 10, 1000])('should accept the positive integer %s', (quantity) => {
            expect(isValidQuantity(quantity)).toBe(true);
        });

        it('should reject 0', () => {
            expect(isValidQuantity(0)).toBe(false);
        });

        it.each([-1, -100])('should reject the negative number %s', (quantity) => {
            expect(isValidQuantity(quantity)).toBe(false);
        });

        it.each([0.5, 1.5, 2.999])('should reject the decimal %s', (quantity) => {
            expect(isValidQuantity(quantity)).toBe(false);
        });

        it.each([NaN, Infinity, -Infinity])('should reject %s', (quantity) => {
            expect(isValidQuantity(quantity)).toBe(false);
        });
    });
});