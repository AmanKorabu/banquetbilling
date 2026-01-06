import { Button, Modal } from 'antd'
import React from 'react'


const DeletedItemsModal = ({ activeopen, onCancel, data, loadingDlt, onRestore, restoringId, titileName }) => {


  return (
    <>
      <Modal
        title={<h2>Deleted Companies</h2>}
        open={activeopen}
        centered
        footer={<Button onClick={onCancel}>Close</Button>}
        maskClosable={false}
        onCancel={onCancel}
        width={800}
      >
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>{titileName}</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingDlt ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-overlay">
                      <div className="loader"></div>
                      <p>Loading data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    No deleted {titileName} are found
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{item.name}</td>
                    <td>
                      <button
                        className="btn-restore"
                        onClick={() => onRestore(item)}
                        disabled={restoringId === item.id}
                      >
                        {restoringId === item.id ? 'Restoring...' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>


          </table>
        </div>


      </Modal>
      <style jsx>
        {`
                .table-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Inter, system-ui, sans-serif;
}

.modern-table thead {
  background: #f9fafb;
}

.modern-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.modern-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #4b5563;
}

.modern-table tbody tr {
  transition: background 0.2s ease;
}

.modern-table tbody tr:hover {
  background: #f3f4f6;
}

.modern-table tbody tr:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}
.btn-restore {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-restore:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}
  
.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e5e5;
  border-top-color: #144a7c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;
}

.loading-overlay p {
  font-size: 0.95rem;
  color: #555;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

`}
      </style>
    </>
  )
}

export default React.memo(DeletedItemsModal)
