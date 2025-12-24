import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(), // 'buyer', 'seller', 'agent'
    phone: text('phone'),
    organization: text('organization'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const properties = sqliteTable('properties', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    propertyType: text('property_type').notNull(),
    price: integer('price').notNull(),
    location: text('location', { mode: 'json' }).notNull(), // JSON string
    size: integer('size').notNull(),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    amenities: text('amenities', { mode: 'json' }), // JSON string
    images: text('images', { mode: 'json' }), // JSON string
    sellerId: text('seller_id').notNull().references(() => users.id),
    status: text('status').notNull().default('pending'),
    views: integer('views').default(0),
    inquiries: integer('inquiries').default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const carts = sqliteTable('carts', {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    propertyId: text('property_id').notNull().references(() => properties.id),
    notes: text('notes'),
    addedAt: integer('added_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const leads = sqliteTable('leads', {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    propertyId: text('property_id').notNull().references(() => properties.id),
    sellerId: text('seller_id').notNull().references(() => users.id),
    status: text('status').notNull().default('new'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const agentAssignments = sqliteTable('agent_assignments', {
    id: text('id').primaryKey(),
    sellerId: text('seller_id').notNull().references(() => users.id),
    agentId: text('agent_id').notNull().references(() => users.id),
    agentName: text('agent_name').notNull(),
    subscription: text('subscription').notNull(),
    status: text('status').notNull().default('active'),
    leadsAssigned: integer('leads_assigned').default(0),
    conversions: integer('conversions').default(0),
    startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const aiAgents = sqliteTable('ai_agents', {
    id: text('id').primaryKey(),
    sellerId: text('seller_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    voiceConfig: text('voice_config', { mode: 'json' }).notNull(), // JSON string for voice settings
    systemPrompt: text('system_prompt').notNull(),
    status: text('status').notNull().default('active'), // 'active', 'inactive'
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

// Subscriptions table - links agents (AI/Human) to sellers with billing cycles
export const subscriptions = sqliteTable('subscriptions', {
    id: text('id').primaryKey(),
    sellerId: text('seller_id').notNull().references(() => users.id),
    agentId: text('agent_id').notNull(), // Can reference AI or human agent
    agentType: text('agent_type').notNull(), // 'ai' or 'human'
    plan: text('plan').notNull(), // 'monthly', 'quarterly', 'yearly'
    pricePerMonth: integer('price_per_month').notNull(), // in cents
    status: text('status').notNull().default('active'), // 'active', 'cancelled', 'past_due'
    currentPeriodStart: integer('current_period_start', { mode: 'timestamp_ms' }).notNull(),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

// Transactions table - payment events
export const transactions = sqliteTable('transactions', {
    id: text('id').primaryKey(),
    sellerId: text('seller_id').notNull().references(() => users.id),
    subscriptionId: text('subscription_id').references(() => subscriptions.id),
    amount: integer('amount').notNull(), // in cents
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull(), // 'pending', 'success', 'failed', 'refunded'
    type: text('type').notNull(), // 'HIRE_AI', 'HIRE_HUMAN', 'RENEWAL', 'REFUND'
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

// Call logs table - voice call records with transcripts
export const callLogs = sqliteTable('call_logs', {
    id: text('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    agentType: text('agent_type').notNull(), // 'ai' or 'human'
    buyerId: text('buyer_id').notNull().references(() => users.id),
    propertyId: text('property_id').references(() => properties.id),
    leadId: text('lead_id').references(() => leads.id),
    startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
    endTime: integer('end_time', { mode: 'timestamp_ms' }),
    duration: integer('duration'), // in seconds
    transcript: text('transcript', { mode: 'json' }), // Array of {role, content, timestamp}
    status: text('status').notNull().default('in_progress'), // 'in_progress', 'completed', 'failed'
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
