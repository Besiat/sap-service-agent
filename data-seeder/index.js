const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Load data
const TENANTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tenants.json'), 'utf8'));
const USERS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
const SAMPLE_SERVICE_CALLS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'service-calls.json'), 'utf8'));

// Simple API client with retry
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Simplified retry wrapper
async function apiCall(request) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Simplified error handler for conflicts
async function createOrSkip(createFn, resourceName) {
  try {
    return await createFn();
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`${resourceName} already exists, skipping...`);
      return null;
    }
    console.log(`Failed to create ${resourceName}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function seedTenants() {
  console.log('Creating tenants...');
  const tenants = [];
  
  for (const tenant of TENANTS) {
    const result = await createOrSkip(
      () => apiCall(() => api.post('/auth/tenants', tenant)),
      `tenant "${tenant.name}"`
    );
    if (result) {
      console.log(`Created tenant: ${tenant.name}`);
      tenants.push(result.data);
    }
  }
  
  // Get all existing tenants to handle conflicts
  const allTenants = await apiCall(() => api.get('/auth/tenants'));
  return allTenants.data.tenants;
}

async function seedUsers(tenants) {
  console.log('Creating users...');
  const users = [];
  
  for (const user of USERS) {
    const tenant = tenants.find(t => t.name === user.tenantName);
    if (!tenant) {
      console.log(`No tenant found for user ${user.username}`);
      continue;
    }

    const result = await createOrSkip(
      () => apiCall(() => api.post('/auth/register', {
        username: user.username,
        password: user.password,
        tenantId: tenant.id
      })),
      `user "${user.username}"`
    );
    
    let userId = null;
    if (result) {
      console.log(`Created user: ${user.username} in ${tenant.name}`);
      userId = result.data.user.id;
    } else {
      // User already exists, try to login to get user ID
      try {
        const loginResponse = await apiCall(() => api.post('/auth/login', {
          username: user.username,
          password: user.password,
          tenantId: tenant.id
        }));
        userId = loginResponse.data.user.id;
        console.log(`Retrieved existing user ID for: ${user.username}`);
      } catch (error) {
        console.log(`Could not retrieve user ID for ${user.username}`);
      }
    }
    
    // Add to users list with user ID
    users.push({ ...user, tenantId: tenant.id, userId });
  }
  
  return users;
}

async function assignAdminToAllTenants(users, tenants) {
  console.log('Assigning admin_user to all tenants...');
  
  const adminUser = users.find(user => user.username === 'admin_user');
  if (!adminUser?.userId) {
    console.log('Admin user not found, skipping tenant assignments');
    return;
  }

  for (const tenant of tenants) {
    if (tenant.id === adminUser.tenantId) continue; // Skip original tenant
    
    await createOrSkip(
      () => apiCall(() => api.post('/auth/users/add-to-tenant', {
        userId: adminUser.userId,
        tenantId: tenant.id
      })),
      `admin_user to ${tenant.name}`
    );
  }
}

async function seedServiceCalls(users, tenants) {
  console.log('Creating service calls...');
  let created = 0;
  
  for (const tenant of tenants) {
    try {
      // Find any user from this tenant to create service calls
      const tenantUser = users.find(user => user.tenantId === tenant.id);
      if (!tenantUser) {
        console.log(`No users found for tenant ${tenant.name}, skipping service calls`);
        continue;
      }
      
      // Login with the tenant user
      const loginResponse = await apiCall(() => api.post('/auth/login', {
        username: tenantUser.username,
        password: tenantUser.password,
        tenantId: tenant.id
      }));
      
      const headers = { 'Authorization': `Bearer ${loginResponse.data.access_token}` };
      
      
      for (const serviceCall of SAMPLE_SERVICE_CALLS) {
        const randomDelay = Math.random() * 10 * 60 * 1000;
        const scheduledAt = new Date(Date.now() + randomDelay).toISOString();
        
        const result = await createOrSkip(
          () => apiCall(() => api.post('/service-call', {
            ...serviceCall,
            scheduledAt
          }, { headers })),
          `service call "${serviceCall.name}" for tenant ${tenant.name}`
        );
        
        if (result) {
          created++;
          console.log(`  ✓ Created "${serviceCall.name}"`);
        }
      }
    } catch (error) {
      console.log(`Failed to create service calls for tenant ${tenant.name}: ${error.message}`);
    }
  }
  
  console.log(`\nTotal service calls created: ${created}`);
}

async function seed() {
  try {
    console.log('Starting data seeding...\n');
    
    const tenants = await seedTenants();
    const users = await seedUsers(tenants);
    await assignAdminToAllTenants(users, tenants);
    await seedServiceCalls(users, tenants);
    
    console.log('\nData seeding completed!');
    console.log('\nTest credentials:');
    users.forEach(user => {
      console.log(`  ${user.username} / ${user.password} (${user.tenantName})`);
    });
    console.log(`\nAPI: ${BACKEND_URL}`);
    console.log(`Swagger: ${BACKEND_URL}/api`);
    
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
