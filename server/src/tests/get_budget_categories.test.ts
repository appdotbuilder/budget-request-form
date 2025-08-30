import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetCategoriesTable } from '../db/schema';
import { type CreateBudgetCategoryInput } from '../schema';
import { getBudgetCategories } from '../handlers/get_budget_categories';

describe('getBudgetCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getBudgetCategories();

    expect(result).toEqual([]);
  });

  it('should fetch all budget categories', async () => {
    // Create test categories
    const testCategories = [
      {
        name: 'Equipment and Infrastructure',
        code: 'EQP',
        description: 'Funding for equipment purchases and infrastructure development'
      },
      {
        name: 'Personnel and Training', 
        code: 'PER',
        description: 'Funding for personnel costs and training programs'
      },
      {
        name: 'Research and Development',
        code: 'RND',
        description: 'Funding for research projects and development activities'
      }
    ];

    // Insert test data
    await db.insert(budgetCategoriesTable)
      .values(testCategories)
      .execute();

    const result = await getBudgetCategories();

    expect(result).toHaveLength(3);
    
    // Verify all expected fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.code).toBeDefined();
      expect(category.description).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
    });

    // Verify specific data
    expect(result.find(c => c.code === 'EQP')?.name).toEqual('Equipment and Infrastructure');
    expect(result.find(c => c.code === 'PER')?.name).toEqual('Personnel and Training');
    expect(result.find(c => c.code === 'RND')?.name).toEqual('Research and Development');
  });

  it('should return categories ordered by name alphabetically', async () => {
    // Create test categories in non-alphabetical order
    const testCategories = [
      {
        name: 'Zebra Category',
        code: 'ZBR',
        description: 'Last alphabetically'
      },
      {
        name: 'Alpha Category',
        code: 'ALP',
        description: 'First alphabetically'
      },
      {
        name: 'Beta Category',
        code: 'BET',
        description: 'Second alphabetically'
      }
    ];

    // Insert test data
    await db.insert(budgetCategoriesTable)
      .values(testCategories)
      .execute();

    const result = await getBudgetCategories();

    expect(result).toHaveLength(3);
    
    // Verify alphabetical ordering by name
    expect(result[0].name).toEqual('Alpha Category');
    expect(result[1].name).toEqual('Beta Category');
    expect(result[2].name).toEqual('Zebra Category');
  });

  it('should handle categories with null descriptions', async () => {
    // Create category with null description
    const testCategory = {
      name: 'Test Category',
      code: 'TST',
      description: null
    };

    await db.insert(budgetCategoriesTable)
      .values([testCategory])
      .execute();

    const result = await getBudgetCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Category');
    expect(result[0].code).toEqual('TST');
    expect(result[0].description).toBeNull();
  });

  it('should handle large number of categories', async () => {
    // Create multiple categories to test performance and ordering
    const testCategories = Array.from({ length: 10 }, (_, index) => ({
      name: `Category ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
      code: `CT${index.toString().padStart(2, '0')}`,
      description: `Description for category ${index + 1}`
    }));

    await db.insert(budgetCategoriesTable)
      .values(testCategories)
      .execute();

    const result = await getBudgetCategories();

    expect(result).toHaveLength(10);
    
    // Verify alphabetical ordering
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].name <= result[i].name).toBe(true);
    }

    // Verify first and last items
    expect(result[0].name).toEqual('Category A');
    expect(result[result.length - 1].name).toEqual('Category J');
  });

  it('should preserve all category data fields correctly', async () => {
    const testCategory = {
      name: 'Complete Category Test',
      code: 'CCT',
      description: 'A category with all fields populated for testing'
    };

    const insertResult = await db.insert(budgetCategoriesTable)
      .values([testCategory])
      .returning()
      .execute();

    const result = await getBudgetCategories();

    expect(result).toHaveLength(1);
    
    const category = result[0];
    expect(category.id).toEqual(insertResult[0].id);
    expect(category.name).toEqual(testCategory.name);
    expect(category.code).toEqual(testCategory.code);
    expect(category.description).toEqual(testCategory.description);
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.created_at).toEqual(insertResult[0].created_at);
  });
});