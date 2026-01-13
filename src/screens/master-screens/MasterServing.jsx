import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, message, Modal } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'


const MasterServing = () => {
    const [open, setOpen] = useState(false);
    const [activeOpen, setActiveOpen] = useState(false)
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [servingList, setServingList] = useState([]);
    const [deletedServingList, setDeletedServingList] = useState([])
    const [targetDelete, setTargetDelete] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editDetails, setEditDetails] = useState(null);
    const [restoreId, setRestoreId] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const hotel_id = localStorage.getItem('hotel_id');
    const user_id = localStorage.getItem('user_id');

    const fetchServings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_ser.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: item.MenuCategoryID,
                name: item.MenuCategoryName
            }))
            setServingList(formattedData)
        } catch (error) {
            message.error('Server Error!!!!!', error)

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchServings()
    }, [])
    const getDeletedServings = async () => {
        try {
            const res = await axios.get(`/banquetapi/get_deleted_ser.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: item.MenuCategoryID,
                name: item.MenuCategoryName
            }))
            setDeletedServingList(formattedData)


        } catch (error) {
            message.error('server error!!!', error)
        }
    }
    useEffect(() => {
        getDeletedServings()
    }, [])
    const addNew = () => {
        setOpen(true)
        setIsEditMode(false)
    }
    const edit = async (item) => {

        try {
            setLoading(true)
            setOpen(true)
            setIsEditMode(true)
            setEditId(item.id);
            const res = await axios.get(`/banquetapi/get_ser_details.php?ser_id=${item.id}`)
            const servingDetails = res.data.result[0]
            form.setFieldsValue({
                servingName: servingDetails.MenuCategoryName
            })
            setEditDetails(servingDetails)
        } catch (error) {
            message.error('server error!!!!', error)
        }
        finally {
            setLoading(false)
        }

    }
    const onFinish = async (values) => {
        try {
            setLoading(true)
            const payload = {
                MenuCategoryName: values.servingName,
                name: '',
                CreatedDate: '',
                modif_name: '',
                ModifiedDate: ''
            }
            if (isEditMode) {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/modify_ser.php?hotel_id=${hotel_id}&user_id=${user_id}&ser_id=${editId}&ser_name=${payload.MenuCategoryName}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                setOpen(false)
                message.success(`item is modified successfully!!!`);
            }
            else {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/save_menu_ser.php?hotel_id=${hotel_id}&user_id=${user_id}&ser_name=${payload.MenuCategoryName}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                message.success(`item is saved successfully!!!`)
            }
            form.resetFields()
            setOpen(false)
            fetchServings()


        } catch (error) {
            message.error('server error!!!!', error)
        }
        finally {
            setLoading(false)
        }

    }
    const viewDeleted = () => {
        setActiveOpen(true)
    }
    const openDeletePop = (item) => {
        setOpenDelete(true)
        setTargetDelete(item)
    }
    const DeleteItem = async () => {
        if (!targetDelete) return;
        try {
            setLoading(true)
            await axios.get(`/banquetapi/delete_or_active_ser.php?ser_id=${targetDelete.id}&action=delete`)
            message.info(`${targetDelete.name} is deleted`);
            setOpenDelete(false)
            fetchServings()

        } catch (error) {
            message.error('Server Error!!!!!', error)
        }
        finally {
            setLoading(false);
            setActiveOpen(false);   // ✅ CLOSE restore modal
            await fetchServings();
            await getDeletedServings();
        }


    }
    const restoreServing = async (item) => {
        try {
            setLoading(true);
            setRestoreId(item.id);
            await axios.get(`/banquetapi/delete_or_active_ser.php?ser_id=${item.id}&action=active`)
            message.info(`${item.name} section is activated`)
        } catch (error) {
            message.error('server error!!!!', error)
        }
        finally {
            setLoading(false)
            setLoading(false);
            setActiveOpen(false);
            await fetchServings();
            await getDeletedServings();

        }

    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Master Servings'
                Data={servingList}
                viewTitle='Servings'
                newBtn={addNew}
                deleteViewBtn={viewDeleted}
                onDelete={openDeletePop}
                loading={loading}
                onEdit={edit}
            />
            <Modal
                title={isEditMode ? <h2>Modify Serving</h2> : <h2>Add Serving</h2>}
                open={open}
                okText={isEditMode ? 'Modify' : 'Save'}
                onCancel={() => setOpen(false)}
                maskClosable={false}
                onOk={() => form.submit()}
                centered
            >
                <Form
                    layout='vertical'
                    form={form}
                    onFinish={onFinish}
                >
                    <Form.Item
                        label='Enter Serving'
                        name='servingName'
                        rules={[{ required: true, message: 'Serving should not be empty' }]}>
                        <Input />

                    </Form.Item>
                </Form>

            </Modal>
            <DeletedItemsModal
                activeopen={activeOpen}
                onCancel={() => setActiveOpen(false)}
                data={deletedServingList}
                titileName='Servings'
                restoringId={restoreId}
                onRestore={restoreServing}
            />
            <DeleteModal
                openDelete={openDelete}
                onCancel={() => setOpenDelete(false)}
                deleteTarget={targetDelete}
                DeleteItem={DeleteItem}
            />
        </>
    )
}

export default MasterServing
