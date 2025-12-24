
// Integration test for AI Agents API
// Using fetch to hit localhost:3000

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting AI Agents API Test ---');
    const timestamp = Date.now();
    const email = `seller${timestamp}@example.com`;

    // 1. Register Seller (POST)
    console.log('\n[TEST] Register Seller');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: 'password123',
            name: 'Test Seller API',
            role: 'seller',
            organization: 'Test Org'
        })
    });

    if (regRes.status !== 201) {
        console.error('Failed to register seller:', regRes.status, await regRes.text());
        return;
    }

    const regData = await regRes.json();
    console.log('Registration Success');
    const sellerId = regData.user.id;
    console.log('Seller ID:', sellerId);

    // 2. Create Agent (POST)
    console.log('\n[TEST] Create Agent');
    const createRes = await fetch(`${BASE_URL}/ai-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sellerId,
            name: 'API Test Agent',
            systemPrompt: 'Integration testing prompt',
            voiceConfig: { provider: 'google', voiceId: 'en-US-Standard-A' }
        })
    });

    if (createRes.status !== 201) {
        console.error('Failed to create agent:', createRes.status, await createRes.text());
        return;
    }

    const createData = await createRes.json();
    console.log('Create Success:', createData);
    const agentId = createData.agent.id;

    // 3. List Agents (GET)
    console.log('\n[TEST] List Agents');
    const listRes = await fetch(`${BASE_URL}/ai-agents?sellerId=${sellerId}`);
    if (listRes.status !== 200) {
        console.error('Failed to list agents:', listRes.status, await listRes.text());
    } else {
        const listData = await listRes.json();
        console.log('List Result:', listData.agents.length === 1 ? 'PASS' : 'FAIL', `Count: ${listData.agents.length}`);
    }

    // 4. Update Agent (PUT)
    console.log('\n[TEST] Update Agent');
    const updateRes = await fetch(`${BASE_URL}/ai-agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'API Updated Agent',
            status: 'inactive'
        })
    });

    if (updateRes.status !== 200) {
        console.error('Failed to update agent:', updateRes.status, await updateRes.text());
    } else {
        console.log('Update Success');
    }

    // Verify Update via List
    const listRes2 = await fetch(`${BASE_URL}/ai-agents?sellerId=${sellerId}`);
    const listData2 = await listRes2.json();
    const updatedAgent = listData2.agents.find(a => a.id === agentId);
    console.log('Verify Update:', updatedAgent.name === 'API Updated Agent' ? 'PASS' : 'FAIL');

    // 5. Delete Agent (DELETE)
    console.log('\n[TEST] Delete Agent');
    const deleteRes = await fetch(`${BASE_URL}/ai-agents/${agentId}`, {
        method: 'DELETE'
    });

    if (deleteRes.status !== 200) {
        console.error('Failed to delete agent:', deleteRes.status, await deleteRes.text());
    } else {
        console.log('Delete Success');
    }

    // Verify Deletion
    const listRes3 = await fetch(`${BASE_URL}/ai-agents?sellerId=${sellerId}`);
    const listData3 = await listRes3.json();
    console.log('Verify Deletion:', listData3.agents.length === 0 ? 'PASS' : 'FAIL');

    console.log('\n--- Test Complete ---');
}

runTest().catch(console.error);
