import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { EmailVerification } from './pages/EmailVerification';
import { NotesList } from './pages/NotesList';
import { NoteDetail } from './pages/NoteDetail';
import { NoteForm } from './pages/NoteForm';
export function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/notes" replace />} />
            <Route path="notes" element={<NotesList />} />
            <Route path="notes/new" element={<NoteForm />} />
            <Route path="notes/:id" element={<NoteDetail />} />
            <Route path="notes/:id/edit" element={<NoteForm />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </Router>
    </AppProvider>);

}