import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, message, Modal } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'

const SubCategory = () => {
    const [subcategoryOpen, setSubCategoryOpen] = useState(false);
    const [subCategiesData, setSubCategoriesData] = useState([]);
    const [deletedSubCat, setDeletedSubCat] = useState([]);
    const [deletedListModal, setDeletedListModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    // const [catDetails,setCatDetails]=useState([])
    const [deletePop, setDeletePop] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);
    const hotel_id = localStorage.getItem('hotel_id');
    const user_id = localStorage.getItem('user_id');
    const [form] = Form.useForm()
    const fetchSubCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_menu_sub_cat.php?hotelid=${hotel_id}`);

            const formattedData = res.data.result.map((item) => ({
                id: item.MenuSubCategoryID,
                name: item.MenuSubCategoryName,
            }))
            setSubCategoriesData(formattedData)
        } catch (error) {
            message.error('server error!!!!!', error)
        } finally {
            setLoading(false);
        }

    }
    useEffect(() => {
        fetchSubCategories()
    }, [])
    const fetchDeletedCat = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_deleted_menu_sub_cat.php?hotelid=${hotel_id}`);
            const formattedData = res.data.result.map((item) => ({
                id: item.MenuSubCategoryID,
                name: item.MenuSubCategoryName,
            }));
            setDeletedSubCat(formattedData)

        } catch (err) {
            message.error('server error!!', err)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchDeletedCat()
    }, [])
    const addNew = () => {
        setSubCategoryOpen(true);
        setIsEditMode(false);
        form.resetFields();   // ✅ REQUIRED
    };

    const onEdit = async (item) => {
        setIsEditMode(true);
        setSubCategoryOpen(true);
        setEditId(item.id);

        try {
            const res = await axios.get(
                `/banquetapi/get_menu_sub_cat_details.php?sub_cat_id=${item.id}`
            );
            const details = res.data.result[0];
            form.setFieldsValue({
                subCategoryName: details.MenuSubCategoryName,
                displayIndex: details.DisplayIndex
            });

        } catch (error) {
            message.error("Server error", error);
        }
    };

    const onFinish = async (values) => {
        if (!hotel_id || !user_id) {
            message.error('You are not logged in ');
            return;
        }
        try {
            const payload = {
                hotel_id: hotel_id,
                user_id: user_id,
                MenuSubCategoryName: values.subCategoryName,
                DisplayIndex: values.displayIndex
            }
            setLoading(true);
            if (isEditMode) {
                const body = new URLSearchParams(payload)
                await axios.post(`/banquetapi/modify_menu_sub_cat.php?hotel_id=${hotel_id}&user_id=${user_id}&sub_cat_id=${editId}&menu_sub_cat_name=${payload.MenuSubCategoryName}&display_index=${payload.DisplayIndex}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    }
                })
                message.success(`${payload.MenuSubCategoryName} is modified successfully!!!`)

                setSubCategoryOpen(false)
                form.resetFields()

            }
            else {
                const body = new URLSearchParams(payload)
                await axios.post(`/banquetapi/save_menu_sub_cat.php?hotel_id=${hotel_id}&user_id=${user_id}&menu_sub_cat_name=${payload.MenuSubCategoryName}&display_index=${payload.DisplayIndex}`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    }
                })
                message.success(`${payload.MenuSubCategoryName} is saved successfully!!!`)

                setSubCategoryOpen(false)
                form.resetFields()
            }

        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
            fetchSubCategories();
        }

    }
    const openDeletedModal = () => {
        setDeletedListModal(true)
    }
    const viewDeletedModal = (item) => {
        setDeleteTarget(item);
        setDeletePop(true);
    };

    const toggleDeleteActive = async (id, name, action) => {
        try {
            setLoading(true);
            await axios.get(`/banquetapi/delete_or_active_menu_sub_cat.php?sub_cat_id=${id}&action=${action}`);
            if (action == 'delete') {
                message.info(`${name} is deleted successfully`)
            }
            else {
                message.success(`${name} is restored successfully`)
            }

        } catch (error) {
            message.error('server error!!', error)
        } finally {
            setLoading(false);
            setDeletedListModal(false);
            setDeletePop(false)
            fetchDeletedCat()
            fetchSubCategories();
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
                title='Sub Category'
                Data={subCategiesData}
                newBtn={addNew}
                loading={loading}
                deleteViewBtn={openDeletedModal}
                onDelete={viewDeletedModal}
                onEdit={onEdit}
            />
            <Modal

                title={isEditMode ? <h2>Modify Sub Cat Menu</h2> : <h2>Save Sub Cat menu</h2>}
                open={subcategoryOpen}
                onCancel={() => setSubCategoryOpen(false)}
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
                        label='Enter Sub Category Name'
                        name='subCategoryName'
                        rules={[{ required: true, message: 'category name is compulsory ' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Display Index'
                        name='displayIndex'
                        rules={[{ required: true, message: 'Display index  is compulsory ' }]}>
                        <input type='number' />
                    </Form.Item>
                </Form>

            </Modal>
            <DeletedItemsModal
                activeopen={deletedListModal}
                data={deletedSubCat}
                onCancel={() => setDeletedListModal(false)}
                titileName="Sub Categories"
                onRestore={restoreItem}
            />
            <DeleteModal
                openDelete={deletePop}
                onCancel={() => setDeletePop(false)}
                DeleteItem={DeleteItem}
                deleteTarget={deleteTarget}
            />


        </>
    )
}
export default SubCategory