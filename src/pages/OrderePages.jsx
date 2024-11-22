import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import OrderPageLayout from '../layout.jsx/OrderPageLayout';
import { Me } from '../fitur/AuthSlice';

export const OrderePages = () => {
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
    if(isError){
      navigate('/')
    }
  
  }, [isError,navigate]);
  return (
   <>
   <OrderPageLayout />
   </>
  )
}
