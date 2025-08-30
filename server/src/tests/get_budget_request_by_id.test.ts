import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { departmentsTable, budgetCategoriesTable, budgetRequestsTable } from '../db/schema';
import { type GetBudgetRequestByIdInput } from '../schema';
import { getBudgetRequestById } from '../handlers/get_budget_request_by_id';

// Test input for getting budget request by ID
const testInput: GetBudgetRequestByIdInput = {
  id: 1
};

describe('getBudgetRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a budget request by ID', async () => {
    // Create test department first
    const department = await db.insert(departmentsTable)
      .values({
        name: 'Test Department',
        code: 'TEST-DEPT',
        description: 'Test department description',
        head_name: 'John Doe',
        contact_email: 'john@example.com',
        contact_phone: '555-1234'
      })
      .returning()
      .execute();

    // Create test budget category
    const category = await db.insert(budgetCategoriesTable)
      .values({
        name: 'Test Category',
        code: 'TEST-CAT',
        description: 'Test category description'
      })
      .returning()
      .execute();

    // Create test budget request
    const budgetRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Test Budget Request',
        description: 'A test budget request for testing',
        department_id: department[0].id,
        category_id: category[0].id,
        requested_amount: '50000.00',
        justification: 'Test justification for budget request',
        priority: 'high',
        status: 'draft',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User'
      })
      .returning()
      .execute();

    const result = await getBudgetRequestById({ id: budgetRequest[0].id });

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(budgetRequest[0].id);
    expect(result!.title).toEqual('Test Budget Request');
    expect(result!.description).toEqual('A test budget request for testing');
    expect(result!.department_id).toEqual(department[0].id);
    expect(result!.category_id).toEqual(category[0].id);
    expect(result!.requested_amount).toEqual(50000.00);
    expect(typeof result!.requested_amount).toBe('number');
    expect(result!.justification).toEqual('Test justification for budget request');
    expect(result!.priority).toEqual('high');
    expect(result!.status).toEqual('draft');
    expect(result!.fiscal_year).toEqual(2024);
    expect(result!.expected_start_date).toEqual(new Date('2024-01-01'));
    expect(result!.expected_end_date).toEqual(new Date('2024-12-31'));
    expect(result!.submitted_by).toEqual('Test User');
    expect(result!.submitted_at).toBeNull();
    expect(result!.reviewed_by).toBeNull();
    expect(result!.reviewed_at).toBeNull();
    expect(result!.review_notes).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when budget request not found', async () => {
    const result = await getBudgetRequestById({ id: 999 });

    expect(result).toBeNull();
  });

  it('should handle budget request with all optional fields populated', async () => {
    // Create test department
    const department = await db.insert(departmentsTable)
      .values({
        name: 'Complete Department',
        code: 'COMP-DEPT',
        description: 'Complete department',
        head_name: 'Jane Smith',
        contact_email: 'jane@example.com',
        contact_phone: '555-5678'
      })
      .returning()
      .execute();

    // Create test budget category
    const category = await db.insert(budgetCategoriesTable)
      .values({
        name: 'Complete Category',
        code: 'COMP-CAT',
        description: 'Complete category'
      })
      .returning()
      .execute();

    // Create budget request with all fields
    const budgetRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Complete Budget Request',
        description: 'Complete budget request with all fields',
        department_id: department[0].id,
        category_id: category[0].id,
        requested_amount: '75000.50',
        justification: 'Complete justification',
        priority: 'critical',
        status: 'approved',
        fiscal_year: 2025,
        expected_start_date: new Date('2025-01-01'),
        expected_end_date: new Date('2025-12-31'),
        submitted_by: 'Complete User',
        submitted_at: new Date('2024-12-01'),
        reviewed_by: 'Review Manager',
        reviewed_at: new Date('2024-12-15'),
        review_notes: 'Approved with conditions'
      })
      .returning()
      .execute();

    const result = await getBudgetRequestById({ id: budgetRequest[0].id });

    // Validate all fields including optional ones
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(budgetRequest[0].id);
    expect(result!.title).toEqual('Complete Budget Request');
    expect(result!.requested_amount).toEqual(75000.50);
    expect(typeof result!.requested_amount).toBe('number');
    expect(result!.priority).toEqual('critical');
    expect(result!.status).toEqual('approved');
    expect(result!.fiscal_year).toEqual(2025);
    expect(result!.submitted_by).toEqual('Complete User');
    expect(result!.submitted_at).toBeInstanceOf(Date);
    expect(result!.reviewed_by).toEqual('Review Manager');
    expect(result!.reviewed_at).toBeInstanceOf(Date);
    expect(result!.review_notes).toEqual('Approved with conditions');
  });

  it('should handle decimal amounts correctly', async () => {
    // Create prerequisites
    const department = await db.insert(departmentsTable)
      .values({
        name: 'Decimal Department',
        code: 'DEC-DEPT',
        description: 'Decimal test department',
        head_name: 'Decimal Manager',
        contact_email: 'decimal@example.com',
        contact_phone: null
      })
      .returning()
      .execute();

    const category = await db.insert(budgetCategoriesTable)
      .values({
        name: 'Decimal Category',
        code: 'DEC-CAT',
        description: null
      })
      .returning()
      .execute();

    // Test with various decimal amounts
    const testAmounts = ['1234.56', '9999.99', '0.01', '100000.00'];
    
    for (const amount of testAmounts) {
      const budgetRequest = await db.insert(budgetRequestsTable)
        .values({
          title: `Decimal Test ${amount}`,
          description: 'Testing decimal conversion',
          department_id: department[0].id,
          category_id: category[0].id,
          requested_amount: amount,
          justification: 'Decimal test justification',
          priority: 'medium',
          status: 'draft',
          fiscal_year: 2024,
          expected_start_date: new Date('2024-01-01'),
          expected_end_date: new Date('2024-12-31'),
          submitted_by: 'Decimal Tester'
        })
        .returning()
        .execute();

      const result = await getBudgetRequestById({ id: budgetRequest[0].id });

      expect(result).not.toBeNull();
      expect(result!.requested_amount).toEqual(parseFloat(amount));
      expect(typeof result!.requested_amount).toBe('number');
    }
  });
});