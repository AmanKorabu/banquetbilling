import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, message, Modal } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'

const Category = () => {
    const [form] = Form.useForm();
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoriesData, setCategoriesData] = useState([]);
    const [categoriesDeletedData, setCategoriesDeletedData] = useState([]);
    const [activeOpen, setActiveOpen] = useState(false);
    const [deleteOpenModal, setOpenDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const hotel_id = localStorage.getItem('hotel_id');
    const user_id = localStorage.getItem('user_id');
    const fetchcategory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_menu_k_cat.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: item.MenuCategoryID,
                name: item.MenuCategoryName
            }))
            setCategoriesData(formattedData)

        } catch (err) {
            message.error('server down failed to fetch categories!!!', err)
        }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchcategory();
    }, [])
    const viewDeletedScreen = () => {
        setActiveOpen(true)

    }
    const fetchDeletedCat = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_deleted_menu_k_cat.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: item.MenuCategoryID,
                name: item.MenuCategoryName
            }))

            setCategoriesDeletedData(formattedData)

        } catch (error) {
            message.error('server error!!!', error)
        }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchDeletedCat()
    }, [])
    const addNew = () => {
        setCategoryOpen(true);
        setIsEditMode(false);
        form.resetFields();

    }
    const onEdit = async (item) => {
        setIsEditMode(true);
        setCategoryOpen(true);
        setEditId(item.id)
        try {
            const res = await axios.get(`/banquetapi/get_menu_k_cat_details.php?cat_id=${item.id}`);
            const catDetails = res.data.result[0]
            form.setFieldsValue({
                MenuCategoryName: catDetails.MenuCategoryName,
                display_in: catDetails.DisplayIndex,
            })

        } catch (error) {
            message.error('server error!!!!', error)
        }
    }
    const onFinish = async (values) => {
        if (!hotel_id || !user_id) {
            message.error('You are not logged in ');
            return;
        }


        try {
            const payload = {
                hotel_id: hotel_id,
                user_id: user_id,
                MenuCategoryName: values.MenuCategoryName,
                DisplayIndex: values.display_in
            }
            setLoading(true);
            if (isEditMode) {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/modify_menu_k_cat.php?hotel_id=${hotel_id}&user_id=${user_id}&cat_id=${editId}&menu_k_cat_name=${payload.MenuCategoryName}&display_index=${payload.DisplayIndex}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })

                message.success(`Category is modified successfully!!!`)
                setCategoryOpen(false);
                form.resetFields();
                fetchcategory();
            }
            else {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/save_menu_k_cat.php?hotel_id=${hotel_id}&user_id=${user_id}&menu_k_cat_name=${payload.MenuCategoryName}&display_index=${payload.DisplayIndex}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                setCategoryOpen(false);
                message.success(`Category is saved successfully!!!`)
                form.resetFields();
                fetchcategory()
            }


        } catch (error) {
            message.error('server error', error)

        } finally {
            setLoading(false)

        }


    }
    const openDeletePop = (item) => {
        setOpenDeleteModal(true)
        setDeleteTarget(item)
    }
    const toggleDeleteActive = async (id, name, action) => {
        try {
            setLoading(true)
            await axios.get(`/banquetapi/delete_or_active_menu_k_cat.php?cat_id=${id}&action=${action}`)
            if (action == 'delete') {
                message.error(`${name} is deleted successfully`)
            } else {
                message.success(`${name} is restored successfully`)
            }
        } catch (err) {
            message.error('server error!!!', err)
        }
        finally {
            setLoading(false);
            setActiveOpen(false);
            setOpenDeleteModal(false);
            fetchDeletedCat();
            fetchcategory();
        }
    }
    const DeleteItem = () => {
        if (!deleteTarget) return
        toggleDeleteActive(
            deleteTarget.id,
            deleteTarget.name,
            'delete'
        )
    }
    const restoreItem = (item) => {
        toggleDeleteActive(
            item.id,
            item.name,
            'active'
        );

    };

    return (
        <>
            <Header />
            <MasterScreen
                title='Master Category'
                Data={categoriesData}
                viewTitle='Categories'
                newBtn={addNew}
                loading={loading}
                onEdit={onEdit}
                deleteViewBtn={viewDeletedScreen}
                onDelete={openDeletePop}
            />
            <Modal
                title={isEditMode ? <h2>MODIFY MENU KITCHEN CATEGORY</h2> : <h2>ADD MENU KITCHEN CATEGORY</h2>}
                open={categoryOpen}
                onCancel={() => setCategoryOpen(false)}
                maskClosable={false}
                okText={isEditMode ? 'Modify' : 'Save'}
                onOk={() => form.submit()}
                centered
            >
                <Form
                    form={form}
                    layout='vertical'
                    onFinish={onFinish}
                    scrollToFirstError={{ block: "center", behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Enter Category Name'
                        name='MenuCategoryName'
                        rules={[{ required: true, message: 'category name is compulsory ' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Display Index'
                        name='display_in'
                        rules={[{ required: true, message: 'Display index  is compulsory ' }]}>
                        <input type='number' />
                    </Form.Item>

                </Form>

            </Modal >
            <DeletedItemsModal
                activeopen={activeOpen}
                data={categoriesDeletedData}
                onCancel={() => setActiveOpen(false)}
                titileName='Categories'
                onRestore={restoreItem} />
            <DeleteModal
                openDelete={deleteOpenModal}
                onCancel={() => setOpenDeleteModal(false)}
                DeleteItem={DeleteItem}
                deleteTarget={deleteTarget}

            />
        </>
    )
}
export default Category
