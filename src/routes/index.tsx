import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { NotFound } from './StatusPages'

import { Login } from '../features/auth/pages/Login'
import { Register } from '../features/auth/pages/Register'
import { AvisosList } from '../features/avisos/pages/AvisosList'
import { AvisoDetail } from '../features/avisos/pages/AvisoDetail'
import { AvisoEdit } from '../features/avisos/pages/AvisoEdit'
import { AnunciosList } from '../features/anuncios/pages/AnunciosList'
import { AnuncioDetail } from '../features/anuncios/pages/AnuncioDetail'
import { AnuncioEdit } from '../features/anuncios/pages/AnuncioEdit'
import { MatchEvaluate } from '../features/match/pages/MatchEvaluate'
import { UsersList } from '../features/users/pages/UsersList'
import { UserForm } from '../features/users/pages/UserForm'
import { UserDetail } from '../features/users/pages/UserDetail'
import { Promote } from '../features/match/pages/Promote'
import { Ingestion } from '../features/ingestion/pages/Ingestion'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/avisos" replace />} />

        {/* Public */}
        <Route path="login" element={<Login />} />
        <Route path="registar" element={<Register />} />
        <Route path="avisos" element={<AvisosList />} />
        <Route path="avisos/:id" element={<AvisoDetail />} />
        <Route path="anuncios" element={<AnunciosList />} />
        <Route path="anuncios/:id" element={<AnuncioDetail />} />
        <Route path="match" element={<MatchEvaluate />} />

        {/* Admin / commercial */}
        <Route
          path="avisos/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <AvisoEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="anuncios/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <AnuncioEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <UserForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="promover"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <Promote />
            </ProtectedRoute>
          }
        />
        <Route
          path="ingestao"
          element={
            <ProtectedRoute roles={['admin', 'commercial']}>
              <Ingestion />
            </ProtectedRoute>
          }
        />

        {/* Any authenticated user (backend enforces record-level access) */}
        <Route
          path="users/:id"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute>
              <UserForm mode="edit" />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
