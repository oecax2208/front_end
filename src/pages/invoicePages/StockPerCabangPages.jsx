import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../layout.jsx/Layout';
import { Me } from '../../fitur/AuthSlice';
import { StockPerCabang } from '../../componen/invoiceall/StockPerCabang';

export const StockPerCabangPages = () => {
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
       <StockPerCabang />
     </Layout>
  )
}
