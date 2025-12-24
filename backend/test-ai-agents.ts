// @ts-nocheck
const { db } = require('./db/index');
const { users, aiAgents } = require('./db/schema');
const { eq } = require('drizzle-orm');
const { handler: createHandler } = require('./steps/06-ai-agents-create.step');
const { handler: updateHandler } = require('./steps/06-ai-agents-update.step');
const { handler: deleteHandler } = require('./steps/06-ai-agents-delete.step');
const { handler: listHandler } = require('./steps/06-ai-agents.step');

const mockEmit = async (args) => {
    console.log('[EMIT]', args);
};

const mockLogger = {
    info: (msg, meta) => console.log('[INFO]', msg, meta),
    error: (msg, meta) => console.error('[ERROR]', msg, meta),
};

async function runTest() {
    console.log('--- Starting AI Agents Test ---');

    // 1. Create a mock seller
    const sellerId = `test_seller_${Date.now()}`;
    // Insert might fail if role enum constraint exists in DB but not schema? Schema says string.
    await db.insert(users).values({
        id: sellerId,
        email: `seller${Date.now()}@example.com`,
        password: 'password',
        name: 'Test Seller',
        role: 'seller',
    }).run();
    console.log('Created test seller:', sellerId);

    // 2. Buy/Create Agent
    console.log('\n--- Testing Create Agent ---');
    const createReq = {
        body: {
            sellerId,
            name: 'Test Voice Agent',
            systemPrompt: 'You are a helpful assistant.',
            voiceConfig: {
                provider: 'elevenlabs',
                voiceId: 'xyz123',
            },
        },
    };

    const createRes = await createHandler(createReq, { emit: mockEmit, logger: mockLogger });
    console.log('Create Response:', createRes);

    if (createRes.status !== 201) {
        console.error('Failed to create agent');
        return;
    }

    const agentId = createRes.body.agent.id;

    // 3. Verify in DB
    const agentInDb = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
    console.log('Agent in DB:', agentInDb ? 'Found' : 'Not Found');
    if (agentInDb) {
        console.log('Voice Config:', agentInDb.voiceConfig);
    }

    // 4. Update Agent
    console.log('\n--- Testing Update Agent ---');
    const updateReq = {
        params: { id: agentId },
        body: {
            name: 'Updated Agent Name',
            voiceConfig: {
                provider: 'openai',
                voiceId: 'alloy',
            }
        },
    };

    const updateRes = await updateHandler(updateReq, { emit: mockEmit, logger: mockLogger });
    console.log('Update Response:', updateRes);

    // Verify update
    const updatedAgent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
    console.log('Updated Name:', updatedAgent?.name);
    console.log('Updated Voice Config:', updatedAgent?.voiceConfig);

    // 5. List Agents
    console.log('\n--- Testing List Agents ---');
    const listReq = {
        query: { sellerId },
    };
    const listRes = await listHandler(listReq, { logger: mockLogger });
    console.log('List Response:', JSON.stringify(listRes.body, null, 2));

    // 6. Delete Agent
    console.log('\n--- Testing Delete Agent ---');
    const deleteReq = {
        params: { id: agentId },
    };
    const deleteRes = await deleteHandler(deleteReq, { emit: mockEmit, logger: mockLogger });
    console.log('Delete Response:', deleteRes);

    // Verify deletion
    const deletedAgent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
    console.log('Agent after delete:', deletedAgent ? 'Still exists' : 'Deleted successfully');

    // Cleanup seller
    await db.delete(users).where(eq(users.id, sellerId)).run();
    console.log('\n--- Test Complete ---');
}

runTest().catch(console.error);
