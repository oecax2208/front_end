import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Me } from '../fitur/AuthSlice';
import TransactionsLayout from '../layout.jsx/TransaksionLayout';

export const TransaksiKasirPages = () => {
    const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isError } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(Me());
      } catch {
        navigate('/');
      }
    };
    fetchData();
  }, [dispatch, navigate]);

  useEffect(() => {
    if (isError) {
      navigate('/');
    }
  }, [isError, navigate]);
  return (
  <>
    <TransactionsLayout userUuid={user?.uuid} userRole={user?.role}/>
    </>
  )
}
