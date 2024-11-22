import React from 'react';
import { format } from 'date-fns';

const ReceiptContent = React.forwardRef(({ orderData }, ref) => {
  if (!orderData) return null;

  return (
    <div ref={ref} style={{ width: '58mm', padding: '5mm', fontFamily: 'monospace', fontSize: '12px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0' }}>RECEIPT</h2>
        <p style={{ margin: '5px 0' }}>Order #{orderData.kode_transaksi}</p>
        <p style={{ margin: '5px 0' }}>{format(new Date(orderData.createdAt), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', marginBottom: '10px' }}>
        <p style={{ margin: '0' }}>Table: {orderData.table?.nama_meja || 'N/A'}</p>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ margin: '0 0 5px 0' }}>ITEMS</h3>
        {orderData.transaksi_details?.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <div>
              <span>{item.jumlah}x </span>
              <span>{item.barang?.namabarang}</span>
            </div>
            <div>Rp{item.harga_satuan?.toLocaleString()}</div>
          </div>
        ))}
      </div>
      
      <div style={{ borderTop: '1px dashed #000', padding: '5px 0', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <div>TOTAL</div>
          <div>Rp{orderData.total_harga?.toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <div>Payment Status</div>
          <div>{orderData.status_pembayaran === 'settlement' ? 'PAID' : 'PENDING'}</div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ margin: '0' }}>Thank you for your order!</p>
      </div>
    </div>
  );
});

export default ReceiptContent;