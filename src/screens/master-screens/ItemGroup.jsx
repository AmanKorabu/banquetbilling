import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, message, Modal, Radio } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'


const ItemGroup = () => {

    const [open, setOpen] = useState(false);
    const [deletedOpen, setDeletedOpen] = useState(false);
    const [form] = Form.useForm();
    const [itemList, setItemList] = useState([]);
    const [deletedList, setDeletedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [targetDelete, setTargetDelete] = useState(null);
    const [restoreId, setRestoreId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const hotel_id = localStorage.getItem('hotel_id');
    const [editDetails, setEditDetails] = useState(null)
    const ItemData = async () => {
        try {
            setLoading(true)
            const respsone = await axios.get(`/banquetapi/get_all_item_grp.php?hotelid=${hotel_id}`)
            const formattedData = respsone.data.result.map((item) => ({
                id: item.GroupID,
                name: item.GroupName
            }))
            setItemList(formattedData)

        } catch (error) {
            message.error("cant't able to load item group SERVER DOWN!", error)
        }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        ItemData()
    }, [])
    const user_id = localStorage.getItem('user_id')
    const onFinish = async (values) => {
        try {
            setLoading(true);
            const payload = {
                GroupName: values.Item_Group_Name || "",
                name: "",
                CreatedDate: "",
                modif_name: "",
                ModifiedDate: "",
                GroupType: "",
                FBType: values.group_name || "",
            }
            if (isEditMode) {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/modify_item_grp.php?hotel_id=${hotel_id}&user_id=${user_id}&item_grp_name=${payload.GroupName}&fb_typ=${payload.FBType}&item_id=${editId}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                setOpen(false);
                message.success(`item is modified successfully!!!`)
            }
            else {
                const body = new URLSearchParams(payload);

                await axios.post(`/banquetapi/save_item_grp.php?hotel_id=${hotel_id}&user_id=${user_id}&item_grp_name=${payload.GroupName}&fb_typ=${payload.FBType}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                setOpen(false)

                form.resetFields()
            }
        } catch (error) {
            message.error(`Server error!!!!`, error)
        }
        finally {
            setLoading(false);
            ItemData()
        }


    }

    const deletedItemList = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_deleted_item_grps.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: item.GroupID,
                name: item.GroupName
            }))
            setDeletedList(formattedData)
        } catch (error) {
            message.error('Server Error!!!', error)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        deletedItemList();
    }, [])
    const viewDeleted = () => {
        setDeletedOpen(true)
    }
    const openDeletePop = (item) => {
        setOpenDeleteModal(true)
        setTargetDelete(item)
    }
    const DeleteItem = async () => {
        if (!targetDelete) return;
        try {
            setLoading(true);
            await axios.get(`/banquetapi/delete_or_active_item.php?item_id=${targetDelete.id}&action=delete
`)
            message.info(`${targetDelete.name} is deleted`);

            setOpenDeleteModal(false)
            ItemData()
        } catch (err) {
            message.error("Can't able to delete server error", err)
        } finally {
            setLoading(false);
            await deletedItemList()

        }
    }
    const restoreItem = async (item) => {
        try {
            setLoading(true);
            setRestoreId(item.id);
            await axios.get(`/banquetapi/delete_or_active_item.php?item_id=${item.id}&action=active
`)
            message.info(`${item.name} section is activated`)


        } catch (error) {
            message.err('server error!!!!', error)
        }
        finally {
            setLoading(false);
            setOpenDeleteModal(false);
            setDeletedOpen(false)
            await ItemData();
            await deletedItemList()
        }
    }
    const addNew = () => {
        setOpen(true)
        form.resetFields()
        setIsEditMode(false)
    }
    const edit = async (item) => {
        try {
            setOpen(true)
            setIsEditMode(true);
            setEditId(item.id)
            const res = await axios.get(`/banquetapi/get_item_grp_details.php?item_grp_id=${item.id}`)
            const itemDetails = res.data.result[0];
            form.setFieldsValue({
                Item_Group_Name: itemDetails.GroupName,
                group_name: itemDetails.FBType,
            })
            setEditDetails(itemDetails)



        } catch (error) {
            message.error('server error!!!', error)
        }
    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Item Group'
                Data={itemList}
                newBtn={addNew}
                loading={loading}
                onEdit={edit}
                onDelete={openDeletePop}
                deleteViewBtn={viewDeleted}
            />
            <Modal
                title={isEditMode ? 'Modify Item Group' : 'Add Item Group'}
                open={open}
                onCancel={() => setOpen(false)}
                maskClosable={false}
                okText={isEditMode ? 'Modify' : 'Save'}
                width={400}
                onOk={() => form.submit()}
                centered

            >

                <Form
                    form={form}
                    layout='vertical'
                    onFinish={onFinish}
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Item Group Name'
                        name='Item_Group_Name'
                        rules={[{ required: true, message: 'Item Group name is required' }]}>
                        <Input />


                    </Form.Item>
                    <Form.Item
                        name='group_name'
                        rules={[{ required: true, message: 'select FB mode or other atleast' }]}>
                        <Radio.Group>
                            <Radio value='1'>F&B</Radio>
                            <Radio value='2'>Non F&B</Radio>
                            <Radio value='3'>Other</Radio>
                        </Radio.Group>
                    </Form.Item>
                    {isEditMode && editDetails && (
                        <div className="audit-card">
                            <div className="audit-line">
                                <span className="label">Created By</span>
                                <span className="value">{editDetails.name || '--'}</span>
                                <span className="label">Modified By</span>
                                <span className="value">{editDetails.modif_name || '--'}</span>
                            </div>

                            <div className="audit-line">
                                <span className="label">Created Date</span>
                                <span className="value">{editDetails.CreatedDate || '--'}</span>
                            </div>

                            <div className="audit-line">
                                <span className="label">Modified Date</span>
                                <span className="value">{editDetails.ModifiedDate || '--'}</span>
                            </div>
                        </div>
                    )}


                </Form>
            </Modal>
            <DeleteModal
                openDelete={openDeleteModal}
                onCancel={() => setOpenDeleteModal(false)}
                loading={loading}
                deleteTarget={targetDelete}
                DeleteItem={DeleteItem}
            />
            <DeletedItemsModal
                activeopen={deletedOpen}
                data={deletedList}
                onCancel={() => setDeletedOpen(false)}
                loading={loading}
                titileName='Item Groups'
                onRestore={restoreItem}
                restoringId={restoreId}
            />
            <style>
                {
                    `.audit-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 16px;
}

.audit-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.audit-line:not(:last-child) {
  border-bottom: 1px dashed #e5e7eb;
}

.label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

@media (max-width: 480px) {
  .audit-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .value {
    text-align: left;
    max-width: 100%;
  }
}
`
                }
            </style>
        </>
    )
}

export default ItemGroup
