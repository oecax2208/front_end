import React,{useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Me } from '../../fitur/AuthSlice';
import TableMenu from '../../componen/table/TableMenu';

export const TableMenuPages = () => {
        
       
        
       
  return (
    <>
       <TableMenu />
     </>
  )
}
