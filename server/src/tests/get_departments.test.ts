import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { departmentsTable } from '../db/schema';
import { type CreateDepartmentInput } from '../schema';
import { getDepartments } from '../handlers/get_departments';

// Test department data
const testDepartments: CreateDepartmentInput[] = [
  {
    name: 'Wildlife Management Department',
    code: 'WMD',
    description: 'Manages wildlife conservation programs',
    head_name: 'Dr. Sarah Johnson',
    contact_email: 'wmd@forestry.gov',
    contact_phone: '+1-555-0123'
  },
  {
    name: 'Forest Research Institute',
    code: 'FRI',
    description: 'Conducts forestry research and development',
    head_name: 'Prof. Michael Chen',
    contact_email: 'fri@forestry.gov',
    contact_phone: '+1-555-0456'
  },
  {
    name: 'Ecosystem Services Department',
    code: 'ESD',
    description: 'Focuses on ecosystem service valuation',
    head_name: 'Dr. Maria Rodriguez',
    contact_email: 'esd@forestry.gov',
    contact_phone: null
  }
];

describe('getDepartments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no departments exist', async () => {
    const result = await getDepartments();
    expect(result).toEqual([]);
  });

  it('should return all departments ordered by name', async () => {
    // Insert test departments
    await db.insert(departmentsTable).values(testDepartments).execute();

    const result = await getDepartments();

    // Verify all departments are returned
    expect(result).toHaveLength(3);

    // Verify alphabetical ordering by name
    expect(result[0].name).toEqual('Ecosystem Services Department');
    expect(result[1].name).toEqual('Forest Research Institute');
    expect(result[2].name).toEqual('Wildlife Management Department');

    // Verify all required fields are present
    result.forEach(department => {
      expect(department.id).toBeDefined();
      expect(typeof department.id).toBe('number');
      expect(department.name).toBeDefined();
      expect(department.code).toBeDefined();
      expect(department.head_name).toBeDefined();
      expect(department.contact_email).toBeDefined();
      expect(department.created_at).toBeInstanceOf(Date);
      expect(department.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return departments with correct data types and values', async () => {
    // Insert single department for detailed testing
    await db.insert(departmentsTable).values([testDepartments[0]]).execute();

    const result = await getDepartments();

    expect(result).toHaveLength(1);
    
    const department = result[0];
    expect(department.name).toEqual('Wildlife Management Department');
    expect(department.code).toEqual('WMD');
    expect(department.description).toEqual('Manages wildlife conservation programs');
    expect(department.head_name).toEqual('Dr. Sarah Johnson');
    expect(department.contact_email).toEqual('wmd@forestry.gov');
    expect(department.contact_phone).toEqual('+1-555-0123');
    expect(department.created_at).toBeInstanceOf(Date);
    expect(department.updated_at).toBeInstanceOf(Date);
  });

  it('should handle departments with null optional fields', async () => {
    // Insert department with null optional fields
    await db.insert(departmentsTable).values([testDepartments[2]]).execute();

    const result = await getDepartments();

    expect(result).toHaveLength(1);
    
    const department = result[0];
    expect(department.name).toEqual('Ecosystem Services Department');
    expect(department.description).toEqual('Focuses on ecosystem service valuation');
    expect(department.contact_phone).toBeNull();
  });

  it('should maintain consistent ordering with multiple departments', async () => {
    // Add more departments to test ordering stability
    const additionalDepartments: CreateDepartmentInput[] = [
      {
        name: 'Administrative Services',
        code: 'ADM',
        description: 'Handles administrative functions',
        head_name: 'Jane Smith',
        contact_email: 'admin@forestry.gov',
        contact_phone: '+1-555-9999'
      },
      {
        name: 'Timber Operations Department',
        code: 'TOD',
        description: 'Manages sustainable timber operations',
        head_name: 'Robert Brown',
        contact_email: 'timber@forestry.gov',
        contact_phone: '+1-555-7777'
      }
    ];

    await db.insert(departmentsTable)
      .values([...testDepartments, ...additionalDepartments])
      .execute();

    const result = await getDepartments();

    expect(result).toHaveLength(5);
    
    // Verify complete alphabetical ordering
    const expectedOrder = [
      'Administrative Services',
      'Ecosystem Services Department', 
      'Forest Research Institute',
      'Timber Operations Department',
      'Wildlife Management Department'
    ];

    result.forEach((department, index) => {
      expect(department.name).toEqual(expectedOrder[index]);
    });
  });

  it('should preserve database-generated timestamps and IDs', async () => {
    await db.insert(departmentsTable).values([testDepartments[0]]).execute();

    // Wait a moment to ensure timestamps are different if we insert again
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await getDepartments();
    const department = result[0];

    // Verify ID is a positive integer
    expect(department.id).toBeGreaterThan(0);
    expect(Number.isInteger(department.id)).toBe(true);

    // Verify timestamps are recent
    const now = new Date();
    const timeDiff = now.getTime() - department.created_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    expect(department.updated_at).toEqual(department.created_at);
  });
});