import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/components/users/UserRoleUtils';

interface RequirePermissionProps {
  module: string;
  children: React.ReactNode;
}

const RequirePermission: React.FC<RequirePermissionProps> = ({ module, children }) => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!hasPermission(userRole, module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RequirePermission;

