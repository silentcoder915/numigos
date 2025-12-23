// Backend API URL
const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Numigos app initialized');

    // Inject Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // Navbar Auth State
    updateNavbarAuth();

    // Auth Forms
    const loginForm = document.querySelector('form[action="#"]');
    if (document.title.includes('Login') && loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        loginForm.removeAttribute('action');
    }
    if (document.title.includes('Sign Up') && loginForm) {
        loginForm.addEventListener('submit', handleSignup);
        loginForm.removeAttribute('action');
    }

    // Load Data based on page
    if (document.querySelector('.blog-feed')) {
        loadBlogs();
    }

    if (document.querySelector('.community-grid')) {
        loadCommunities();
    }

    if (window.location.pathname.includes('blog-post.html')) {
        loadSinglePost();
    }

    // Sidebar Joined Logic
    if (document.getElementById('sidebar-joined-list')) {
        updateSidebarJoined();
    }

    // Create Blog Modal Logic (if present)
    const fileArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('blog-image-file');
    if (fileArea && fileInput) {
        fileArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop
        fileArea.addEventListener('dragover', (e) => { e.preventDefault(); fileArea.style.borderColor = '#F97316'; });
        fileArea.addEventListener('dragleave', (e) => { e.preventDefault(); fileArea.style.borderColor = '#D1D5DB'; });
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileArea.style.borderColor = '#D1D5DB';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput });
            }
        });
    }

    const createBlogForm = document.getElementById('create-blog-form');
    if (createBlogForm) {
        createBlogForm.addEventListener('submit', handleCreateBlog);
    }
});

/* --- UI HELPERS --- */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="font-size: 1.2rem;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateNavbarAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navLinks = document.querySelector('.nav-links');

    if (token && user) {
        // Remove Login/Signup links
        const authLinks = navLinks.querySelectorAll('a[href="login.html"], a[href="signup.html"]');
        authLinks.forEach(el => el.remove());

        // Add User Name + Logout
        if (!document.getElementById('nav-user-section')) {
            const div = document.createElement('div');
            div.id = 'nav-user-section';
            div.innerHTML = `
                <span style="font-weight: 600; color: #1F2937;">${user.name}</span>
                <button onclick="logout()" class="btn btn-outline" style="border-radius: 20px; font-size: 0.85rem; padding: 0.4rem 1rem;">Logout</button>
             `;
            navLinks.appendChild(div);
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    showToast('Logged out successfully', 'info');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

/* --- AUTH --- */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');

            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) { console.error(err); showToast('Connection error', 'error'); }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('name') ? document.getElementById('name').value : 'User';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    showToast('Creating account...', 'info');

    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Account created! Redirecting to login...', 'success');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) { console.error(err); showToast('Connection error', 'error'); }
}

/* --- BLOGS --- */
// Image handling
let currentBlogImageBase64 = null;
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            currentBlogImageBase64 = evt.target.result;
            const preview = document.getElementById('image-preview');
            preview.src = currentBlogImageBase64;
            preview.style.display = 'block';
            document.querySelector('.file-upload-text').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

async function handleCreateBlog(e) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;

    if (!title || !content) return showToast('Please fill all fields', 'error');
    if (!currentBlogImageBase64) return showToast('Please choose an image', 'error');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerText = 'Publishing...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content, imageUrl: currentBlogImageBase64 })
        });

        if (res.ok) {
            showToast('Blog published successfully!', 'success');
            closeCreateBlogModal();
            loadBlogs(); // Refresh feed
            // Reset form
            document.getElementById('create-blog-form').reset();
            document.getElementById('image-preview').style.display = 'none';
            document.querySelector('.file-upload-text').style.display = 'block';
            currentBlogImageBase64 = null;
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to publish', 'error');
        }
    } catch (err) { console.error(err); showToast('Error publishing', 'error'); }
    finally {
        submitBtn.innerText = 'Publish Blog';
        submitBtn.disabled = false;
    }
}

// Delete Logic
let blogToDeleteId = null;

function openDeleteModal(id) {
    blogToDeleteId = id;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.offsetHeight;
        modal.classList.add('open');
        document.getElementById('confirm-delete-btn').onclick = performDelete;
    } else {
        if (confirm('Delete this blog?')) performDelete();
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 300);
    }
    blogToDeleteId = null;
}

async function performDelete() {
    if (!blogToDeleteId) return;
    const btn = document.getElementById('confirm-delete-btn');
    if (btn) { btn.innerText = 'Deleting...'; btn.disabled = true; }

    try {
        const res = await fetch(`${API_URL}/posts/${blogToDeleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            showToast('Blog deleted successfully', 'success');
            setTimeout(() => window.location.href = 'blog.html', 1000);
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to delete', 'error');
            if (btn) { btn.innerText = 'Delete'; btn.disabled = false; }
            closeDeleteModal();
        }
    } catch (e) {
        showToast('Error', 'error');
        if (btn) { btn.innerText = 'Delete'; btn.disabled = false; }
        closeDeleteModal();
    }
}

async function loadBlogs() {
    const container = document.querySelector('.blog-feed');
    // Loading State
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <p style="color: var(--text-light);">Loading stories...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/posts`);
        const posts = await res.json();

        if (posts.length === 0) {
            container.innerHTML = '<p class="empty-state">No stories yet. Be the first to write one!</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="blog-card" onclick="window.location.href='blog-post.html?id=${post.id}'">
                <div class="blog-image-container">
                    <img src="${post.imageUrl || 'https://via.placeholder.com/400'}" class="blog-image">
                </div>
                <div class="blog-content">
                    <div class="blog-meta-header">
                        <div class="blog-author">
                            <div class="blog-author-avatar"></div>
                            <span>${post.author.name}</span>
                        </div>
                    </div>
                    <h2 class="blog-title">${post.title}</h2>
                    <p class="blog-description">${post.content.substring(0, 100)}...</p>
                    <div class="blog-footer">
                        <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>${post.comments ? post.comments.length : 0} Comments</span>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (e) { console.error(e); }
}

async function loadSinglePost() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const res = await fetch(`${API_URL}/posts/${id}`);
        const post = await res.json();

        // Show delete button if owner
        const user = JSON.parse(localStorage.getItem('user'));
        let deleteBtn = '';
        if (user && user.id === post.authorId) {
            const metaDiv = document.querySelector('.single-post-meta');
            // Append delete button dynamically
            const btn = document.createElement('button');
            btn.className = 'btn-delete';
            btn.innerText = 'Delete Blog';
            btn.onclick = () => openDeleteModal(post.id);
            metaDiv.appendChild(btn);
        }

        document.title = `${post.title} - Numigos`;
        document.querySelector('.single-post-title').textContent = post.title;
        document.querySelector('.single-post-image').src = post.imageUrl || 'https://via.placeholder.com/800';
        document.querySelector('.single-post-content').innerHTML = `<p>${post.content}</p>`;
        document.querySelector('.blog-author span').textContent = post.author.name;

        // Comments
        const commentsHeader = document.querySelector('.comments-header');
        commentsHeader.textContent = `${post.comments.length} Comments`;
        const commentList = document.querySelector('.comment-list');
        commentList.innerHTML = post.comments.map(c => `
             <div class="comment-item">
                <div class="comment-avatar"></div>
                <div class="comment-box">
                    <div class="comment-user">${c.author.name}</div>
                    <div class="comment-text">${c.content}</div>
                </div>
            </div>
        `).join('');

        // Setup comment submit
        const submitBtn = document.querySelector('.comment-input-area button');
        if (submitBtn) {
            submitBtn.onclick = submitComment;
        }

        // Show/Hide Comment Form based on auth
        if (localStorage.getItem('token')) {
            const loginMsg = document.querySelector('.login-to-comment');
            if (loginMsg) loginMsg.style.display = 'none';
            const realForm = document.getElementById('real-comment-form');
            if (realForm) realForm.style.display = 'flex';
        }

    } catch (e) { console.error(e); }
}
async function submitComment() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const input = document.querySelector('.comment-input');
    const content = input.value;
    if (!content) return;

    try {
        const res = await fetch(`${API_URL}/posts/${id}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            input.value = '';
            loadSinglePost();
        }
    } catch (e) { console.error(e); }
}

/* --- COMMUNITIES --- */
// (Keeping existing loadCommunities... simplified for brevity, assume similar to before)
/* --- COMMUNITIES --- */
/* --- COMMUNITIES --- */
let currentCommunity = null;

async function loadCommunities() {
    const container = document.querySelector('.community-grid');
    if (!container) return;

    // Loading State
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <p style="color: var(--text-light);">Loading communities...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/communities`);
        const communities = await res.json();
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;

        if (communities.length === 0) {
            container.innerHTML = '<p>No communities found.</p>';
            return;
        }

        container.innerHTML = communities.map(comm => {
            const isMember = comm.members.some(m => m.id === userId);
            const commJson = JSON.stringify(comm).replace(/"/g, '&quot;');

            return `
            <div class="community-card" onclick="openCommunityDetail(${commJson})">
                <div class="community-header-img" style="background-image: url('${comm.imageUrl || 'https://via.placeholder.com/400'}')"></div>
                <div class="community-body">
                    <div class="community-avatar">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comm.name)}&background=random&color=fff">
                    </div>
                    <h4 class="community-name">${comm.name}</h4>
                    <p class="community-desc">${comm.description}</p>
                    <div class="community-stats">
                        <span>${comm.members.length} Members</span>
                    </div>
                    <button class="btn ${isMember ? 'btn-outline' : 'btn-primary'}" 
                            style="width: 100%; border-radius: 20px;" 
                            onclick="event.stopPropagation(); joinCommunity(this, ${comm.id})">
                        ${isMember ? 'Joined' : 'Join Community'}
                    </button>
                </div>
            </div>`;
        }).join('');

        updateSidebarJoined();

    } catch (e) { console.error(e); }
}

function openCommunityDetail(c) {
    if (c) currentCommunity = c;
    else c = currentCommunity;

    const homeView = document.getElementById('home-view');
    const detailView = document.getElementById('community-detail-view');

    // Switch views
    homeView.style.display = 'none';
    detailView.style.display = 'block';

    const user = JSON.parse(localStorage.getItem('user'));
    const isMember = c.members.some(m => m.id === (user ? user.id : null));

    detailView.innerHTML = `
        <div class="card">
             <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:1rem; align-items:center;">
                    <button class="btn btn-outline" onclick="closeCommunityDetail()">← Back</button>
                    <h3 class="card-title">${c.name}</h3>
                </div>
                <button class="btn ${isMember ? 'btn-outline' : 'btn-primary'}" 
                    style="border-radius: 20px;"
                    onclick="joinCommunity(this, ${c.id}, true)">
                    ${isMember ? 'Leave Community' : 'Join Community'}
                </button>
            </div>
            
            <div style="padding: 1.5rem;">
                <div style="background: url('${c.imageUrl}') center/cover; height: 250px; border-radius: 8px; margin-bottom: 2rem; position: relative;">
                    <div style="position: absolute; bottom: -30px; left: 20px; width: 80px; height: 80px; border-radius: 50%; background: #fff; padding: 4px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                    </div>
                </div>
                
                <h4 style="margin-bottom: 0.5rem; font-size: 1.3rem; margin-top: 2rem;">Community Groups</h4>
                <p style="color: grey; margin-bottom: 1.5rem;">Connect with members, join discussions, and collaborate.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    <!-- Announcements -->
                    <div style="padding: 1rem; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                         onmouseover="this.style.borderColor='#F97316'" onmouseout="this.style.borderColor='#eee'"
                         onclick="openAnnouncements()">
                        <div style="font-weight:bold; margin-bottom:0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span>📢</span> Announcements
                        </div>
                        <div style="font-size: 0.85rem; color: #6B7280;">Admins only • Official updates and news</div>
                    </div>
                    
                    <!-- General Chat -->
                    <div style="padding: 1rem; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                         onmouseover="this.style.borderColor='#F97316'" onmouseout="this.style.borderColor='#eee'"
                         onclick="openChat()">
                        <div style="font-weight:bold; margin-bottom:0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span>💬</span> General Chat
                        </div>
                        <div style="font-size: 0.85rem; color: #6B7280;">Public • Chat with everyone</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openAnnouncements() {
    const detailView = document.getElementById('community-detail-view');
    detailView.innerHTML = `
        <div class="card">
             <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:1rem; align-items:center;">
                    <button class="btn btn-outline" onclick="openCommunityDetail()">← Groups</button>
                    <h3 class="card-title">Announcements</h3>
                </div>
                <span class="badge" style="background:#FFF7ED; color:#F97316; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem;">Admins Only</span>
            </div>
            
            <div style="padding: 1.5rem;">
                <div class="announcements-list">
                    <div style="border-left: 4px solid #F97316; padding-left: 1rem; margin-bottom: 1.5rem;">
                        <div style="font-weight: 700; color: #1F2937; margin-bottom: 0.25rem;">🎉 Welcome to ${currentCommunity.name}!</div>
                        <p style="color: #4B5563; font-size: 0.95rem; margin-bottom: 0.5rem;">
                            We are excited to have you here. Please make sure to read the community guidelines.
                        </p>
                        <div style="font-size: 0.8rem; color: #9CA3AF;">Posted by Admin • 2 days ago</div>
                    </div>
                    <div style="border-left: 4px solid #F97316; padding-left: 1rem; margin-bottom: 1.5rem;">
                        <div style="font-weight: 700; color: #1F2937; margin-bottom: 0.25rem;">📅 Upcoming Meetup</div>
                        <p style="color: #4B5563; font-size: 0.95rem; margin-bottom: 0.5rem;">
                            Don't forget to join us for the monthly meetup this Friday at the Student Center.
                        </p>
                        <div style="font-size: 0.8rem; color: #9CA3AF;">Posted by Admin • 5 days ago</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openChat() {
    const detailView = document.getElementById('community-detail-view');
    detailView.innerHTML = `
        <div class="card" style="height: 80vh; display: flex; flex-direction: column;">
             <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #eee;">
                <div style="display:flex; gap:1rem; align-items:center;">
                    <button class="btn btn-outline" onclick="openCommunityDetail()">← Groups</button>
                    <h3 class="card-title">General Chat</h3>
                </div>
                <div style="font-size:0.85rem; color:green;">● 12 Online</div>
            </div>
            
            <div style="flex: 1; padding: 1.5rem; overflow-y: auto; background: #F9FAFB;" id="chat-messages">
                <div style="margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; background: #E5E7EB; border-radius: 50%; flex-shrink: 0;"></div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 2px;">Ali Khan</div>
                        <div style="background: white; padding: 0.75rem; border-radius: 0 12px 12px 12px; border: 1px solid #E5E7EB; font-size: 0.9rem;">
                            Has anyone started the assignment?
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 0.75rem; flex-direction: row-reverse;">
                    <div style="width: 32px; height: 32px; background: #F97316; border-radius: 50%; flex-shrink: 0;"></div>
                    <div>
                         <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 2px; text-align: right;">You</div>
                        <div style="background: #FFF7ED; padding: 0.75rem; border-radius: 12px 0 12px 12px; border: 1px solid #FFEDD5; font-size: 0.9rem;">
                            Yes, it's quite challenging!
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="padding: 1.25rem; border-top: 1px solid #eee; background: white;">
                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <input type="text" id="chat-input" class="form-input" placeholder="Type your message..." 
                           style="margin-bottom: 0; flex: 1; padding: 0.9rem 1rem; border-radius: 24px; border: 2px solid #E5E7EB; font-size: 0.95rem;"
                           onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button class="btn btn-primary" onclick="sendChatMessage()" 
                            style="padding: 0.9rem 2rem; border-radius: 24px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <span>Send</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    const chatContainer = document.getElementById('chat-messages');
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.name : 'You';

    // Create new message element
    const messageHTML = `
        <div style="margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 0.75rem; flex-direction: row-reverse; animation: slideIn 0.3s ease;">
            <div style="width: 32px; height: 32px; background: #F97316; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
                ${userName.charAt(0)}
            </div>
            <div>
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 2px; text-align: right;">${userName}</div>
                <div style="background: #FFF7ED; padding: 0.75rem; border-radius: 12px 0 12px 12px; border: 1px solid #FFEDD5; font-size: 0.9rem;">
                    ${message}
                </div>
                <div style="font-size: 0.7rem; color: #9CA3AF; text-align: right; margin-top: 0.25rem;">Just now</div>
            </div>
        </div>
    `;

    chatContainer.insertAdjacentHTML('beforeend', messageHTML);

    // Clear input
    input.value = '';

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Optional: Show toast
    // showToast('Message sent!', 'success');
}

function closeCommunityDetail() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('community-detail-view').style.display = 'none';
    loadCommunities();
}

async function joinCommunity(btn, id, isDetail = false) {
    if (!localStorage.getItem('token')) return showToast('Please login', 'info');

    // Determine action based on button text
    const text = btn.innerText.toLowerCase();
    const action = (text.includes('join')) ? 'join' : 'leave';

    // Optimistic UI update
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/communities/${id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ action }) // Middleware expects 'join' or 'leave' usually, or toggle
        });

        if (res.ok) {
            showToast(`Successfully ${action}ed community`, 'success');
            if (isDetail) {
                // Determine new state
                const newState = action === 'join' ? 'Leave Community' : 'Join Community';
                btn.innerText = newState;
                btn.className = action === 'join' ? 'btn btn-outline' : 'btn btn-primary';

                // Also update the object in memory if we re-render? 
                // We'll rely on closeCommunityDetail refreshing everything, or we could refetch this single community.
            } else {
                loadCommunities(); // Refresh grid
            }
            updateSidebarJoined();
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed', 'error');
            btn.innerText = originalText;
        }
    } catch (e) {
        console.error(e);
        btn.innerText = originalText;
    } finally {
        btn.disabled = false;
    }
}

async function updateSidebarJoined() {
    if (!localStorage.getItem('token')) return;
    try {
        const res = await fetch(`${API_URL}/communities`);
        const communities = await res.json();
        const user = JSON.parse(localStorage.getItem('user'));
        const myComms = communities.filter(c => c.members.some(m => m.id === user.id));
        const list = document.getElementById('sidebar-joined-list');

        if (list) {
            if (myComms.length === 0) {
                list.innerHTML = '<span style="color: #9CA3AF; font-size: 0.85rem;">No joined communities</span>';
                return;
            }
            list.innerHTML = myComms.map(c => `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 6px; cursor: pointer;" 
                     class="sidebar-nav-item" 
                     onclick="openCommunityDetail(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: #F97316; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">
                        ${c.name.charAt(0)}
                    </div>
                    <span style="font-size: 0.9rem; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</span>
                </div>
            `).join('');
        }
    } catch (e) { }
}
// Create Community
async function handleCreateCommunity(e) {
    if (!localStorage.getItem('token')) return showToast('Please login', 'info');
    e.preventDefault();

    // Get inputs
    const name = e.target.querySelector('input[type="text"]').value;
    const description = e.target.querySelector('textarea').value;
    const imageUrlInput = document.getElementById('comm-img-url');
    const imageUrl = imageUrlInput ? imageUrlInput.value : '';

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Creating...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/communities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, description, imageUrl })
        });

        if (res.ok) {
            showToast('Community created successfully!', 'success');
            closeCreateCommunityModal();
            loadCommunities();
            e.target.reset();
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to create', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error creating community', 'error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function openCreateCommunityModal() {
    if (!localStorage.getItem('token')) return showToast('Please login', 'info');
    const modal = document.getElementById('create-community-modal');
    modal.style.display = 'flex';
    // Small timeout for animation class
    setTimeout(() => modal.classList.add('open'), 10);
}

function closeCreateCommunityModal() {
    const modal = document.getElementById('create-community-modal');
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}


/* --- EVENTS LOGIC --- */
function openCreateEventModal() {
    if (!localStorage.getItem('token')) return showToast('Please login', 'info');
    const modal = document.getElementById('create-event-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}

function closeCreateEventModal() {
    const modal = document.getElementById('create-event-modal');
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

function handleCreateEvent(e) {
    e.preventDefault();

    // Gather Data
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const place = document.getElementById('event-place').value;
    const imgObj = document.getElementById('event-img');
    const imageUrl = imgObj ? imgObj.value : '';

    // Simulate API Call
    showToast('Creating Event...', 'info');

    // In a real app, POST to /api/events
    setTimeout(() => {
        showToast('Event created successfully!', 'success');
        closeCreateEventModal();
        e.target.reset();

        // Optimistically add to list (Optional, but user asked for "show beautiful ui box")
        // We'll append it to the events list if we want, but for now just Toast is fine as per MVP.

        // Let's actually append it to the UI!
        const list = document.querySelector('.events-list');
        if (list) {
            const newEventHTML = `
            <div class="event-card">
                 <img src="${imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&w=400&q=80'}" class="event-image">
                <div class="event-details">
                    <h4>${title}</h4>
                    <div class="event-meta">
                        <span>📅 ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${time}</span>
                        <span>📍 ${place}</span>
                    </div>
                </div>
            </div>`;
            list.insertAdjacentHTML('afterbegin', newEventHTML);
        }

    }, 1000);
}

/* --- BLOG MODAL (Existing) --- */
function openCreateBlogModal() {
    if (!localStorage.getItem('token')) return showToast('Please login', 'info');
    const modal = document.getElementById('create-blog-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('open'), 10);
    }
}
function closeCreateBlogModal() {
    const modal = document.getElementById('create-blog-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}
// Close modals on clicks
window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('open');
        setTimeout(() => event.target.style.display = 'none', 300);
    }
}
function checkLoginForBlog() {
    if (!localStorage.getItem('token')) {
        showToast('Please login to write.', 'info');
        setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
        openCreateBlogModal();
    }
}
function filterBlogs() { showToast('Filter not implemented', 'info'); }
