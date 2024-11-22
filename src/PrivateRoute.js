import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const PrivateRoute = ({ element, allowedRoles, ...rest }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) {
        return <Navigate to="/" />;
      }
      if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/transaksikasir" />;
      }
      if (!user) {
        return <div>Loading...</div>;
      }
      return element;
 
}
