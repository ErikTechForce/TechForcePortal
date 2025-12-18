import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TasksBoard from './pages/TasksBoard';
import TaskDetail from './pages/TaskDetail';
import AddTask from './pages/AddTask';
import Client from './pages/Client';
import ClientDetail from './pages/ClientDetail';
import LeadDetail from './pages/LeadDetail';
import Inventory from './pages/Inventory';
import Robots from './pages/Robots';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksBoard />} />
        <Route path="/tasks/add" element={<AddTask />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/client" element={<Client />} />
        <Route path="/client/:clientId" element={<ClientDetail />} />
        <Route path="/lead/:leadId" element={<LeadDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/robots" element={<Robots />} />
      </Routes>
    </Router>
  );
}

export default App;


