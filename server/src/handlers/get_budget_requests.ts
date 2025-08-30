import { db } from '../db';
import { budgetRequestsTable, departmentsTable, budgetCategoriesTable } from '../db/schema';
import { type GetBudgetRequestsInput, type BudgetRequest } from '../schema';
import { eq, and, desc, count, type SQL } from 'drizzle-orm';

export async function getBudgetRequests(input: GetBudgetRequestsInput): Promise<{
    requests: BudgetRequest[];
    total: number;
    hasMore: boolean;
}> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    if (input.department_id !== undefined) {
      conditions.push(eq(budgetRequestsTable.department_id, input.department_id));
    }
    
    if (input.status !== undefined) {
      conditions.push(eq(budgetRequestsTable.status, input.status));
    }
    
    if (input.fiscal_year !== undefined) {
      conditions.push(eq(budgetRequestsTable.fiscal_year, input.fiscal_year));
    }
    
    if (input.priority !== undefined) {
      conditions.push(eq(budgetRequestsTable.priority, input.priority));
    }

    // Build base query for requests with joins
    const baseRequestsQuery = db.select()
      .from(budgetRequestsTable)
      .innerJoin(departmentsTable, eq(budgetRequestsTable.department_id, departmentsTable.id))
      .innerJoin(budgetCategoriesTable, eq(budgetRequestsTable.category_id, budgetCategoriesTable.id));

    // Build the final requests query with conditions
    const requestsQuery = conditions.length > 0
      ? baseRequestsQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(budgetRequestsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
      : baseRequestsQuery
          .orderBy(desc(budgetRequestsTable.created_at))
          .limit(input.limit)
          .offset(input.offset);

    // Build count query
    const baseCountQuery = db.select({ count: count() }).from(budgetRequestsTable);
    
    const countQuery = conditions.length > 0
      ? baseCountQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseCountQuery;

    // Execute both queries
    const [requestsResult, countResult] = await Promise.all([
      requestsQuery.execute(),
      countQuery.execute()
    ]);

    // Transform results - joined data is nested
    const requests: BudgetRequest[] = requestsResult.map(result => {
      const request = result.budget_requests;
      return {
        ...request,
        requested_amount: parseFloat(request.requested_amount) // Convert numeric to number
      };
    });

    const total = countResult[0].count;
    const hasMore = input.offset + input.limit < total;

    return {
      requests,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Get budget requests failed:', error);
    throw error;
  }
}