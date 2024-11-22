import React,{useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider,useDispatch  } from 'react-redux';
import { store } from './app/store';
import { LoginPage } from './componen/LoginPage';
import { DashboardPages } from './pages/DashboardPages';
import { UserListPages } from './pages/UserListPages';
import { ProfilePages } from './pages/ProfilePages';
import { OrderePages } from './pages/OrderePages';
import { TransactionPages } from './pages/TransactionPages';
import { ProductPages } from './pages/ProductPages';
import { CategoryPages } from './pages/CategoryPages';
import { ProfileKasirPages } from './pages/ProfileKasirPages';
import { TransaksiKasirPages } from './pages/TransaksiKasirPages';
import { BranchPages } from './pages/BranchPages';
import { PrivateRoute } from './PrivateRoute';
import { InvoicePages } from './pages/InvoicePages';
import { ProdukPerCabangPages } from './pages/ProductPerCabangPages';//view transaksi kasir
import SetProdukCabangPages from './pages/SetProdukCabangPages';
import { WearhousePages } from './pages/WearhousePages';
import { ConfirmPages } from './pages/ConfirmPages';
import { SendProductPages } from './pages/SendProductPages';
import { StockCabangPages } from './pages/StockCabangPages';
import { StockAllBranchPages } from './pages/StockAllBrancPages';
import { KomprehensifPages } from './pages/invoicePages/KomprehensifPages';
import { PenjualanPerkategoriPages } from './pages/invoicePages/PenjualanPerkategoriPages';
import { StockPerCabangPages } from './pages/invoicePages/StockPerCabangPages';
import { CreateJurnalPages } from './pages/jurnalPages/CreateJurnalPages';
import { GetJurnalPages } from './pages/jurnalPages/GetJurnalPages';
//import Product from './componen/kasir/transaksi/Produc';
import { MutasiPages } from './pages/MutasiPages';
import { TableDataPages } from './pages/table/TableDataPages';
import { Me } from './fitur/AuthSlice';
import { TableMenuPages } from './pages/table/TableMenuPages';
import NotificationLayout from './layout.jsx/NotificationLayout';
import DetailsLayout from './layout.jsx/DetailsLayout';
import OrderStatusPage from './componen/OrderStatusPage';


function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(Me());
  }, [dispatch]);
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          {/* API ADMIN */}
          <Route path="/dashboard" element={<DashboardPages />} />
          <Route path="/userlist" element={<UserListPages />} />
          <Route path="/profile" element={<ProfilePages />} />
          <Route path="/branch" element={<BranchPages />} />
          <Route path="/transaction" element={<TransactionPages />} />
          <Route path="/product" element={<ProductPages />} />
          <Route path="/category" element={<CategoryPages />} />
          <Route path="/laporan" element={<InvoicePages />} />
          <Route path="/setprodukpercabang" element={<SetProdukCabangPages />} />
          <Route path="/wearhouse" element={<WearhousePages />} />
          <Route path="/send" element={<SendProductPages />} />
          <Route path="/stockallbranch" element={<StockAllBranchPages />} />
          <Route path="/mutasi" element={<MutasiPages />} />
          <Route path="/komprehensif" element={<KomprehensifPages />} />
          <Route path="/penjualankategori" element={<PenjualanPerkategoriPages />} />
          <Route path="/stockpages" element={<StockPerCabangPages />} />
          <Route path="/createjurnal" element={<CreateJurnalPages />} />
          <Route path="/getjurnal" element={<GetJurnalPages />} />
          <Route path="/detail" element={<DetailsLayout />} />
          <Route path="/stockcabang" element={<StockCabangPages />} />  
          <Route path="/confirm" element={<ConfirmPages />} />
          <Route path="/meja" element={<TableDataPages />} />
          <Route path="/menu/:cabangUuid/:tableId" element={<TableMenuPages />} />
          <Route path="/notification" element={<NotificationLayout />} />
          {/*batas API ADMIN */}
          <Route path="/profilekasir" element={<ProfileKasirPages />} />
          <Route
            path="/transaksikasir"
            element={
              <PrivateRoute
                element={<TransaksiKasirPages />}
                allowedRoles={['kasir']} 
              />
            }
          />
           <Route path="/order" element={<OrderePages />} />
           {/* view transaksi kasir */}
           <Route path="/produkpercabang" element={<ProdukPerCabangPages />} /> 
          {/* view transaksi kasir */}
           {/* view transaksi kasir */}
           {/* <Route path="/produktransaksi" element={<Product />} />  */}
          {/* view transaksi kasir */}
          <Route path="/order-status" element={<OrderStatusPage />} />
          <Route path="/status/:orderId" element={<OrderStatusPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
