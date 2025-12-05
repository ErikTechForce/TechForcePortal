import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { employees, products } from '../data/tasks';
import './Page.css';
import './AddTask.css';

const AddTask: React.FC = () => {
  const navigate = useNavigate();
  
  const [companyName, setCompanyName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [typeOfTask, setTypeOfTask] = useState('');
  const [product, setProduct] = useState('');
  const [assignTo, setAssignTo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('New task:', { companyName, deadline, typeOfTask, product, assignTo });
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
            <h2 className="page-title">Add New Task</h2>
            <p className="page-subtitle">Create a new task with details</p>
            
            <form className="add-task-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline" className="form-label">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="typeOfTask" className="form-label">Type of Task</label>
                <select
                  id="typeOfTask"
                  className="form-select"
                  value={typeOfTask}
                  onChange={(e) => setTypeOfTask(e.target.value)}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product" className="form-label">Product</label>
                <SearchableDropdown
                  options={products}
                  value={product}
                  onChange={setProduct}
                  placeholder="Select or type product name..."
                  required={false}
                  noResultsMessage="No products found"
                />
              </div>

              <div className="form-group">
                <label htmlFor="assignTo" className="form-label">Assign To</label>
                <SearchableDropdown
                  options={employees}
                  value={assignTo}
                  onChange={setAssignTo}
                  placeholder="Select or type employee name..."
                  required={false}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => navigate('/tasks')}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddTask;

