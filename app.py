from flask import Flask, render_template, request, jsonify, session, redirect
from datetime import datetime, timedelta
import secrets
import random

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Database
users = {
    'demo': {'pass': 'demo123', 'name': 'Alex Rivera', 'bio': 'Full Stack Dev 🚀', 'avatar': '👨‍💻', 'verified': True, 'online': True},
    'emma': {'pass': 'pass123', 'name': 'Emma Watson', 'bio': 'Travel Blogger ✈️', 'avatar': '👩‍🎨', 'verified': True, 'online': True},
    'david': {'pass': 'pass123', 'name': 'David Chen', 'bio': 'ML Engineer 🤖', 'avatar': '👨‍💼', 'verified': False, 'online': False},
    'sarah': {'pass': 'pass123', 'name': 'Sarah Johnson', 'bio': 'UI/UX Designer 🎨', 'avatar': '👩‍💻', 'verified': True, 'online': True}
}

posts = [
    {'id': 1, 'user': 'demo', 'text': '🚀 Just launched my new app! Built with Flask, Bootstrap & jQuery! #coding #webdev', 'likes': ['emma', 'david'], 'comments': [{'user': 'emma', 'text': 'Amazing work! 🔥'}], 'time': '2h ago'},
    {'id': 2, 'user': 'emma', 'text': '🌅 Beautiful sunset at Santorini! Best vacation ever! #travel #greece', 'likes': ['demo', 'david', 'sarah'], 'comments': [], 'time': '5h ago'},
    {'id': 3, 'user': 'david', 'text': '💡 AI is revolutionizing everything! Working on exciting ML projects. #machinelearning #ai', 'likes': ['demo', 'sarah'], 'comments': [{'user': 'demo', 'text': 'Cant wait to see it!'}], 'time': '8h ago'}
]

# Stories Database
stories = {
    'demo': [
        {'id': 1, 'image': '🎨', 'text': 'Working on new design!', 'time': datetime.now() - timedelta(hours=2), 'views': ['emma', 'sarah']},
    ],
    'emma': [
        {'id': 2, 'image': '🏖️', 'text': 'Beach vibes! 🌊', 'time': datetime.now() - timedelta(hours=1), 'views': ['demo']},
        {'id': 3, 'image': '🍕', 'text': 'Pizza time! 🍕', 'time': datetime.now() - timedelta(minutes=30), 'views': []},
    ],
    'sarah': [
        {'id': 4, 'image': '💻', 'text': 'New UI mockup!', 'time': datetime.now() - timedelta(hours=5), 'views': ['demo', 'emma']},
    ]
}

# Chat Messages Database
messages = {
    'demo': {
        'emma': [
            {'from': 'emma', 'text': 'Hey! How are you?', 'time': '10:30 AM', 'read': True},
            {'from': 'demo', 'text': 'Great! Working on new project', 'time': '10:32 AM', 'read': True},
            {'from': 'emma', 'text': 'Cool! Let me know if you need help', 'time': '10:35 AM', 'read': True},
        ],
        'david': [
            {'from': 'david', 'text': 'Check out my new ML model!', 'time': '2h ago', 'read': False},
        ],
        'sarah': [
            {'from': 'sarah', 'text': 'Love your latest post!', 'time': '1h ago', 'read': False},
            {'from': 'demo', 'text': 'Thanks! Your designs are amazing too!', 'time': '55m ago', 'read': True},
        ]
    },
    'emma': {
        'demo': [
            {'from': 'demo', 'text': 'Great! Working on new project', 'time': '10:32 AM', 'read': True},
            {'from': 'emma', 'text': 'Cool! Let me know if you need help', 'time': '10:35 AM', 'read': True},
        ]
    },
    'david': {
        'demo': [
            {'from': 'david', 'text': 'Check out my new ML model!', 'time': '2h ago', 'read': False},
        ]
    },
    'sarah': {
        'demo': [
            {'from': 'sarah', 'text': 'Love your latest post!', 'time': '1h ago', 'read': False},
            {'from': 'demo', 'text': 'Thanks! Your designs are amazing too!', 'time': '55m ago', 'read': True},
        ]
    }
}

@app.route('/')
def home():
    if 'username' not in session:
        return render_template('login.html')
    
    username = session['username']
    user = users[username]
    
    # Get unread message count
    unread_count = 0
    if username in messages:
        for chat_user, msgs in messages[username].items():
            unread_count += sum(1 for msg in msgs if msg['from'] != username and not msg.get('read', False))
    
    return render_template('index.html',
        user=user,
        username=username,
        users=users,
        posts=sorted(posts, key=lambda x: x['id'], reverse=True),
        stories=stories,
        followers=random.randint(100, 500),
        following=random.randint(50, 200),
        unread_count=unread_count
    )

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    if username in users and users[username]['pass'] == password:
        session['username'] = username
        users[username]['online'] = True
    
    return redirect('/')

@app.route('/logout')
def logout():
    if 'username' in session:
        users[session['username']]['online'] = False
    session.pop('username', None)
    return redirect('/')

@app.route('/api/post', methods=['POST'])
def create_post():
    if 'username' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    data = request.json
    new_post = {
        'id': max([p['id'] for p in posts]) + 1 if posts else 1,
        'user': session['username'],
        'text': data['text'],
        'likes': [],
        'comments': [],
        'time': 'just now'
    }
    posts.insert(0, new_post)
    
    return jsonify({'success': True, 'post': new_post})

@app.route('/api/like/<int:post_id>', methods=['POST'])
def like_post(post_id):
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    for post in posts:
        if post['id'] == post_id:
            if username in post['likes']:
                post['likes'].remove(username)
            else:
                post['likes'].append(username)
            return jsonify({'success': True, 'likes': len(post['likes'])})
    
    return jsonify({'success': False})

@app.route('/api/comment/<int:post_id>', methods=['POST'])
def add_comment(post_id):
    if 'username' not in session:
        return jsonify({'success': False})
    
    data = request.json
    for post in posts:
        if post['id'] == post_id:
            comment = {
                'user': session['username'],
                'text': data['text'],
                'time': 'just now'
            }
            post['comments'].append(comment)
            return jsonify({'success': True, 'comment': comment})
    
    return jsonify({'success': False})

# ===== STORIES API =====
@app.route('/api/stories', methods=['GET'])
def get_stories():
    if 'username' not in session:
        return jsonify({'success': False})
    
    return jsonify({'success': True, 'stories': stories})

@app.route('/api/story/create', methods=['POST'])
def create_story():
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    data = request.json
    
    if username not in stories:
        stories[username] = []
    
    new_story = {
        'id': random.randint(1000, 9999),
        'image': data.get('image', '📸'),
        'text': data.get('text', ''),
        'time': datetime.now(),
        'views': []
    }
    
    stories[username].append(new_story)
    
    return jsonify({'success': True, 'story': new_story})

@app.route('/api/story/<user>/view', methods=['POST'])
def view_story(user):
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    
    if user in stories and stories[user]:
        for story in stories[user]:
            if username not in story['views']:
                story['views'].append(username)
    
    return jsonify({'success': True})

@app.route('/api/story/<user>/get', methods=['GET'])
def get_user_stories(user):
    if 'username' not in session:
        return jsonify({'success': False})
    
    if user in stories:
        user_stories = []
        for story in stories[user]:
            user_stories.append({
                'id': story['id'],
                'image': story['image'],
                'text': story['text'],
                'time': story['time'].strftime('%H:%M'),
                'views': len(story['views'])
            })
        return jsonify({'success': True, 'stories': user_stories})
    
    return jsonify({'success': False, 'stories': []})

# ===== CHAT API =====
@app.route('/api/chats', methods=['GET'])
def get_chats():
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    
    if username not in messages:
        messages[username] = {}
    
    chat_list = []
    for chat_user, msgs in messages[username].items():
        if msgs:
            last_msg = msgs[-1]
            unread = sum(1 for msg in msgs if msg['from'] != username and not msg.get('read', False))
            
            chat_list.append({
                'user': chat_user,
                'name': users[chat_user]['name'],
                'avatar': users[chat_user]['avatar'],
                'last_message': last_msg['text'],
                'time': last_msg['time'],
                'unread': unread,
                'online': users[chat_user].get('online', False)
            })
    
    return jsonify({'success': True, 'chats': chat_list})

@app.route('/api/chat/<chat_user>', methods=['GET'])
def get_chat(chat_user):
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    
    if username in messages and chat_user in messages[username]:
        # Mark as read
        for msg in messages[username][chat_user]:
            if msg['from'] == chat_user:
                msg['read'] = True
        
        return jsonify({
            'success': True,
            'messages': messages[username][chat_user],
            'user': {
                'name': users[chat_user]['name'],
                'avatar': users[chat_user]['avatar'],
                'online': users[chat_user].get('online', False)
            }
        })
    
    return jsonify({'success': True, 'messages': [], 'user': {
        'name': users[chat_user]['name'],
        'avatar': users[chat_user]['avatar'],
        'online': users[chat_user].get('online', False)
    }})

@app.route('/api/chat/<chat_user>/send', methods=['POST'])
def send_message(chat_user):
    if 'username' not in session:
        return jsonify({'success': False})
    
    username = session['username']
    data = request.json
    
    message = {
        'from': username,
        'text': data['text'],
        'time': datetime.now().strftime('%H:%M'),
        'read': False
    }
    
    # Add to sender's chat
    if username not in messages:
        messages[username] = {}
    if chat_user not in messages[username]:
        messages[username][chat_user] = []
    messages[username][chat_user].append(message)
    
    # Add to receiver's chat
    if chat_user not in messages:
        messages[chat_user] = {}
    if username not in messages[chat_user]:
        messages[chat_user][username] = []
    messages[chat_user][username].append(message)
    
    return jsonify({'success': True, 'message': message})

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 SocialHub Pro - With Real-time Chat & Stories!")
    print("="*70)
    print("\n📂 New Features:")
    print("   💬 Real-time Chat System")
    print("   📖 Instagram-style Stories")
    print("   🔔 Unread message badges")
    print("   👁️  Story views tracking")
    print("   ⚡ Live online status")
    print("\n📱 Open: http://localhost:5000")
    print("\n👥 Demo Accounts:")
    print("   demo/demo123  |  emma/pass123  |  david/pass123  |  sarah/pass123")
    print("\n✨ Try These:")
    print("   1. Click envelope icon to open chat")
    print("   2. Click story circles to view stories")
    print("   3. Click + to add your own story")
    print("   4. Send messages in real-time")
    print("\n⏹️  Press CTRL+C to stop")
    print("="*70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
