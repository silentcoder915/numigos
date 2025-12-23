const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // 1. Create Users
    const password = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.upsert({
        where: { email: 'sarah@nutech.edu.pk' },
        update: {},
        create: {
            name: 'Sarah Ahmad',
            email: 'sarah@nutech.edu.pk',
            password,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'bilal@nutech.edu.pk' },
        update: {},
        create: {
            name: 'Bilal Ahmed',
            email: 'bilal@nutech.edu.pk',
            password,
        },
    });

    console.log(`Created users: ${user1.name}, ${user2.name}`);

    // 2. Create Communities
    const comm1 = await prisma.community.upsert({
        where: { name: 'Nutech CS Society' },
        update: {},
        create: {
            name: 'Nutech CS Society',
            description: 'The official community for CS students. Coding, Hackathons, and AI.',
            imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            creatorId: user2.id,
            members: { connect: [{ id: user1.id }, { id: user2.id }] }
        },
    });

    const comm2 = await prisma.community.upsert({
        where: { name: 'Arts & Media Club' },
        update: {},
        create: {
            name: 'Arts & Media Club',
            description: 'For the creative minds. Photography, design, and exhibitions.',
            imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            creatorId: user1.id,
            members: { connect: [{ id: user1.id }] }
        },
    });

    const comm3 = await prisma.community.upsert({
        where: { name: 'Pakistan Nutech Cultural Society' },
        update: {},
        create: {
            name: 'Pakistan Nutech Cultural Society',
            description: 'Celebrating the rich heritage and culture of Pakistan at Nutech. Join us for cultural nights and food festivals.',
            imageUrl: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?q=80&w=800&auto=format&fit=crop',
            creatorId: user1.id,
            members: { connect: [{ id: user1.id }, { id: user2.id }] }
        },
    });

    const comm4 = await prisma.community.upsert({
        where: { name: 'Nutech Tech Club' },
        update: {},
        create: {
            name: 'Nutech Tech Club',
            description: 'Innovating for the future. Robotics, AI, and hackathons.',
            imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
            creatorId: user2.id,
            members: { connect: [{ id: user2.id }] }
        },
    });

    console.log('Seeded communities');

    // 3. Create Blogs (Posts)
    const post1 = await prisma.post.create({
        data: {
            title: 'My Journey Through the First Semester',
            content: 'Starting university can be overwhelming. When I first stepped onto the Nutech campus, I didn\'t know what to expect. The buildings looked huge, the schedule seemed packed, and I knew no one. Fast forward to the end of the semester, and it\'s been a ride I wouldn\'t trade for anything. Finding my tribe was key - joining societies helped immensely.',
            imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Student Life',
            authorId: user1.id,
            comments: {
                create: [
                    { content: 'Totally agree with the joining societies part!', authorId: user2.id },
                    { content: 'Great advice for freshmen.', authorId: user2.id },
                ]
            }
        },
    });

    const post2 = await prisma.post.create({
        data: {
            title: 'Highlights from the Winter Hackathon',
            content: 'The Computer Science Society hosted its annual hackathon last weekend. We saw some incredible projects ranging from AI healthcare solutions to smart campus apps. The energy was electric, and seeing everyone code through the night was inspiring. Congrats to the winning team!',
            imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Events',
            authorId: user2.id,
            comments: {
                create: [
                    { content: 'Can\'t wait for the next one!', authorId: user1.id },
                ]
            }
        },
    });
    console.log('Seeded blogs and comments');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
