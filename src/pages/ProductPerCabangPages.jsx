import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import OrderBranch from '../layout.jsx/OrderBranch';
import { Me } from '../fitur/AuthSlice';

export const ProdukPerCabangPages = () => {
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
   <OrderBranch />
   </>
  )
}
