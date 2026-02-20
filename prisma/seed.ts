import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create a default broker
    const broker = await prisma.broker.upsert({
        where: { id: 'default-broker' },
        update: {},
        create: {
            id: 'default-broker',
            name: 'Campaign Organization',
        }
    });

    // 2. Create a default user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@campaign.io' },
        update: {},
        create: {
            email: 'admin@campaign.io',
            name: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            password: hashedPassword,
            role: 'admin',
            brokerId: broker.id,
        }
    });

    // 3. Create some sample leads
    const leads = [
        { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', status: 'NEW' as const, source: 'Web', state: 'CA', tags: ['hot-lead', 'referral'] },
        { firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', status: 'CONTACTED' as const, source: 'Import', state: 'TX', tags: ['follow-up'] },
        { firstName: 'Carol', lastName: 'Davis', email: 'carol@example.com', status: 'ENGAGED' as const, source: 'Web', state: 'CA', tags: ['hot-lead'] },
        { firstName: 'Dave', lastName: 'Wilson', email: 'dave@example.com', status: 'NEW' as const, source: 'Manual', state: 'NY', tags: [] },
        { firstName: 'Eve', lastName: 'Brown', email: 'eve@example.com', status: 'NEW' as const, source: 'Web', state: 'FL', tags: ['referral'] },
    ];

    for (const lead of leads) {
        await prisma.lead.create({
            data: {
                ...lead,
                assignedToId: user.id,
            }
        });
    }

    console.log(`✅ Seeded: 1 broker, 1 user (admin@campaign.io / password123), ${leads.length} leads`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
