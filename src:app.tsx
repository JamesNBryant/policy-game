import { Routes, Route, Navigate } from 'react-router-dom'
import PublicView from './routes/PublicView'
import DMView from './routes/DMView'
import Login from './routes/Login'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import React, { useContext } from 'react'

const ProtectedRoute = ({
  adminOnly,
  children
}: {
  adminOnly?: boolean
  children: JSX.Element
}) => {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.user_metadata?.admin !== true) return <Navigate to="/public" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dm"
          element={
            <ProtectedRoute adminOnly>
              <DMView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/public"
          element={
            <ProtectedRoute>
              <PublicView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/public" replace />} />
      </Routes>
    </AuthProvider>
  )
}