import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Productivity() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchNotes();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await axios.post(`${API}/tasks`, newTask);
      setNewTask({ title: '', priority: 'medium' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`${API}/tasks/${taskId}/status?status=${status}`);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      await axios.post(`${API}/notes`, newNote);
      setNewNote({ title: '', content: '' });
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/notes/${noteId}`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl fade-in" data-testid="productivity">
      <h1 className="text-4xl font-bold mb-8">✅ Productivity Hub</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          data-testid="tasks-tab"
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'tasks' ? 'btn-gradient' : 'bg-gray-700'
          }`}
        >
          ✅ Tasks
        </button>
        <button
          data-testid="notes-tab"
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'notes' ? 'btn-gradient' : 'bg-gray-700'
          }`}
        >
          📝 Notes
        </button>
      </div>

      {/* Tasks Section */}
      {activeTab === 'tasks' && (
        <div data-testid="tasks-section">
          {/* Create Task */}
          <div className="glass-effect p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <form onSubmit={createTask} className="space-y-4">
              <input
                data-testid="task-title-input"
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title..."
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
              <div className="flex gap-4">
                <select
                  data-testid="task-priority-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <button
                  data-testid="create-task-button"
                  type="submit"
                  className="px-6 py-3 rounded-lg btn-gradient font-semibold"
                >
                  Add Task ➕
                </button>
              </div>
            </form>
          </div>

          {/* Tasks List */}
          <div className="space-y-4" data-testid="tasks-list">
            {tasks.map((task, index) => (
              <div key={task.id} className="glass-effect p-6 card-hover" data-testid={`task-${index}`}>
                <div className="flex items-start gap-4">
                  <input
                    data-testid={`task-${index}-checkbox`}
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      task.status === 'completed' ? 'line-through text-gray-500' : ''
                    }`} data-testid={`task-${index}-title`}>
                      {task.title}
                    </h3>
                    <div className="flex gap-4 mt-2">
                      <span className={`text-sm ${getPriorityColor(task.priority)}`} data-testid={`task-${index}-priority`}>
                        {task.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-sm text-gray-400" data-testid={`task-${index}-status`}>
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="glass-effect p-12 text-center" data-testid="no-tasks">
                <p className="text-gray-400 text-lg">No tasks yet. Create your first task! ✅</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {activeTab === 'notes' && (
        <div data-testid="notes-section">
          {/* Create Note */}
          <div className="glass-effect p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Note</h2>
            <form onSubmit={createNote} className="space-y-4">
              <input
                data-testid="note-title-input"
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Note title..."
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
              <textarea
                data-testid="note-content-input"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Note content..."
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none"
                rows="5"
              />
              <button
                data-testid="create-note-button"
                type="submit"
                className="px-6 py-3 rounded-lg btn-gradient font-semibold"
              >
                Save Note 💾
              </button>
            </form>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="notes-grid">
            {notes.map((note, index) => (
              <div key={note.id} className="glass-effect p-6 card-hover" data-testid={`note-${index}`}>
                <h3 className="text-lg font-bold mb-3" data-testid={`note-${index}-title`}>{note.title}</h3>
                <p className="text-gray-300 mb-4 line-clamp-4" data-testid={`note-${index}-content`}>{note.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    data-testid={`delete-note-${index}`}
                    onClick={() => deleteNote(note.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="col-span-full glass-effect p-12 text-center" data-testid="no-notes">
                <p className="text-gray-400 text-lg">No notes yet. Create your first note! 📝</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Productivity;
