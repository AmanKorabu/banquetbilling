import { Button, Modal } from 'antd'
import React from 'react'

const DeleteModal = ({ openDelete, onCancel, DeleteItem, deleteTarget }) => {
    return (
        <Modal
            title='Delete'
            open={openDelete}
            centered
            onCancel={onCancel}
            footer={[
                <Button key="cancel" type="default" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="delete" type="primary" danger onClick={DeleteItem}
                >
                    Delete
                </Button>,
            ]}
        >
            <p>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </p>

        </Modal>
    )
}

export default React.memo(DeleteModal)
