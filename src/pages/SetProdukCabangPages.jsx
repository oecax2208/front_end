import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout.jsx/Layout';
import { Me } from '../fitur/AuthSlice';
import { SetProdukCabang } from '../componen/SetProdukCabang';


const SetProdukCabangPages = () => {
 const dispatch = useDispatch();
   const navigate = useNavigate();
   const { isError } = useSelector((state) => state.auth);
 
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
    <Layout>
     <SetProdukCabang />
    </Layout>
   )
 }

export default SetProdukCabangPages