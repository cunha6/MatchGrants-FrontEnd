import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { NotFound } from './StatusPages'

import { Login } from '../features/auth/pages/Login'
import { Register } from '../features/auth/pages/Register'
import { ForgotPassword } from '../features/auth/pages/ForgotPassword'
import { ResetPassword } from '../features/auth/pages/ResetPassword'
import { AvisosList } from '../features/avisos/pages/AvisosList'
import { AvisoDetail } from '../features/avisos/pages/AvisoDetail'
import { AvisoEdit } from '../features/avisos/pages/AvisoEdit'
import { AnunciosList } from '../features/anuncios/pages/AnunciosList'
import { AnuncioDetail } from '../features/anuncios/pages/AnuncioDetail'
import { AnuncioEdit } from '../features/anuncios/pages/AnuncioEdit'
import { MatchEvaluate } from '../features/match/pages/MatchEvaluate'
import { PlannedGrants } from '../features/newsletter/pages/PlannedGrants'
import { Newsletter } from '../features/newsletter/pages/Newsletter'
import { UsersList } from '../features/users/pages/UsersList'
import { UserForm } from '../features/users/pages/UserForm'
import { UserDetail } from '../features/users/pages/UserDetail'
import { Promote } from '../features/match/pages/Promote'
import { Ingestion } from '../features/ingestion/pages/Ingestion'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/match" replace />} />

        {/* Public */}
        <Route path="login" element={<Login />} />
        <Route path="registar" element={<Register />} />
        <Route path="esqueci-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="avisos/:id" element={<AvisoDetail />} />
        <Route path="match" element={<MatchEvaluate />} />

        {/* Admin / commercial_grants / commercial_public */}
        <Route
          path="plano-anual"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <PlannedGrants />
            </ProtectedRoute>
          }
        />
        <Route
          path="newsletter"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <Newsletter />
            </ProtectedRoute>
          }
        />
        <Route
          path="avisos/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <AvisoEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="anuncios/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'commercial_public']}>
              <AnuncioEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <UserForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="promover"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <Promote />
            </ProtectedRoute>
          }
        />
        <Route
          path="ingestao"
          element={
            <ProtectedRoute roles={['admin', 'commercial_grants', 'commercial_public']}>
              <Ingestion />
            </ProtectedRoute>
          }
        />

        {/* Any authenticated user (backend enforces record-level access) */}
        <Route
          path="avisos"
          element={
            <ProtectedRoute>
              <AvisosList />
            </ProtectedRoute>
          }
        />
        {/* Everyone except commercial_grants — Contratações Públicas isn't their domain */}
        <Route
          path="anuncios"
          element={
            <ProtectedRoute roles={['admin', 'commercial_public', 'client', 'viewer']}>
              <AnunciosList />
            </ProtectedRoute>
          }
        />
        <Route
          path="anuncios/:id"
          element={
            <ProtectedRoute roles={['admin', 'commercial_public', 'client', 'viewer']}>
              <AnuncioDetail />
            </ProtectedRoute>
          }
        />
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
