import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import Dashboard from './pages/Dashboard';
import TasksBoard from './pages/TasksBoard';
import TaskDetail from './pages/TaskDetail';
import AddTask from './pages/AddTask';
import Client from './pages/Client';
import ClientDetail from './pages/ClientDetail';
import LeadDetail from './pages/LeadDetail';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import RobotDetail from './pages/RobotDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import Robots from './pages/Robots';
import Contract from './pages/Contract';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailRequired from './pages/VerifyEmailRequired';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-required" element={<VerifyEmailRequired />} />
          <Route path="/contract/:contractId" element={<Contract />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksBoard />} />
            <Route path="/tasks/add" element={<AddTask />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/client" element={<Client />} />
            <Route path="/client/:clientId" element={<ClientDetail />} />
            <Route path="/lead/:leadId" element={<LeadDetail />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/product/:productId" element={<ProductDetail />} />
            <Route path="/inventory/product/:productId/robot/:serialNumber" element={<RobotDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<CreateOrder />} />
            <Route path="/orders/:orderNumber" element={<OrderDetail />} />
            <Route path="/robots" element={<Robots />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;


