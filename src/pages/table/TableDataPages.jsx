import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../layout.jsx/Layout';
import { Me } from '../../fitur/AuthSlice';
import { TableData } from '../../componen/table/TableData';

export const TableDataPages = () => {
      const dispatch = useDispatch();
        const navigate = useNavigate();
        const { user,isError } = useSelector((state) => state.auth);
        
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
       <TableData userUuid={user?.uuid} userRole={user?.role}/>
     </Layout>
  )
}
