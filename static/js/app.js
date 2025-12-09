// SocialHub Pro - Main JavaScript File

$(document).ready(function() {
    console.log('SocialHub Pro initialized! 🚀');
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Post Button Handler
    $('#postBtn').click(function() {
        createPost();
    });
    
    // Enter key to post
    $('#postText').keypress(function(e) {
        if (e.which === 13 && e.ctrlKey) {
            createPost();
        }
    });
});

// Create Post Function
function createPost() {
    const text = $('#postText').val().trim();
    
    if (!text) {
        showNotification('Please write something!', 'warning');
        return;
    }
    
    const $btn = $('#postBtn');
    const originalHtml = $btn.html();
    
    // Show loading
    $btn.html('<i class="fas fa-spinner fa-spin me-2"></i>Posting...').prop('disabled', true);
    
    $.ajax({
        url: '/api/post',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ text: text }),
        success: function(response) {
            if (response.success) {
                showNotification('Post created successfully! 🎉', 'success');
                $('#postText').val('');
                
                // Add new post to feed with animation
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        },
        error: function() {
            showNotification('Failed to create post. Please try again.', 'danger');
        },
        complete: function() {
            $btn.html(originalHtml).prop('disabled', false);
        }
    });
}

// Like Post Function
function likePost(postId) {
    const $btn = $(`.post-card[data-post-id="${postId}"] .action-btn:first`);
    
    $.ajax({
        url: `/api/like/${postId}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                // Toggle liked class with animation
                $btn.toggleClass('liked');
                
                // Update like count
                const $icon = $btn.find('i');
                if ($btn.hasClass('liked')) {
                    $icon.addClass('animate__animated animate__heartBeat');
                    setTimeout(() => $icon.removeClass('animate__animated animate__heartBeat'), 1000);
                }
                
                // Update stats
                const $stats = $(`.post-card[data-post-id="${postId}"] .post-stats span:first`);
                $stats.html(`<i class="fas fa-heart text-danger me-1"></i>${response.likes} likes`);
            }
        },
        error: function() {
            showNotification('Failed to like post.', 'danger');
        }
    });
}

// Toggle Comments Function
function toggleComments(postId) {
    const $comments = $(`#comments-${postId}`);
    
    $comments.slideToggle(300, function() {
        if ($comments.is(':visible')) {
            // Focus on comment input
            $comments.find('.comment-input').focus();
        }
    });
}

// Add Comment Function
function addComment(postId, text) {
    if (!text.trim()) return;
    
    $.ajax({
        url: `/api/comment/${postId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ text: text }),
        success: function(response) {
            if (response.success) {
                // Add comment with animation
                const comment = response.comment;
                const commentHtml = `
                    <div class="comment animate__animated animate__fadeIn">
                        <span class="comment-avatar">${getUserAvatar(comment.user)}</span>
                        <div class="comment-content">
                            <strong>${getUserName(comment.user)}</strong>
                            <p class="mb-0">${comment.text}</p>
                        </div>
                    </div>
                `;
                
                $(`#comments-${postId} .d-flex`).before(commentHtml);
                
                // Update comment count
                const $commentBtn = $(`.post-card[data-post-id="${postId}"] .action-btn:nth-child(2)`);
                const currentCount = parseInt($commentBtn.text().match(/\d+/)) || 0;
                $commentBtn.html(`<i class="fas fa-comment me-1"></i>Comment`);
                
                // Update stats
                const $stats = $(`.post-card[data-post-id="${postId}"] .post-stats span:nth-child(2)`);
                $stats.html(`<i class="fas fa-comment me-1"></i>${currentCount + 1} comments`);
                
                showNotification('Comment added! 💬', 'success');
            }
        },
        error: function() {
            showNotification('Failed to add comment.', 'danger');
        }
    });
}

// Show Notification Function
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notification = $(`
        <div class="alert alert-${type} alert-dismissible fade show position-fixed animate__animated animate__fadeInDown" 
             style="top: 80px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);">
            <strong>${message}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        notification.addClass('animate__fadeOutUp');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Helper Functions
function getUserAvatar(username) {
    const avatars = {
        'demo': '👨‍💻',
        'emma': '👩‍🎨',
        'david': '👨‍💼',
        'sarah': '👩‍💻'
    };
    return avatars[username] || '👤';
}

function getUserName(username) {
    const names = {
        'demo': 'Alex Rivera',
        'emma': 'Emma Watson',
        'david': 'David Chen',
        'sarah': 'Sarah Johnson'
    };
    return names[username] || username;
}

// Smooth Scroll
$('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
    const target = $(this.getAttribute('href'));
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 80
        }, 500);
    }
});

// Auto-resize textarea
$('#postText').on('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Keyboard shortcuts
$(document).keydown(function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search if exists
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        $('.modal').modal('hide');
    }
});

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// Online status indicator
function updateOnlineStatus() {
    if (navigator.onLine) {
        $('.online-indicator').css('background', '#10b981');
    } else {
        $('.online-indicator').css('background', '#ef4444');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Console log with style
console.log('%c🚀 SocialHub Pro ', 'background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 20px; padding: 10px 20px; border-radius: 10px;');
console.log('%cBuilt with Flask, Bootstrap, jQuery & Font Awesome', 'color: #667eea; font-size: 14px;');
// Tambahkan di akhir file app.js

// ===== STORIES FUNCTIONS =====

function viewStory(username) {
    $.get(`/api/story/${username}/get`, function(data) {
        if (data.success && data.stories.length > 0) {
            const story = data.stories[0];
            $('#storyUserAvatar').text(getUserAvatar(username));
            $('#storyUserName').text(getUserName(username));
            $('#storyTime').text(story.time);
            $('#storyImage').text(story.image);
            $('#storyText').text(story.text);
            $('#storyModal').css('display', 'flex');
            
            // Mark as viewed
            $.post(`/api/story/${username}/view`);
        }
    });
}

function closeStory() {
    $('#storyModal').hide();
}

function showAddStory() {
    $('#addStoryModal').modal('show');
}

function selectStoryEmoji(emoji) {
    $('#selectedEmoji').val(emoji);
    $('.btn-lg').removeClass('btn-primary').addClass('btn-light');
    event.target.classList.remove('btn-light');
    event.target.classList.add('btn-primary');
}

function postStory() {
    const emoji = $('#selectedEmoji').val();
    const caption = $('#storyCaption').val();
    
    $.ajax({
        url: '/api/story/create',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            image: emoji,
            text: caption
        }),
        success: function(data) {
            if (data.success) {
                $('#addStoryModal').modal('hide');
                $('#storyCaption').val('');
                showNotification('Story posted! 📖', 'success');
                setTimeout(() => location.reload(), 1000);
            }
        }
    });
}

// ===== CHAT FUNCTIONS =====

let currentChatUser = null;

function openChat() {
    $('#chatSidebar').addClass('active');
    loadChats();
}

function closeChat() {
    $('#chatSidebar').removeClass('active');
}

function loadChats() {
    $.get('/api/chats', function(data) {
        if (data.success) {
            let html = '';
            data.chats.forEach(chat => {
                html += `
                    <div class="chat-item ${chat.unread > 0 ? 'unread' : ''}" onclick="openChatWindow('${chat.user}')">
                        <div class="chat-avatar">
                            ${chat.avatar}
                            ${chat.online ? '<span class="online-dot-chat"></span>' : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-name">${chat.name}</div>
                            <div class="chat-last-message">${chat.last_message}</div>
                        </div>
                        ${chat.unread > 0 ? `<span class="chat-unread-badge">${chat.unread}</span>` : ''}
                    </div>
                `;
            });
            $('#chatList').html(html || '<p class="text-center text-muted mt-5">No messages yet</p>');
        }
    });
}

function openChatWindow(username) {
    currentChatUser = username;
    $('#chatSidebar').removeClass('active');
    $('#chatWindow').addClass('active');
    
    $.get(`/api/chat/${username}`, function(data) {
        if (data.success) {
            $('#chatUserAvatar').text(data.user.avatar);
            $('#chatUserName').text(data.user.name);
            $('#chatUserStatus').text(data.user.online ? 'Online' : 'Offline');
            
            let html = '';
            data.messages.forEach(msg => {
                const isSent = msg.from === '{{ username }}';
                html += `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div>${msg.text}</div>
                        <div class="message-time">${msg.time}</div>
                    </div>
                `;
            });
            $('#chatMessages').html(html);
            $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
        }
    });
}

function backToChats() {
    $('#chatWindow').removeClass('active');
    $('#chatSidebar').addClass('active');
    currentChatUser = null;
}

function sendMessage() {
    const text = $('#chatInput').val().trim();
    if (!text || !currentChatUser) return;
    
    $.ajax({
        url: `/api/chat/${currentChatUser}/send`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ text }),
        success: function(data) {
            if (data.success) {
                const html = `
                    <div class="message sent">
                        <div>${data.message.text}</div>
                        <div class="message-time">${data.message.time}</div>
                    </div>
                `;
                $('#chatMessages').append(html);
                $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
                $('#chatInput').val('');
            }
        }
    });
}

// Enter to send message
$('#chatInput').keypress(function(e) {
    if (e.which === 13) {
        sendMessage();
    }
});

// Update message icon click handler
$(document).ready(function() {
    $('.nav-icon:has(.fa-envelope)').parent().click(function(e) {
        e.preventDefault();
        openChat();
    });
});
