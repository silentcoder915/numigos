const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_this';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for base64 images

// Serve HTML files
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'blog.html')));
app.get('/community', (req, res) => res.sendFile(path.join(__dirname, 'community.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/blog-post', (req, res) => res.sendFile(path.join(__dirname, 'blog-post.html')));



// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

/* --- AUTH --- */
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !email.endsWith('@nutech.edu.pk')) return res.status(400).json({ message: 'Only @nutech.edu.pk emails are allowed.' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password too short.' });

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'User already exists.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({ data: { name, email, password: hashedPassword } });
        res.status(201).json({ message: 'User created.' });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Invalid credentials.' });
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

/* --- BLOGS --- */
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: { author: { select: { name: true } }, comments: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(posts);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
    const { title, content, category, imageUrl } = req.body;
    try {
        const post = await prisma.post.create({
            data: {
                title, content, category, imageUrl,
                authorId: req.user.id
            }
        });
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                author: { select: { name: true } },
                comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }
            }
        });
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    const { content } = req.body;
    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                postId: parseInt(req.params.id),
                authorId: req.user.id
            },
            include: { author: { select: { name: true } } }
        });
        res.json(comment);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Delete comments first (cascade usually handles this but being explicit is safer if relation not set to cascade)
        await prisma.comment.deleteMany({ where: { postId: id } });
        await prisma.post.delete({ where: { id } });

        res.json({ message: 'Post deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- COMMUNITIES --- */
app.get('/api/communities', async (req, res) => {
    try {
        const communities = await prisma.community.findMany({
            include: { members: true, creator: { select: { name: true } } }
        });
        res.json(communities);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/communities', authenticateToken, async (req, res) => {
    const { name, description, imageUrl } = req.body;
    try {
        const community = await prisma.community.create({
            data: {
                name, description, imageUrl,
                creatorId: req.user.id,
                members: { connect: { id: req.user.id } } // Creator auto-joins
            }
        });
        res.json(community);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/communities/:id/join', authenticateToken, async (req, res) => {
    const communityId = parseInt(req.params.id);
    const { action } = req.body; // 'join' or 'leave'
    try {
        if (action === 'leave') {
            await prisma.community.update({
                where: { id: communityId },
                data: { members: { disconnect: { id: req.user.id } } }
            });
            res.json({ message: 'Left community' });
        } else {
            await prisma.community.update({
                where: { id: communityId },
                data: { members: { connect: { id: req.user.id } } }
            });
            res.json({ message: 'Joined community' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
