import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetRequestsTable, departmentsTable, budgetCategoriesTable } from '../db/schema';
import { type UpdateBudgetRequestInput } from '../schema';
import { updateBudgetRequest } from '../handlers/update_budget_request';
import { eq } from 'drizzle-orm';

describe('updateBudgetRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  const createTestData = async () => {
    // Create department
    const department = await db.insert(departmentsTable)
      .values({
        name: 'Test Department',
        code: 'TEST',
        description: 'Test department',
        head_name: 'John Doe',
        contact_email: 'john@test.com',
        contact_phone: '123-456-7890'
      })
      .returning()
      .execute();

    // Create budget category
    const category = await db.insert(budgetCategoriesTable)
      .values({
        name: 'Test Category',
        code: 'TESTCAT',
        description: 'Test category'
      })
      .returning()
      .execute();

    // Create budget request
    const budgetRequest = await db.insert(budgetRequestsTable)
      .values({
        title: 'Original Budget Request',
        description: 'Original description',
        department_id: department[0].id,
        category_id: category[0].id,
        requested_amount: '50000.00',
        justification: 'Original justification',
        priority: 'medium',
        status: 'draft',
        fiscal_year: 2024,
        expected_start_date: new Date('2024-01-01'),
        expected_end_date: new Date('2024-12-31'),
        submitted_by: 'Test User'
      })
      .returning()
      .execute();

    return {
      department: department[0],
      category: category[0],
      budgetRequest: budgetRequest[0]
    };
  };

  it('should update basic budget request fields', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      title: 'Updated Budget Request',
      description: 'Updated description',
      requested_amount: 75000,
      justification: 'Updated justification',
      priority: 'high'
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testData.budgetRequest.id);
    expect(result!.title).toBe('Updated Budget Request');
    expect(result!.description).toBe('Updated description');
    expect(result!.requested_amount).toBe(75000);
    expect(typeof result!.requested_amount).toBe('number');
    expect(result!.justification).toBe('Updated justification');
    expect(result!.priority).toBe('high');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update status and handle status transitions', async () => {
    const testData = await createTestData();
    
    // Update to processing status
    const processingUpdate: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      status: 'processing'
    };

    const processingResult = await updateBudgetRequest(processingUpdate);

    expect(processingResult).not.toBeNull();
    expect(processingResult!.status).toBe('processing');
    expect(processingResult!.submitted_at).toBeInstanceOf(Date);
    expect(processingResult!.reviewed_at).toBeNull();

    // Update to approved status
    const approvedUpdate: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      status: 'approved',
      reviewed_by: 'Review Manager',
      review_notes: 'Budget approved for implementation'
    };

    const approvedResult = await updateBudgetRequest(approvedUpdate);

    expect(approvedResult).not.toBeNull();
    expect(approvedResult!.status).toBe('approved');
    expect(approvedResult!.reviewed_by).toBe('Review Manager');
    expect(approvedResult!.review_notes).toBe('Budget approved for implementation');
    expect(approvedResult!.reviewed_at).toBeInstanceOf(Date);
  });

  it('should update dates correctly', async () => {
    const testData = await createTestData();
    
    const newStartDate = new Date('2024-06-01');
    const newEndDate = new Date('2024-11-30');
    
    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      expected_start_date: newStartDate,
      expected_end_date: newEndDate,
      fiscal_year: 2025
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).not.toBeNull();
    expect(result!.expected_start_date).toBeInstanceOf(Date);
    expect(result!.expected_end_date).toBeInstanceOf(Date);
    expect(result!.expected_start_date.getTime()).toBe(newStartDate.getTime());
    expect(result!.expected_end_date.getTime()).toBe(newEndDate.getTime());
    expect(result!.fiscal_year).toBe(2025);
  });

  it('should update department and category relationships', async () => {
    const testData = await createTestData();
    
    // Create another department and category
    const newDepartment = await db.insert(departmentsTable)
      .values({
        name: 'New Department',
        code: 'NEW',
        description: 'New department',
        head_name: 'Jane Smith',
        contact_email: 'jane@test.com',
        contact_phone: '987-654-3210'
      })
      .returning()
      .execute();

    const newCategory = await db.insert(budgetCategoriesTable)
      .values({
        name: 'New Category',
        code: 'NEWCAT',
        description: 'New category'
      })
      .returning()
      .execute();

    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      department_id: newDepartment[0].id,
      category_id: newCategory[0].id
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).not.toBeNull();
    expect(result!.department_id).toBe(newDepartment[0].id);
    expect(result!.category_id).toBe(newCategory[0].id);
  });

  it('should handle partial updates correctly', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      title: 'Partially Updated Title'
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Partially Updated Title');
    // Original values should remain unchanged
    expect(result!.description).toBe(testData.budgetRequest.description);
    expect(result!.priority).toBe(testData.budgetRequest.priority);
    expect(parseFloat(result!.requested_amount.toString())).toBe(parseFloat(testData.budgetRequest.requested_amount));
  });

  it('should persist updates to database', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      title: 'Database Persisted Title',
      requested_amount: 100000,
      status: 'review'
    };

    await updateBudgetRequest(updateInput);

    // Verify changes are persisted in database
    const dbRecord = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, testData.budgetRequest.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].title).toBe('Database Persisted Title');
    expect(parseFloat(dbRecord[0].requested_amount)).toBe(100000);
    expect(dbRecord[0].status).toBe('review');
    expect(dbRecord[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent budget request', async () => {
    const updateInput: UpdateBudgetRequestInput = {
      id: 99999,
      title: 'Non-existent Update'
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).toBeNull();
  });

  it('should handle status transition edge cases', async () => {
    const testData = await createTestData();
    
    // First transition to processing
    await updateBudgetRequest({
      id: testData.budgetRequest.id,
      status: 'processing'
    });

    // Second transition to processing should not update submitted_at again
    const result1 = await updateBudgetRequest({
      id: testData.budgetRequest.id,
      status: 'processing'
    });

    // Move to review, then to approved
    await updateBudgetRequest({
      id: testData.budgetRequest.id,
      status: 'review'
    });

    const result2 = await updateBudgetRequest({
      id: testData.budgetRequest.id,
      status: 'approved'
    });

    // Second approval should not update reviewed_at again
    const result3 = await updateBudgetRequest({
      id: testData.budgetRequest.id,
      status: 'approved'
    });

    expect(result1!.submitted_at).toBeInstanceOf(Date);
    expect(result2!.reviewed_at).toBeInstanceOf(Date);
    expect(result3!.reviewed_at).toEqual(result2!.reviewed_at);
  });

  it('should handle rejected status transitions', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateBudgetRequestInput = {
      id: testData.budgetRequest.id,
      status: 'rejected',
      reviewed_by: 'Finance Manager',
      review_notes: 'Budget exceeds allocated funds'
    };

    const result = await updateBudgetRequest(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('rejected');
    expect(result!.reviewed_by).toBe('Finance Manager');
    expect(result!.review_notes).toBe('Budget exceeds allocated funds');
    expect(result!.reviewed_at).toBeInstanceOf(Date);
  });
});