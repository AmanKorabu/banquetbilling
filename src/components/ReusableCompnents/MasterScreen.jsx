import React from 'react';
import { LuPencil, LuTrash2 } from "react-icons/lu";

const MasterScreen = (props) => {

    const hasRate = React.useMemo(() => {
        return props.Data?.length > 0 && 'rate' in props.Data[0];
    }, [props.Data]);

    const handleEdit = React.useCallback(
        (item) => props.onEdit?.(item),
        [props.onEdit]
    );

    const handleDelete = React.useCallback(
        (item) => props.onDelete?.(item),
        [props.onDelete]
    );


    return (
        <div className="container">
            <div className="header">
                <h1>{props.title}</h1>
                <div className="actions">
                    <button className="btn primary" onClick={props.newBtn}>New</button>
                    <button className="btn secondary" onClick={props.deleteViewBtn}>View Deleted {props.viewTitle}</button>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="col sr-no">Sr. No</div>
                    <div className="col name">Name</div>
                    {hasRate && <div className='col rate'>Rate</div>}
                    <div className="col actions-col">Actions</div>
                </div>

                <div className="table-body">
                    {props.loading && (
                        <div className="loading-overlay">
                            <div className="loader"></div>
                            <p>Loading data...</p>
                        </div>
                    )}

                    {props.Data.map((item, idx) => (
                        <div key={item.id} className="table-row">

                            <div className="col sr-no">{idx + 1}</div>
                            <div className="col name">{item.name}</div>
                            {hasRate && <div className='col rate'>{item.rate || '-'}</div>}

                            <div className="col actions-col">
                                <button className="action-btn" onClick={() => handleEdit(item)}>

                                    <span>
                                        <LuPencil size={14} />
                                    </span>
                                </button>
                                <button className="action-btn" onClick={() => handleDelete(item)}>
                                    <span>
                                        <LuTrash2 />
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .container {
                    padding: 2rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
                    background: #fafafa;
                    min-height: 100vh;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2.5rem;
                }

                .header h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0;
                    letter-spacing: -0.025em;
                }

                .actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    border: 1px solid #e5e5e5;
                    background: white;
                    color: #666;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }

                .btn.primary {
                    background: #144a7cff;
                    color: white;
                    border-color: #fcfbfbff;
                }
               .btn.primary:active {
  transform: scale(0.96);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) inset;
}

                .btn.primary:hover {
                    background: #333;
                    border-color: #333;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .btn.secondary {
                    color: #666;
                    border-color: #e0e0e0;
                }

                .btn.secondary:hover {
                    border-color: #ccc;
                    background: #f8f8f8;
                }

                .table-container {
                    background: white;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    border: 1px solid #f0f0f0;
                }

                /* Dynamic grid based on whether rate is shown */
                .table-header {
                    display: grid;
                    ${hasRate
                    ? 'grid-template-columns: 80px 1fr 1fr 180px;'
                    : 'grid-template-columns: 80px 1fr 180px;'
                }
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .table-row {
                    display: grid;
                    ${hasRate
                    ? 'grid-template-columns: 80px 1fr 1fr 180px;'
                    : 'grid-template-columns: 80px 1fr 180px;'
                }
                    border-bottom: 1px solid #f8f8f8;
                    transition: background-color 0.15s ease;
                }

                .table-row:hover {
                    background-color: #fafafa;
                }

                .table-row:last-child {
                    border-bottom: none;
                }

                .col {
                    padding: 5px 1.5rem;
                    display: flex;
                    align-items: center;
                }

                .sr-no {
                    color: #888;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .name {
                    color: #333;
                    font-weight: 500;
                    font-size: 0.95rem;
                }

                .actions-col {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-start;
                }

                .action-btn {
                    background: transparent;
                    border: 1px solid #e8e8e8;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0.5rem;
                    align-items: center;
                    display: flex;
                    justify-content: center;
                    border-radius: 0.375rem;
                    transition: all 0.15s ease;
                    width: 2rem;
                    height: 2rem;
                }

                .action-btn:hover {
                    background: #f8f8f8;
                    border-color: #ddd;
                    transform: translateY(-1px);
                }

                .action-btn:first-child:hover {
                    color: #007aff;
                    border-color: rgba(0, 122, 255, 0.2);
                    background: rgba(0, 122, 255, 0.05);
                }

                .action-btn:last-child:hover {
                    color: #ff3b30;
                    border-color: rgba(255, 59, 48, 0.2);
                    background: rgba(255, 59, 48, 0.05);
                }

                /* Smooth animations */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .table-row {
                    animation: fadeIn 0.3s ease-out;
                    animation-fill-mode: both;
                }

                .table-row:nth-child(1) { animation-delay: 0.05s; }
                .table-row:nth-child(2) { animation-delay: 0.1s; }
                .table-row:nth-child(3) { animation-delay: 0.15s; }
                .table-row:nth-child(4) { animation-delay: 0.2s; }
                .table-row:nth-child(5) { animation-delay: 0.25s; }

                /* Responsive - with dynamic columns */
                @media (max-width: 768px) {
                    .container {
                        padding: 5px;
                    }
                    
                    .header {
                        flex-direction: column  ;
                        align-items: center;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                    
                    .actions {
                        width: 100%;
                    }
                    
                    .btn {
                        flex: 1;
                        justify-content: center;
                    }
                    
                    .table-header {
                        ${hasRate
                    ? 'grid-template-columns: 60px 1fr 1fr 140px;'
                    : 'grid-template-columns: 60px 1fr 140px;'
                }
                        font-size: 0.75rem;
                    }
                    
                    .table-row {
                        ${hasRate
                    ? 'grid-template-columns: 60px 1fr 1fr 140px;'
                    : 'grid-template-columns: 60px 1fr 140px;'
                }
                    }
                    
                    .col {
                        padding: 1rem;
                    }
                    
                    .actions-col {
                        justify-content: center;
                    }
                }
                    .loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
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

            `}</style>
        </div>
    );
};

export default React.memo(MasterScreen);