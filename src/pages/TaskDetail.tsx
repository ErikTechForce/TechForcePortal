import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { getTaskById, employees } from '../data/tasks';
import './Page.css';
import './TaskDetail.css';

const TaskDetail: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const taskIdNum = taskId ? parseInt(taskId, 10) : null;
  const taskData = taskIdNum ? getTaskById(taskIdNum) : null;
  
  const [task, setTask] = useState(taskData?.name || 'Task');
  const [startDate, setStartDate] = useState(() => {
    if (taskData?.startDate) {
      return taskData.startDate;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Unassigned' | 'In Progress' | 'Completed'>(
    taskData?.status || 'In Progress'
  );
  const [assignedTo, setAssignedTo] = useState(taskData?.assignedTo || '');
  const [notes, setNotes] = useState(taskData?.notes || '');

  useEffect(() => {
    if (taskData) {
      setTask(taskData.name);
      setStatus(taskData.status);
      setAssignedTo(taskData.assignedTo || '');
      setNotes(taskData.notes || '');
      if (taskData.startDate) {
        setStartDate(taskData.startDate);
      }
    }
  }, [taskData]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle update logic here
    console.log('Task updated:', { task, startDate, status, assignedTo, notes });
    // Navigate back to tasks board
    navigate('/tasks');
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Task Details</h2>
            <p className="page-subtitle">View and update task information</p>
            
            <form className="task-detail-form" onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="task" className="form-label">Task</label>
                <input
                  type="text"
                  id="task"
                  className="form-input"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Number {taskIdNum || ''}</label>
              </div>

              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Unassigned' | 'In Progress' | 'Completed')}
                  required
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo" className="form-label">Assigned To</label>
                <SearchableDropdown
                  options={employees}
                  value={assignedTo}
                  onChange={setAssignedTo}
                  placeholder="Select or type employee name..."
                  required={false}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">Additional Notes</label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Enter any additional notes or comments about this task..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => navigate('/tasks')}>
                  Cancel
                </button>
                <button type="submit" className="update-button">
                  Update
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskDetail;

