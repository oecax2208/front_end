import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout.jsx/Layout'
import { Me } from '../fitur/AuthSlice'
import { Branch } from '../componen/Branch';

export const BranchPages = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError } = useSelector((state) => state.auth);
    
    useEffect(() => {
      dispatch(Me());
    }, [dispatch]);
  
    useEffect(() => {
      if(isError){
        navigate('/')
      }
    
    }, [isError,navigate]);
  return (
    <Layout>
    <Branch />
  </Layout>
  )
}
