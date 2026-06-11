require('dotenv').config();
const mongoose = require('mongoose');

// We'll simulate API calls using the services directly
const { signToken } = require('./src/utils/jwt');
const StorageFactory = require('./src/storage/storageFactory');

async function testIsolation() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('=== DATA ISOLATION TESTS ===\n');

    // Two users with different storage types
    const userA = { email: 'alice@test.com', storage_type: 'file' };
    const userB = { email: 'bob@test.com', storage_type: 'file' };

    const handlerA = StorageFactory.createHandler(userA.storage_type);
    const handlerB = StorageFactory.createHandler(userB.storage_type);

    // User A creates a record
    await handlerA.create(userA.email, 'records', { id: 'secret-record', firstName: 'Secret', lastName: 'Data' });
    console.log('User A created a record: secret-record');

    // User A can read their own record
    await handlerA.create(userA.email, { id: 'secret-record', firstName: 'Secret', lastName: 'Data' });
    const aReadsOwn = await handlerA.read(userA.email, 'secret-record');

    // User B tries to read User A's record
    const bReadsA = await handlerB.read(userB.email, 'records', 'secret-record');
    console.log('User B reads User A record:', bReadsA ? 'FOUND (SECURITY BUG!)' : 'null (correct - isolated)');

    // User B's readAll should NOT include User A's data
    const bAll = await handlerB.readAll(userB.email, 'records');
    console.log('User B readAll:', bAll.length === 0 ? 'empty (correct)' : `HAS ${bAll.length} records (SECURITY BUG!)`);

    // Cleanup
    await handlerA.delete(userA.email, 'records', 'secret-record');

    console.log('\n=== ISOLATION TEST COMPLETE ===');
    await mongoose.disconnect();
}

testIsolation().catch(console.error);