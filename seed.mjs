import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'backend/sqlite.db');
const db = new Database(dbPath);

const generateId = () => Math.random().toString(36).substring(2, 15);

function seed() {
    console.log('Seeding database via better-sqlite3...');

    // Create tables if they don't exist (Drizzle usually handles this, but let's be safe for seller)
    db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('seller_1', 'seller@example.com', 'password_hash', 'Premium Seller', 'seller', Date.now());

    const propertiesToInsert = [
        {
            id: "prop_1",
            title: 'The Obsidian House',
            description: 'A masterpiece of modern minimalist architecture with obsidian accents and panoramic views.',
            propertyType: 'House',
            price: 2450000,
            location: JSON.stringify({ address: '123 Noir Blvd', city: 'Beverly Hills', state: 'CA' }),
            size: 4200,
            bedrooms: 4,
            bathrooms: 5,
            amenities: JSON.stringify(['Pool', 'Smart Home', 'Wine Cellar', 'Ocean View']),
            images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop']),
            sellerId: 'seller_1',
            status: 'active',
            created_at: Date.now()
        },
        {
            id: "prop_2",
            title: 'Beige Sanctuary',
            description: 'A serene retreat featuring soft beige tones, natural materials, and an open layout.',
            propertyType: 'Villa',
            price: 1890000,
            location: JSON.stringify({ address: '45 Earthy Way', city: 'Aspen', state: 'CO' }),
            size: 3100,
            bedrooms: 3,
            bathrooms: 3,
            amenities: JSON.stringify(['Fireplace', 'Garden', 'Ski-in/Ski-out', 'Sauna']),
            images: JSON.stringify(['https://images.unsplash.com/photo-1600607687940-4e524cb35ed3?q=80&w=2070&auto=format&fit=crop']),
            sellerId: 'seller_1',
            status: 'active',
            created_at: Date.now()
        },
        {
            id: "prop_3",
            title: 'Glass Pavilion',
            description: 'Floor-to-ceiling glass walls create a seamless connection between indoor and outdoor living.',
            propertyType: 'Mansion',
            price: 3200000,
            location: JSON.stringify({ address: '88 Crystal Cove', city: 'Malibu', state: 'CA' }),
            size: 5800,
            bedrooms: 5,
            bathrooms: 6,
            amenities: JSON.stringify(['Private Beach', 'Infinity Pool', 'Gym', 'Cinema']),
            images: JSON.stringify(['https://images.unsplash.com/photo-1600566753301-3d482f3ddde6?q=80&w=1974&auto=format&fit=crop']),
            sellerId: 'seller_1',
            status: 'active',
            created_at: Date.now()
        }
    ];

    const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO properties 
    (id, title, description, property_type, price, location, size, bedrooms, bathrooms, amenities, images, seller_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const p of propertiesToInsert) {
        insertStmt.run(p.id, p.title, p.description, p.propertyType, p.price, p.location, p.size, p.bedrooms, p.bathrooms, p.amenities, p.images, p.sellerId, p.status, p.created_at);
    }

    console.log('Seeding completed successfully.');
}

seed();
