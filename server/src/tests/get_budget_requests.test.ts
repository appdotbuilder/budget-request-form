import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { departmentsTable, budgetCategoriesTable, budgetRequestsTable } from '../db/schema';
import { type GetBudgetRequestsInput } from '../schema';
import { getBudgetRequests } from '../handlers/get_budget_requests';

// Test data setup helpers
const createTestDepartment = async () => {
  const result = await db.insert(departmentsTable)
    .values({
      name: 'Engineering',
      code: 'ENG',
      description: 'Engineering Department',
      head_name: 'John Doe',
      contact_email: 'john@company.com',
      contact_phone: '555-0123'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestCategory = async () => {
  const result = await db.insert(budgetCategoriesTable)
    .values({
      name: 'Software',
      code: 'SW',
      description: 'Software and licenses'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestBudgetRequest = async (
  departmentId: number,
  categoryId: number,
  overrides: Partial<{
    status: 'draft' | 'processing' | 'review' | 'approved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'critical';
    fiscal_year: number;
    requested_amount: string;
    title: string;
  }> = {}
) => {
  const result = await db.insert(budgetRequestsTable)
    .values({
      title: overrides.title || 'Test Budget Request',
      description: 'A test budget request for testing purposes',
      department_id: departmentId,
      category_id: categoryId,
      requested_amount: overrides.requested_amount || '10000.00',
      justification: 'This is needed for testing',
      priority: overrides.priority || 'medium',
      status: overrides.status || 'draft',
      fiscal_year: overrides.fiscal_year || 2024,
      expected_start_date: new Date('2024-01-01'),
      expected_end_date: new Date('2024-12-31'),
      submitted_by: 'Test User'
    })
    .returning()
    .execute();
  return result[0];
};

describe('getBudgetRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty result when no budget requests exist', async () => {
    const input: GetBudgetRequestsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should return all budget requests with default pagination', async () => {
    // Create test data
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    // Create multiple budget requests
    await createTestBudgetRequest(department.id, category.id, { title: 'Request 1' });
    await createTestBudgetRequest(department.id, category.id, { title: 'Request 2' });
    await createTestBudgetRequest(department.id, category.id, { title: 'Request 3' });

    const input: GetBudgetRequestsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(false);
    
    // Verify numeric conversion
    result.requests.forEach(request => {
      expect(typeof request.requested_amount).toBe('number');
      expect(request.requested_amount).toBe(10000);
    });
    
    // Verify ordering (most recent first)
    expect(result.requests[0].title).toBe('Request 3');
    expect(result.requests[1].title).toBe('Request 2');
    expect(result.requests[2].title).toBe('Request 1');
  });

  it('should filter by department_id', async () => {
    // Create test departments
    const dept1 = await createTestDepartment();
    const dept2 = await db.insert(departmentsTable)
      .values({
        name: 'Marketing',
        code: 'MKT',
        description: 'Marketing Department',
        head_name: 'Jane Smith',
        contact_email: 'jane@company.com',
        contact_phone: '555-0456'
      })
      .returning()
      .execute();
    
    const category = await createTestCategory();
    
    // Create requests for both departments
    await createTestBudgetRequest(dept1.id, category.id, { title: 'Engineering Request' });
    await createTestBudgetRequest(dept2[0].id, category.id, { title: 'Marketing Request' });

    const input: GetBudgetRequestsInput = {
      department_id: dept1.id,
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.requests[0].title).toBe('Engineering Request');
    expect(result.requests[0].department_id).toBe(dept1.id);
  });

  it('should filter by status', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    // Create requests with different statuses
    await createTestBudgetRequest(department.id, category.id, { status: 'draft', title: 'Draft Request' });
    await createTestBudgetRequest(department.id, category.id, { status: 'approved', title: 'Approved Request' });
    await createTestBudgetRequest(department.id, category.id, { status: 'rejected', title: 'Rejected Request' });

    const input: GetBudgetRequestsInput = {
      status: 'approved',
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.requests[0].title).toBe('Approved Request');
    expect(result.requests[0].status).toBe('approved');
  });

  it('should filter by fiscal_year', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    // Create requests for different fiscal years
    await createTestBudgetRequest(department.id, category.id, { fiscal_year: 2023, title: '2023 Request' });
    await createTestBudgetRequest(department.id, category.id, { fiscal_year: 2024, title: '2024 Request' });
    await createTestBudgetRequest(department.id, category.id, { fiscal_year: 2025, title: '2025 Request' });

    const input: GetBudgetRequestsInput = {
      fiscal_year: 2024,
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.requests[0].title).toBe('2024 Request');
    expect(result.requests[0].fiscal_year).toBe(2024);
  });

  it('should filter by priority', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    // Create requests with different priorities
    await createTestBudgetRequest(department.id, category.id, { priority: 'low', title: 'Low Priority' });
    await createTestBudgetRequest(department.id, category.id, { priority: 'high', title: 'High Priority' });
    await createTestBudgetRequest(department.id, category.id, { priority: 'critical', title: 'Critical Priority' });

    const input: GetBudgetRequestsInput = {
      priority: 'critical',
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.requests[0].title).toBe('Critical Priority');
    expect(result.requests[0].priority).toBe('critical');
  });

  it('should apply multiple filters correctly', async () => {
    const dept1 = await createTestDepartment();
    const dept2 = await db.insert(departmentsTable)
      .values({
        name: 'HR',
        code: 'HR',
        description: 'Human Resources',
        head_name: 'Bob Wilson',
        contact_email: 'bob@company.com',
        contact_phone: '555-0789'
      })
      .returning()
      .execute();
    
    const category = await createTestCategory();
    
    // Create requests with various combinations
    await createTestBudgetRequest(dept1.id, category.id, {
      status: 'approved',
      fiscal_year: 2024,
      priority: 'high',
      title: 'Match All Filters'
    });
    
    await createTestBudgetRequest(dept1.id, category.id, {
      status: 'draft',
      fiscal_year: 2024,
      priority: 'high',
      title: 'Wrong Status'
    });
    
    await createTestBudgetRequest(dept2[0].id, category.id, {
      status: 'approved',
      fiscal_year: 2024,
      priority: 'high',
      title: 'Wrong Department'
    });

    const input: GetBudgetRequestsInput = {
      department_id: dept1.id,
      status: 'approved',
      fiscal_year: 2024,
      priority: 'high',
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.requests[0].title).toBe('Match All Filters');
  });

  it('should handle pagination correctly', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    // Create 5 requests
    for (let i = 1; i <= 5; i++) {
      await createTestBudgetRequest(department.id, category.id, {
        title: `Request ${i}`,
        requested_amount: `${i * 1000}.00`
      });
    }

    // Test first page
    const firstPageInput: GetBudgetRequestsInput = {
      limit: 2,
      offset: 0
    };

    const firstPage = await getBudgetRequests(firstPageInput);

    expect(firstPage.requests).toHaveLength(2);
    expect(firstPage.total).toBe(5);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.requests[0].title).toBe('Request 5'); // Most recent first
    expect(firstPage.requests[1].title).toBe('Request 4');

    // Test second page
    const secondPageInput: GetBudgetRequestsInput = {
      limit: 2,
      offset: 2
    };

    const secondPage = await getBudgetRequests(secondPageInput);

    expect(secondPage.requests).toHaveLength(2);
    expect(secondPage.total).toBe(5);
    expect(secondPage.hasMore).toBe(true);
    expect(secondPage.requests[0].title).toBe('Request 3');
    expect(secondPage.requests[1].title).toBe('Request 2');

    // Test last page
    const lastPageInput: GetBudgetRequestsInput = {
      limit: 2,
      offset: 4
    };

    const lastPage = await getBudgetRequests(lastPageInput);

    expect(lastPage.requests).toHaveLength(1);
    expect(lastPage.total).toBe(5);
    expect(lastPage.hasMore).toBe(false);
    expect(lastPage.requests[0].title).toBe('Request 1');
  });

  it('should handle edge case with offset beyond total count', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    await createTestBudgetRequest(department.id, category.id);

    const input: GetBudgetRequestsInput = {
      limit: 10,
      offset: 100 // Way beyond the single record
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(0);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should return all required budget request fields', async () => {
    const department = await createTestDepartment();
    const category = await createTestCategory();
    
    const testRequest = await createTestBudgetRequest(department.id, category.id, {
      status: 'approved',
      priority: 'critical',
      fiscal_year: 2024,
      requested_amount: '15000.50'
    });

    const input: GetBudgetRequestsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getBudgetRequests(input);

    expect(result.requests).toHaveLength(1);
    const request = result.requests[0];

    // Verify all required fields are present
    expect(request.id).toBe(testRequest.id);
    expect(request.title).toBe('Test Budget Request');
    expect(request.description).toBe('A test budget request for testing purposes');
    expect(request.department_id).toBe(department.id);
    expect(request.category_id).toBe(category.id);
    expect(request.requested_amount).toBe(15000.5); // Numeric conversion
    expect(request.justification).toBe('This is needed for testing');
    expect(request.priority).toBe('critical');
    expect(request.status).toBe('approved');
    expect(request.fiscal_year).toBe(2024);
    expect(request.expected_start_date).toBeInstanceOf(Date);
    expect(request.expected_end_date).toBeInstanceOf(Date);
    expect(request.submitted_by).toBe('Test User');
    expect(request.created_at).toBeInstanceOf(Date);
    expect(request.updated_at).toBeInstanceOf(Date);
  });
});