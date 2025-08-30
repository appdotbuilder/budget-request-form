import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  budgetRequestsTable, 
  budgetLineItemsTable, 
  departmentsTable, 
  budgetCategoriesTable 
} from '../db/schema';
import { type CreateBudgetRequestInput } from '../schema';
import { createBudgetRequest } from '../handlers/create_budget_request';
import { eq } from 'drizzle-orm';

// Helper function to create test department
const createTestDepartment = async () => {
  const result = await db.insert(departmentsTable)
    .values({
      name: 'Test Department',
      code: 'TEST',
      description: 'A department for testing',
      head_name: 'John Doe',
      contact_email: 'john.doe@test.com',
      contact_phone: '123-456-7890'
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create test budget category
const createTestBudgetCategory = async () => {
  const result = await db.insert(budgetCategoriesTable)
    .values({
      name: 'Test Category',
      code: 'TESTCAT',
      description: 'A category for testing'
    })
    .returning()
    .execute();
  return result[0];
};

describe('createBudgetRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget request with line items', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Test Budget Request',
      description: 'A budget request for testing purposes',
      department_id: department.id,
      category_id: category.id,
      requested_amount: 2500.00,
      justification: 'This is needed for testing our budget system',
      priority: 'medium',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User',
      line_items: [
        {
          description: 'Test Item 1',
          quantity: 10,
          unit_price: 100.00,
          notes: 'First test item'
        },
        {
          description: 'Test Item 2',
          quantity: 5,
          unit_price: 300.00,
          notes: null
        }
      ]
    };

    const result = await createBudgetRequest(testInput);

    // Verify budget request fields
    expect(result.title).toEqual('Test Budget Request');
    expect(result.description).toEqual(testInput.description);
    expect(result.department_id).toEqual(department.id);
    expect(result.category_id).toEqual(category.id);
    expect(result.requested_amount).toEqual(2500.00);
    expect(typeof result.requested_amount).toBe('number');
    expect(result.justification).toEqual(testInput.justification);
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('draft');
    expect(result.fiscal_year).toEqual(2024);
    expect(result.expected_start_date).toEqual(testInput.expected_start_date);
    expect(result.expected_end_date).toEqual(testInput.expected_end_date);
    expect(result.submitted_by).toEqual('Test User');
    expect(result.submitted_at).toBeNull();
    expect(result.reviewed_by).toBeNull();
    expect(result.reviewed_at).toBeNull();
    expect(result.review_notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save budget request to database', async () => {
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Database Test Request',
      description: 'Testing database persistence',
      department_id: department.id,
      category_id: category.id,
      requested_amount: 1000.00,
      justification: 'Database testing justification',
      priority: 'high',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-06-01'),
      expected_end_date: new Date('2024-08-31'),
      submitted_by: 'DB Test User',
      line_items: [
        {
          description: 'Database Item',
          quantity: 2,
          unit_price: 500.00,
          notes: 'Database test item'
        }
      ]
    };

    const result = await createBudgetRequest(testInput);

    // Verify budget request was saved
    const savedRequests = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, result.id))
      .execute();

    expect(savedRequests).toHaveLength(1);
    const savedRequest = savedRequests[0];
    expect(savedRequest.title).toEqual('Database Test Request');
    expect(savedRequest.department_id).toEqual(department.id);
    expect(savedRequest.category_id).toEqual(category.id);
    expect(parseFloat(savedRequest.requested_amount)).toEqual(1000.00);
    expect(savedRequest.priority).toEqual('high');
    expect(savedRequest.status).toEqual('draft');
  });

  it('should create associated line items', async () => {
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Line Items Test',
      description: 'Testing line items creation',
      department_id: department.id,
      category_id: category.id,
      requested_amount: 1750.00,
      justification: 'Line items testing',
      priority: 'low',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-03-01'),
      expected_end_date: new Date('2024-05-31'),
      submitted_by: 'Line Items Tester',
      line_items: [
        {
          description: 'Office Supplies',
          quantity: 3,
          unit_price: 250.00,
          notes: 'Various office supplies'
        },
        {
          description: 'Software License',
          quantity: 1,
          unit_price: 1000.00,
          notes: null
        }
      ]
    };

    const result = await createBudgetRequest(testInput);

    // Verify line items were created
    const lineItems = await db.select()
      .from(budgetLineItemsTable)
      .where(eq(budgetLineItemsTable.budget_request_id, result.id))
      .execute();

    expect(lineItems).toHaveLength(2);

    // Check first line item
    const firstItem = lineItems.find(item => item.description === 'Office Supplies');
    expect(firstItem).toBeDefined();
    expect(firstItem!.quantity).toEqual(3);
    expect(parseFloat(firstItem!.unit_price)).toEqual(250.00);
    expect(parseFloat(firstItem!.total_amount)).toEqual(750.00);
    expect(firstItem!.notes).toEqual('Various office supplies');

    // Check second line item
    const secondItem = lineItems.find(item => item.description === 'Software License');
    expect(secondItem).toBeDefined();
    expect(secondItem!.quantity).toEqual(1);
    expect(parseFloat(secondItem!.unit_price)).toEqual(1000.00);
    expect(parseFloat(secondItem!.total_amount)).toEqual(1000.00);
    expect(secondItem!.notes).toBeNull();
  });

  it('should throw error when department does not exist', async () => {
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Invalid Department Test',
      description: 'Testing invalid department',
      department_id: 9999, // Non-existent department
      category_id: category.id,
      requested_amount: 500.00,
      justification: 'Invalid department test',
      priority: 'medium',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User',
      line_items: [
        {
          description: 'Test Item',
          quantity: 1,
          unit_price: 500.00,
          notes: null
        }
      ]
    };

    await expect(createBudgetRequest(testInput))
      .rejects.toThrow(/department not found/i);
  });

  it('should throw error when budget category does not exist', async () => {
    const department = await createTestDepartment();

    const testInput: CreateBudgetRequestInput = {
      title: 'Invalid Category Test',
      description: 'Testing invalid category',
      department_id: department.id,
      category_id: 8888, // Non-existent category
      requested_amount: 300.00,
      justification: 'Invalid category test',
      priority: 'critical',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User',
      line_items: [
        {
          description: 'Test Item',
          quantity: 1,
          unit_price: 300.00,
          notes: null
        }
      ]
    };

    await expect(createBudgetRequest(testInput))
      .rejects.toThrow(/budget category not found/i);
  });

  it('should throw error when requested amount does not match line items total', async () => {
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Amount Mismatch Test',
      description: 'Testing amount validation',
      department_id: department.id,
      category_id: category.id,
      requested_amount: 1500.00, // Doesn't match line items total (1200.00)
      justification: 'Amount mismatch test',
      priority: 'medium',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User',
      line_items: [
        {
          description: 'Item 1',
          quantity: 2,
          unit_price: 400.00,
          notes: null
        },
        {
          description: 'Item 2',
          quantity: 1,
          unit_price: 400.00,
          notes: null
        }
      ]
    };

    await expect(createBudgetRequest(testInput))
      .rejects.toThrow(/requested amount does not match/i);
  });

  it('should handle single line item correctly', async () => {
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();

    const testInput: CreateBudgetRequestInput = {
      title: 'Single Item Test',
      description: 'Testing single line item',
      department_id: department.id,
      category_id: category.id,
      requested_amount: 750.00,
      justification: 'Single item test',
      priority: 'high',
      fiscal_year: 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User',
      line_items: [
        {
          description: 'Single Item',
          quantity: 3,
          unit_price: 250.00,
          notes: 'This is the only item'
        }
      ]
    };

    const result = await createBudgetRequest(testInput);

    // Verify the request was created
    expect(result.requested_amount).toEqual(750.00);

    // Verify single line item was created
    const lineItems = await db.select()
      .from(budgetLineItemsTable)
      .where(eq(budgetLineItemsTable.budget_request_id, result.id))
      .execute();

    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].description).toEqual('Single Item');
    expect(parseFloat(lineItems[0].total_amount)).toEqual(750.00);
  });
});