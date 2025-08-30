import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetRequestsTable, departmentsTable, budgetCategoriesTable } from '../db/schema';
import { type GetBudgetRequestByIdInput } from '../schema';
import { submitBudgetRequest } from '../handlers/submit_budget_request';
import { eq } from 'drizzle-orm';

describe('submitBudgetRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test department
  const createTestDepartment = async () => {
    const result = await db.insert(departmentsTable)
      .values({
        name: 'Test Department',
        code: 'TEST',
        description: 'Test department for budget requests',
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
        code: 'TEST_CAT',
        description: 'Test category for budget requests'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test budget request in draft status
  const createDraftBudgetRequest = async (departmentId: number, categoryId: number) => {
    const result = await db.insert(budgetRequestsTable)
      .values({
        title: 'Test Budget Request',
        description: 'A test budget request for testing submission',
        department_id: departmentId,
        category_id: categoryId,
        requested_amount: '50000.00',
        justification: 'This budget is needed for testing purposes',
        priority: 'medium',
        status: 'draft',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should successfully submit a draft budget request', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    const draftRequest = await createDraftBudgetRequest(department.id, category.id);

    const input: GetBudgetRequestByIdInput = {
      id: draftRequest.id
    };

    const result = await submitBudgetRequest(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(draftRequest.id);
    expect(result!.status).toBe('processing');
    expect(result!.submitted_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.title).toBe('Test Budget Request');
    expect(result!.requested_amount).toBe(50000);
    expect(typeof result!.requested_amount).toBe('number');
  });

  it('should update database with new status and timestamps', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    const draftRequest = await createDraftBudgetRequest(department.id, category.id);

    const input: GetBudgetRequestByIdInput = {
      id: draftRequest.id
    };

    await submitBudgetRequest(input);

    // Query database to verify changes were persisted
    const updatedRequests = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, draftRequest.id))
      .execute();

    expect(updatedRequests).toHaveLength(1);
    const updatedRequest = updatedRequests[0];
    
    expect(updatedRequest.status).toBe('processing');
    expect(updatedRequest.submitted_at).toBeInstanceOf(Date);
    expect(updatedRequest.updated_at).toBeInstanceOf(Date);
    expect(updatedRequest.submitted_at!.getTime()).toBeGreaterThan(draftRequest.created_at.getTime());
  });

  it('should return null when budget request does not exist', async () => {
    const input: GetBudgetRequestByIdInput = {
      id: 999999
    };

    const result = await submitBudgetRequest(input);

    expect(result).toBeNull();
  });

  it('should throw error when budget request is not in draft status', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    
    // Create budget request with processing status
    const processingRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Processing Budget Request',
        description: 'A budget request already in processing',
        department_id: department.id,
        category_id: category.id,
        requested_amount: '30000.00',
        justification: 'Already processing request',
        priority: 'high',
        status: 'processing',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User',
        submitted_at: new Date()
      })
      .returning()
      .execute();

    const input: GetBudgetRequestByIdInput = {
      id: processingRequest[0].id
    };

    await expect(submitBudgetRequest(input)).rejects.toThrow(/cannot be submitted.*processing/i);
  });

  it('should throw error when required fields are missing', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    
    // Create incomplete budget request (missing description)
    const incompleteRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Incomplete Request',
        description: '', // Empty description
        department_id: department.id,
        category_id: category.id,
        requested_amount: '25000.00',
        justification: 'Some justification',
        priority: 'low',
        status: 'draft',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User'
      })
      .returning()
      .execute();

    const input: GetBudgetRequestByIdInput = {
      id: incompleteRequest[0].id
    };

    await expect(submitBudgetRequest(input)).rejects.toThrow(/incomplete.*required fields/i);
  });

  it('should throw error when submitted_by is missing', async () => {
    // Create prerequisite data
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    
    // Create budget request without submitter info
    const requestWithoutSubmitter = await db.insert(budgetRequestsTable)
      .values({
        title: 'Request Without Submitter',
        description: 'A complete description',
        department_id: department.id,
        category_id: category.id,
        requested_amount: '25000.00',
        justification: 'Complete justification',
        priority: 'low',
        status: 'draft',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: '' // Empty submitter
      })
      .returning()
      .execute();

    const input: GetBudgetRequestByIdInput = {
      id: requestWithoutSubmitter[0].id
    };

    await expect(submitBudgetRequest(input)).rejects.toThrow(/incomplete.*submitter information/i);
  });

  it('should validate all required fields are present', async () => {
    // This test verifies that the handler correctly validates complete budget requests
    // Since dates are enforced as non-null by the database schema, we test with valid dates
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    
    // Create a complete, valid draft request
    const completeRequest = await createDraftBudgetRequest(department.id, category.id);
    
    const input: GetBudgetRequestByIdInput = {
      id: completeRequest.id
    };

    // This should succeed since all required fields are present
    const result = await submitBudgetRequest(input);
    
    expect(result).not.toBeNull();
    expect(result!.status).toBe('processing');
    expect(result!.expected_start_date).toBeInstanceOf(Date);
    expect(result!.expected_end_date).toBeInstanceOf(Date);
  });

  it('should handle different budget request statuses correctly', async () => {
    const department = await createTestDepartment();
    const category = await createTestBudgetCategory();
    
    // Test with approved status
    const approvedRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Approved Request',
        description: 'Already approved request',
        department_id: department.id,
        category_id: category.id,
        requested_amount: '15000.00',
        justification: 'Already approved',
        priority: 'high',
        status: 'approved',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User',
        submitted_at: new Date(),
        reviewed_by: 'Reviewer',
        reviewed_at: new Date()
      })
      .returning()
      .execute();

    const input: GetBudgetRequestByIdInput = {
      id: approvedRequest[0].id
    };

    await expect(submitBudgetRequest(input)).rejects.toThrow(/cannot be submitted.*approved/i);
  });
});