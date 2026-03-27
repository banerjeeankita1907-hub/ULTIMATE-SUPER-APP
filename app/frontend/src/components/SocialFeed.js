import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`${API}/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await axios.post(`${API}/posts`, {
        content: newPost,
        tags: []
      });
      setPosts([response.data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const likePost = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const addComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      await axios.post(`${API}/comments`, {
        post_id: postId,
        content: content
      });
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (postId) => {
    if (comments[postId]) {
      setComments(prev => ({ ...prev, [postId]: null }));
    } else {
      fetchComments(postId);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl fade-in" data-testid="social-feed">
      <h1 className="text-4xl font-bold mb-8">👥 Social Feed</h1>

      {/* Create Post */}
      <div className="glass-effect p-6 mb-8" data-testid="create-post-section">
        <form onSubmit={createPost}>
          <textarea
            data-testid="post-input"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white mb-4 resize-none"
            rows="3"
          />
          <button
            data-testid="create-post-button"
            type="submit"
            className="px-6 py-2 rounded-lg btn-gradient font-semibold"
          >
            Post 🚀
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6" data-testid="posts-list">
        {posts.map((post, index) => (
          <div key={post.id} className="glass-effect p-6 card-hover" data-testid={`post-${index}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                {post.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold" data-testid={`post-${index}-username`}>{post.username}</h3>
                <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <p className="mb-4 text-gray-200" data-testid={`post-${index}-content`}>{post.content}</p>
            
            <div className="flex items-center gap-6">
              <button
                data-testid={`post-${index}-like-button`}
                onClick={() => likePost(post.id)}
                className={`flex items-center gap-2 hover:text-pink-400 transition ${
                  post.likes?.includes(user.id) ? 'text-pink-400' : ''
                }`}
              >
                ❤️ <span data-testid={`post-${index}-likes-count`}>{post.likes?.length || 0}</span>
              </button>
              
              <button
                data-testid={`post-${index}-comment-toggle`}
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 hover:text-blue-400 transition"
              >
                💬 Comments
              </button>
            </div>

            {/* Comments Section */}
            {comments[post.id] && (
              <div className="mt-4 pt-4 border-t border-gray-700" data-testid={`post-${index}-comments-section`}>
                <div className="space-y-3 mb-4">
                  {comments[post.id].map((comment, cidx) => (
                    <div key={comment.id} className="flex gap-3" data-testid={`post-${index}-comment-${cidx}`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">
                        {comment.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{comment.username}</p>
                        <p className="text-gray-300">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    data-testid={`post-${index}-comment-input`}
                    type="text"
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                  <button
                    data-testid={`post-${index}-comment-submit`}
                    onClick={() => addComment(post.id)}
                    className="px-4 py-2 rounded-lg btn-gradient"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="glass-effect p-12 text-center" data-testid="no-posts">
            <p className="text-gray-400 text-lg">No posts yet. Be the first to share something! 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialFeed;
