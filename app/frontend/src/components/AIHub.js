import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AIHub() {
  const [activeTab, setActiveTab] = useState('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [textResult, setTextResult] = useState('');
  const [imageResult, setImageResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/ai/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const generateText = async (e) => {
    e.preventDefault();
    if (!textPrompt.trim()) return;

    setLoading(true);
    setTextResult('');

    try {
      const response = await axios.post(`${API}/ai/text`, {
        prompt: textPrompt,
        model: 'gpt-5.2'
      });
      setTextResult(response.data.result);
      fetchHistory();
    } catch (error) {
      console.error('Error generating text:', error);
      setTextResult('Error generating text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (e) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    setLoading(true);
    setImageResult('');

    try {
      const response = await axios.post(`${API}/ai/image`, {
        prompt: imagePrompt,
        model: 'nano-banana'
      });
      setImageResult(response.data.image_url);
      fetchHistory();
    } catch (error) {
      console.error('Error generating image:', error);
      setImageResult('Error generating image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl fade-in" data-testid="ai-hub">
      <h1 className="text-4xl font-bold mb-2">🤖 AI Hub</h1>
      <p className="text-gray-400 mb-8">Powered by cutting-edge AI models</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Generation */}
        <div className="lg:col-span-2">
          <div className="glass-effect p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                data-testid="text-generation-tab"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'text' ? 'btn-gradient' : 'bg-gray-700'
                }`}
              >
                📝 Text Generation
              </button>
              <button
                data-testid="image-generation-tab"
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'image' ? 'btn-gradient' : 'bg-gray-700'
                }`}
              >
                🎨 Image Generation
              </button>
            </div>

            {/* Text Generation */}
            {activeTab === 'text' && (
              <div data-testid="text-generation-section">
                <form onSubmit={generateText} className="mb-6">
                  <textarea
                    data-testid="text-prompt-input"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Enter your prompt... (e.g., Write a story about space exploration)"
                    className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white mb-4 resize-none"
                    rows="4"
                  />
                  <button
                    data-testid="generate-text-button"
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-lg btn-gradient font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Text ✨'}
                  </button>
                </form>

                {textResult && (
                  <div className="glass-effect p-6" data-testid="text-result">
                    <h3 className="font-bold mb-3 gradient-text">Result:</h3>
                    <p className="text-gray-200 whitespace-pre-wrap">{textResult}</p>
                  </div>
                )}
              </div>
            )}

            {/* Image Generation */}
            {activeTab === 'image' && (
              <div data-testid="image-generation-section">
                <form onSubmit={generateImage} className="mb-6">
                  <textarea
                    data-testid="image-prompt-input"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want... (e.g., A futuristic city at sunset)"
                    className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white mb-4 resize-none"
                    rows="4"
                  />
                  <button
                    data-testid="generate-image-button"
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-lg btn-gradient font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Image 🎨'}
                  </button>
                </form>

                {imageResult && (
                  <div className="glass-effect p-6" data-testid="image-result">
                    <h3 className="font-bold mb-3 gradient-text">Result:</h3>
                    <img
                      src={imageResult}
                      alt="AI Generated"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-effect p-6" data-testid="ai-history">
            <h2 className="text-xl font-bold mb-4">📊 Recent History</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.slice(0, 10).map((item, index) => (
                <div key={item.id} className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition" data-testid={`history-item-${index}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{item.type === 'text' ? '📝' : '🎨'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{item.prompt}</p>
                </div>
              ))}
              
              {history.length === 0 && (
                <p className="text-gray-400 text-sm" data-testid="no-history">No generation history yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIHub;
