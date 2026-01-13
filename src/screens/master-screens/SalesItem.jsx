import React, { useEffect, useMemo, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Button, Col, Empty, Form, Input, InputNumber, message, Modal, Row, Select, Table } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'
import { IoAddCircleOutline } from 'react-icons/io5'
import { LuPencil, LuTrash2 } from 'react-icons/lu'
import { TbRestore } from 'react-icons/tb'
import { useRef } from 'react';

const SalesItem = () => {
    const [open, setOpen] = useState(false);
    const [activeOpen, setActiveOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form] = Form.useForm();
    const [form2] = Form.useForm();
    const [sales, setSales] = useState([]);
    const [deletedSales, setDeletedSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const hotel_id = localStorage.getItem('hotel_id');
    const user_id = localStorage.getItem('user_id');
    const [tableData, setTableData] = useState([]);
    const [menus, setMenus] = useState([]);
    const searchInputRef = useRef(null);

    // select options 
    const [itemGroupList, setItemGroupList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [subCategoryList, setSubCategoryList] = useState([]);
    const [sectionList, setSectionList] = useState([]);
    const [unitList, setUnitList] = useState([]);
    const [openSearch, setOpenSearch] = useState(false);

    // Fetch units
    const fetchUnits = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_spn_sale_unit.php?hotel_id=${hotel_id}`);
            const formattedData = res.data.result.map((item) => ({
                id: Number(item.UnitId),
                name: item.UnitName,
            }));
            setUnitList(formattedData)
        } catch (err) {
            message.error('server error!!', err)
        } finally {
            setLoading(false)
        }
    }

    // Fetch sections/outlets
    const fetchSections = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/banquetapi/get_all_outlets.php?hotelid=${hotel_id}`);
            const formatData = response.data.result.map((item) => ({
                id: Number(item.OutletID),
                name: item.OutletName
            }))
            setSectionList(formatData);
        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
        }
    }

    // Fetch item groups
    const fetchItemGroups = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_item_grp.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: Number(item.GroupID),
                name: item.GroupName,
            }));
            setItemGroupList(formattedData);
        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
        }
    }

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_menu_k_cat.php?hotelid=${hotel_id}`)
            const formattedData = res.data.result.map((item) => ({
                id: Number(item.MenuCategoryID),
                name: item.MenuCategoryName,
            }));
            setCategoryList(formattedData);
        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
        }
    }

    // Fetch sub categories
    const fetchSubCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_all_menu_sub_cat.php?hotelid=${hotel_id}`);
            const formattedData = res.data.result.map((item) => ({
                id: Number(item.MenuSubCategoryID),
                name: item.MenuSubCategoryName,
            }));
            setSubCategoryList(formattedData);
        } catch (error) {
            message.error('server error!!!!!', error)
        } finally {
            setLoading(false);
        }
    }

    // Fetch sales items for main screen
    const FetchSalesItem = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/banquetapi/get_all_menus.php?hotelid=${hotel_id}`
            );

            if (!res.data || !Array.isArray(res.data.result)) {
                message.error("Invalid data from server");
                return;
            }

            const groupedData = res.data.result.reduce((acc, item) => {
                const category = item.SubCaterory || "OTHERS";
                if (!acc[category]) acc[category] = [];
                acc[category].push({
                    id: Number(item.MenuID),
                    name: item.MenuName,
                });
                return acc;
            }, {});

            setSales(groupedData);
        } catch (error) {
            console.error("FetchSalesItem error:", error);
            message.error("Server error while fetching sales items");
        } finally {
            setLoading(false);
        }
    };

    // Fetch deleted sales items
    const FetchDeletedSalesItem = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/get_deleted_menu.php?hotelid=${hotel_id}`);
            const formattedData = res.data.result.map((item) => ({
                id: Number(item.MenuID),
                name: item.MenuName,
            }));
            setDeletedSales(formattedData)
        } catch (err) {
            message.error('server error!!', err)
        } finally {
            setLoading(false)
        }
    }

    // Delete or restore sales item
    const toggleDeleteActiveSalesItem = async (id, name, action) => {
        try {
            setLoading(true);
            await axios.get(`/banquetapi/delete_or_active_menu.php?menu_id=${id}&action=${action}`)
            if (action === 'delete') {
                message.success(`Sales Item "${name}" deleted successfully`);
            } else {
                message.success(`Sales Item "${name}" restored successfully`);
            }
        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
            setActiveOpen(false);
            setOpenDelete(false);
            FetchDeletedSalesItem();
            FetchSalesItem();
        }
    }

    // Delete item
    const DeleteItem = () => {
        if (!deleteTarget) return
        toggleDeleteActiveSalesItem(
            deleteTarget.id,
            deleteTarget.name,
            'delete'
        )
    }

    // Restore item
    const RestoreItem = (item) => {
        toggleDeleteActiveSalesItem(
            item.id,
            item.name,
            'active'
        );
    };

    // Common edit function for both main screen and search modal
    const edit = async (item) => {
        setOpen(true);
        setIsEditMode(true);
        setDeleteTarget(item);

        try {
            setLoading(true);

            // Fetch menu details
            const menuRes = await axios.get(
                `/banquetapi/get_menu_details.php?menu_id=${item.id}`
            );

            const details = menuRes.data.result[0];
            console.log(details)
            // Fetch outlet rates for this menu
            const ratesRes = await axios.get(
                `/banquetapi/get_all_outlets.php?hotelid=${hotel_id}&menu_id=${item.id}`
            );


            // Find the unit in unitList or create a fallback

            const categoryId = categoryList.find(cat => cat.name === details.sel_cat_id)?.id || null;
            const subCategoryId = subCategoryList.find(subCat => subCat.name === details.sel_sub_cat_id)?.id || null;
            const itemGroupId = itemGroupList.find(grp => grp.name === details.sel_grp_id)?.id || null;

            // Prepare form values
            const formValues = {
                menu_nm: details.menu_nm,
                printing_nm: details.printing_nm,
                display_indx: details.display_indx,
                sel_cat_id: categoryId,
                sel_grp_id: itemGroupId,
                sel_sub_cat_id: subCategoryId,
                unit: "",
                igst_per: parseFloat(details.igst_per) || 0,
                sgst_per: parseFloat(details.sgst_per) || 0,
                cgst_per: parseFloat(details.cgst_per) || 0,
            };
            // Set form values
            form.setFieldsValue(formValues);

            // Update table data with rates
            const updatedTableData = ratesRes.data.result.map((outlet, index) => ({
                key: outlet.OutletID,
                no: index + 1,
                name: outlet.OutletName,
                rate: parseFloat(outlet.rate) || 0,
                outletId: outlet.OutletID
            }));

            setTableData(updatedTableData);

        } catch (error) {
            console.error("Error fetching edit data:", error);
            message.error("Server error while fetching details");
        } finally {
            setLoading(false);
        }
    };

    // Delete handler for MasterScreen
    const handleDeleteFromMasterScreen = (item) => {
        viewdeletePop(item);
    };
    const unitListSelect = useMemo(() => {
        return (
            <Select showSearch optionFilterProp="children" allowClear labelInValue>
                {unitList.map((unit) => (
                    <Select.Option key={unit.id} value={unit.id}>
                        {unit.name}
                    </Select.Option>
                ))}
            </Select>
        );
    }, [unitList]);

    // On form submit (create or update)
    const onFinish = async (values) => {
        try {
            setLoading(true);

            const outlet_ids = tableData.map(item => Number(item.outletId));
            const rates = tableData.map(item => Number(item.rate) || 0);

            const formData = new FormData();
            formData.append('user_id', user_id);
            formData.append('Hotelid', hotel_id);

            if (isEditMode && deleteTarget) {
                // For edit mode - use rc_menu_id parameter
                formData.append('rc_menu_id', deleteTarget.id);
            }

            formData.append('menu_nm', values.menu_nm);
            formData.append('printing_nm', values.printing_nm);
            formData.append('display_indx', values.display_indx);

            formData.append('sel_cat_id', values.sel_cat_id || '');
            formData.append('sel_grp_id', values.sel_grp_id || '');
            formData.append('sel_sub_cat_id', values.sel_sub_cat_id || '');
            formData.append('unit', values.unit || '');
            formData.append('outlet_ids', JSON.stringify(outlet_ids));
            formData.append('rates', JSON.stringify(rates));
            formData.append('igst_per', values.igst_per || 0);
            formData.append('sgst_per', values.sgst_per || 0);
            formData.append('cgst_per', values.cgst_per || 0);

            // Use appropriate API based on mode
            const apiUrl = isEditMode
                ? '/banquetapi/modify_menu_new.php'
                : '/banquetapi/save_menu_new.php';

            await axios.post(
                apiUrl,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            message.success(
                isEditMode
                    ? 'Sales Item updated successfully'
                    : 'Sales Item added successfully'
            );

            FetchSalesItem();
            setOpen(false);
            form.resetFields();
            setIsEditMode(false);
            setDeleteTarget(null);
            setTableData([]);

        } catch (error) {
            console.error(error);
            message.error('Server error while saving');
        } finally {
            setLoading(false);
        }
    };

    // Search items
    const fetchItemMenu = async (searchTerm) => {
        try {
            setLoading(true);
            const res = await axios.get(`/banquetapi/search_items_new2.php?hotel_id=${hotel_id}&item_mode=2&search_param=${searchTerm}`);

            if (res.data && res.data.result) {
                const formattedData = res.data.result.map((item) => ({
                    id: item.MenuID,
                    name: item.MenuName,
                    status: item.MenuStatus,
                }));
                setMenus(formattedData)
            } else {
                setMenus([]);
            }
        } catch (error) {
            console.error('server error!!!', error)
            setMenus([]);
        } finally {
            setLoading(false);
        }
    }

    // Save new unit
    const saveUnit = async (values) => {
        try {
            setLoading(true);
            await axios.post(`/banquetapi/save_unit.php?hotel_id=${hotel_id}&user_id=1&unit_name=${values.unitName}`);
            message.success('Unit added successfully');
            form2.resetFields();
            setOpenAdd(false);
            fetchUnits();
        } catch (error) {
            message.error('server error!!!', error)
        } finally {
            setLoading(false);
        }
    }

    // Initialize table data when sections load
    useEffect(() => {
        if (sectionList.length > 0 && !isEditMode && !deleteTarget) {
            const data = sectionList.map((section, index) => ({
                key: section.id,
                no: index + 1,
                name: section.name,
                rate: 0,
                outletId: section.id
            }));
            setTableData(data);
        }
    }, [sectionList, isEditMode, deleteTarget]);

    // Table columns for rate
    const columns = [
        { title: 'No.', dataIndex: 'no', key: 'no' },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            render: (value, record, index) => (
                <InputNumber
                    min={0}
                    value={record.rate}
                    controls={false}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(val) => {
                        const newData = [...tableData];
                        newData[index].rate = val;
                        setTableData(newData);
                    }}
                    style={{ width: '100%' }}
                />
            ),
        },
    ];

    // Initialize data on component mount
    useEffect(() => {
        fetchUnits();
        fetchSections();
        fetchItemGroups();
        fetchCategories();
        fetchSubCategories();
        FetchSalesItem();
        FetchDeletedSalesItem();
    }, []);

    // Add new item
    const addNew = () => {
        setOpen(true);
        setIsEditMode(false);
        setDeleteTarget(null);
        form.resetFields();

        // Reset table data for new item
        const data = sectionList.map((section, index) => ({
            key: section.id,
            no: index + 1,
            name: section.name,
            rate: 0,
            outletId: section.id
        }));
        setTableData(data);
    }

    const activeDeletedItems = () => {
        setActiveOpen(true);
    }

    const viewdeletePop = (item) => {
        setOpenDelete(true);
        setDeleteTarget(item);
    }

    const handleSearch = () => {
        setOpenSearch(true);
        setMenus([]);
    }

    const categoryListSelect = useMemo(() => {
        return (
            <Select showSearch optionFilterProp="children" allowClear>
                {categoryList.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                        {cat.name}
                    </Select.Option>
                ))}
            </Select>
        );
    }, [categoryList]);
    const subcategoryListSelect = useMemo(() => {
        return (
            <Select showSearch optionFilterProp="children" allowClear>
                {subCategoryList.map((subCat) => (
                    <Select.Option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                    </Select.Option>
                ))}
            </Select>
        );
    }, [subCategoryList]);
    const ItemgrpListSelect = useMemo(() => {
        return (
            <Select showSearch optionFilterProp="children" allowClear>
                {itemGroupList.map((grp) => (
                    <Select.Option key={grp.id} value={grp.id}>
                        {grp.name}
                    </Select.Option>
                ))}
            </Select>
        );
    }, [itemGroupList]);

    useEffect(() => {
        if (openSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [openSearch]);

    return (
        <>
            <Header />
            <MasterScreen
                title='Sales Item'
                Data={sales}
                newBtn={addNew}
                loading={loading}
                deleteViewBtn={activeDeletedItems}
                onDelete={handleDeleteFromMasterScreen}
                showSearch={true}
                onClick={handleSearch}
                onEdit={edit}  // Directly pass the edit function
            />

            {/* Add/Edit Modal */}
            <Modal
                title={isEditMode ? 'EDIT SALE ITEM' : 'ADD SALE ITEM'}
                open={open}
                onCancel={() => {
                    setOpen(false);
                    setIsEditMode(false);
                    setDeleteTarget(null);
                    form.resetFields();
                    setTableData([]);
                }}
                okText={isEditMode ? 'Update' : 'Save'}
                maskClosable={false}
                onOk={() => form.submit()}
                centered
                width={700}
                confirmLoading={loading}
                loading={loading}
            >
                <Form
                    layout='vertical'
                    form={form}
                    onFinish={onFinish}
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Enter Item Name'
                        name='menu_nm'
                        rules={[{ required: true, message: 'Item name is required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Printing Name'
                        name='printing_nm'
                        rules={[{ required: true, message: 'Printing name is required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Display Index'
                        name='display_indx'
                        rules={[{ required: true, message: 'Display index is required' }]}>
                        <input type='number' min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={20}>
                            <Form.Item
                                label="Sale Unit"
                                name="unit"
                                rules={[{ required: true, message: 'Please select unit' }]}
                            >
                                {/* <Select
                                    options={unitList}
                                    labelInValue
                                    placeholder="Select Sale Unit"
                                    showSearch
                                    optionFilterProp="label"
                                /> */}
                                {unitListSelect}
                            </Form.Item>
                        </Col>
                        <Col span={4} style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                            <Button
                                style={{ padding: 5, border: 'none' }}
                                onClick={() => setOpenAdd(true)}
                                type="text"
                            >
                                <IoAddCircleOutline size={24} />
                            </Button>
                        </Col>
                    </Row>

                    <Form.Item
                        label='Item Group'
                        name='sel_grp_id'
                    >
                        {/* <Select
                            options={itemGroupList}
                            placeholder="Select Item Group"
                            showSearch
                            optionFilterProp="label"
                        /> */}
                        {ItemgrpListSelect}
                    </Form.Item>

                    <Form.Item
                        label='Category'
                        name='sel_cat_id'
                    >
                        {/* <Select
                            options={categoryList}
                            placeholder="Select Category"
                            showSearch
                            optionFilterProp="label"
                        /> */}
                        {categoryListSelect}
                    </Form.Item>

                    <Form.Item
                        label='Sub Category'
                        name='sel_sub_cat_id'
                    >
                        {/* <Select
                            options={subCategoryList}
                            placeholder="Select Sub Category"
                            showSearch
                            optionFilterProp="label"
                        /> */}
                        {subcategoryListSelect}
                    </Form.Item>

                    <Form.Item label='Outlet Rates' >
                        <Table
                            dataSource={tableData}
                            columns={columns}
                            pagination={false}
                            rowKey="key"
                            loading={loading}
                        />
                    </Form.Item>

                    <div className="containerTax">
                        <label><h3>Tax Details:</h3></label>
                        <Row gutter={[16, 8]}>
                            <Col span={8}>
                                <Form.Item
                                    label='IGST %'
                                    name='igst_per'>
                                    <input type='number' min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label='SGST %'
                                    name='sgst_per'>
                                    <input type='number' min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label='CGST %'
                                    name='cgst_per'>
                                    <input type='number' min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </Modal>

            {/* Add Unit Modal */}
            <Modal
                open={openAdd}
                onCancel={() => setOpenAdd(false)}
                title="Add Unit"
                okText="Add"
                centered
                onOk={() => form2.submit()}
                confirmLoading={loading}
            >
                <Form layout='vertical' form={form2} onFinish={saveUnit}>
                    <Form.Item
                        label='Unit Name'
                        name='unitName'
                        rules={[{ required: true, message: 'Unit name is required' }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Deleted Items Modal */}
            <DeletedItemsModal
                activeopen={activeOpen}
                onCancel={() => setActiveOpen(false)}
                data={deletedSales}
                loadingDlt={loading}
                titileName="Sales Items"
                onRestore={RestoreItem}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                openDelete={openDelete}
                onCancel={() => setOpenDelete(false)}
                deleteTarget={deleteTarget}
                DeleteItem={DeleteItem}
            />

            {/* Search Modal */}
            <Modal
                title={<h2>Search Sales Items</h2>}
                open={openSearch}
                onCancel={() => {
                    setOpenSearch(false);
                    setMenus([]);
                }}
                footer={null}
                width={800}
                maskClosable={false}
                centered
                bodyStyle={{
                    padding: '10px',
                    height: '60vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Input
                    ref={searchInputRef}
                    placeholder="Type to search..."
                    onChange={(e) => {
                        if (e.target.value.trim()) {
                            fetchItemMenu(e.target.value);
                        } else {
                            setMenus([]);
                        }
                    }}
                    style={{ marginBottom: '16px' }}
                />


                <div className="table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
                    <table className="modern-table">
                        {menus.length > 0 && (
                            <thead>
                                <tr>
                                    <th>Sr No.</th>
                                    <th>Item Name</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="loading-overlay">
                                            <div className="loader"></div>
                                            <p>Loading data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : menus.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                        <Empty description="Search something e.g - chicken, paneer" />
                                    </td>
                                </tr>
                            ) : (
                                menus.map((item, idx) => (
                                    <tr key={item.id} style={item.status == 0 ? { backgroundColor: '#ffebee' } : {}}>
                                        <td>{idx + 1}</td>
                                        <td >{item.name}</td>
                                        <td>
                                            <span className={`status-badge ${item.status == 1 ? 'active' : 'inactive'}`}>
                                                {item.status == 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            {item.status == 1 ? (
                                                <div className="actions-col">
                                                    <Button
                                                        type="link"
                                                        icon={<LuPencil size={14} />}
                                                        onClick={() => {
                                                            edit(item);
                                                            setOpenSearch(false);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="link"
                                                        danger
                                                        icon={<LuTrash2 />}
                                                        onClick={() => {
                                                            viewdeletePop(item);
                                                            setOpenSearch(false);
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="actions-col">
                                                    <Button
                                                        type="link"
                                                        icon={<TbRestore />}
                                                        onClick={() => {
                                                            RestoreItem(item);
                                                            setOpenSearch(false);
                                                        }}

                                                    >
                                                        Restore
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>

            <style jsx>{`
                .containerTax {
                    border: 1px solid #d9d9d9;
                    padding: 16px;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                     
                .table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    background: #ffffff;
                    border-radius: 12px;
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
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                }

                .modern-table td {
                    padding: 12px 16px;
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

                .actions-col {
                    display: flex;
                    gap: 8px;
                }

                .status-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .status-badge.active {
                    background-color: #d1fae5;
                    color: #065f46;
                }
                
                .status-badge.inactive {
                    background-color: #fee2e2;
                    color: #991b1b;
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

                .loading-overlay {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
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
        </>
    )
}

export default SalesItem;