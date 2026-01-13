import React, { useEffect, useState } from 'react'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import Header from '../Header';
import { Form, Input, message, Modal, Row } from 'antd';
import axios from 'axios';
import DeleteModal from '../../components/ReusableCompnents/DeleteModal';
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal';

const Company = () => {
    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isEditMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null)
    const [form] = Form.useForm();
    const [activeopen, setActiveOpen] = useState(false);
    const [data, setData] = useState([]);
    const [restoringId, setRestoringId] = useState(null);
    const hotel_id = localStorage.getItem('hotel_id')

    const fetchCompanies = React.useCallback(async () => {
        try {
            setTableLoading(true)
            const response = await axios.get(`/banquetapi/get_all_comp.php?hotelid=${hotel_id}`)

            const data = (response.data.result)

            const formatData = data.map((item) => ({
                id: item.MenuID,
                name: item.MenuName
            }));
            setCompanies(formatData)


        } catch (error) {
            message.error("Something wrong server down!!!", error);

        }
        finally {
            setTableLoading(false)
        }

    }, [hotel_id])

    useEffect(() => {
        fetchCompanies()
    }, [fetchCompanies])

    const edit = React.useCallback(async (item) => {
        setOpen(true);
        setEditMode(true)
        setEditId(item.id)


        setModalLoading(true)
        try {
            const response = await axios.get(`/banquetapi/get_comp_details.php?company_id=${item.id}`)
            const company = response.data.result[0]


            form.setFieldsValue({
                compName: company.Name,
                gst: company.GSTNo,
                contact: company.ContactNo,
                add1: company.AddressLine1,
                add2: company.AddressLine2,
                zipcode: company.ZipCode,
                email: company.Email,
            });

        }
        catch (err) {
            message.error('Server Down!!!!!', err);
        }
        finally {
            setModalLoading(false)
        }
    }, [form])

    const addNew = React.useCallback(() => {
        setOpen(true)
        setEditMode(false)
        form.resetFields()
    }, [form])


    const deleteDa = React.useCallback((company) => {
        setDeleteTarget(company)
        setOpenDelete(true)
    }, [])

    const viewDeleted = React.useCallback(() => {
        setActiveOpen(true)
    }, [])

    const userId = localStorage.getItem('user_id')

    const onFinish = async (values) => {
        try {
            setModalLoading(true);

            const payload = {
                hotel_id: hotel_id,
                user_id: userId,
                comp_name: values.compName,
                gst_no: values.gst || "",
                mobile1: values.contact || "",
                email1: values.email || "",
                addrerss1: values.add1 || "",
                addrerss2: values.add2 || "",
                zip: values.zipcode || ""
            };

            if (isEditMode) {
                payload.company_id = editId;


                const body = new URLSearchParams(payload);

                await axios.post("/banquetapi/modify_company.php", body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                });
                message.success("Company updated successfully");
            }
            else {

                const body = new URLSearchParams(payload);

                await axios.post("/banquetapi/save_company2.php", body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                });
                message.success("Company saved successfully");
            }
            form.resetFields();
            setOpen(false);
            fetchCompanies();

        } catch (err) {

            message.error("Failed to save company", err);
        } finally {
            setModalLoading(false);
        }
    };
    const DeleteItem = async () => {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            await axios.get(`/banquetapi/delete_or_active_comp.php?menu_id=${deleteTarget.id}&action=delete`
            );

            message.info(`${deleteTarget.name} is deleted succesfully`);
            setDeleteTarget(null)
            setOpenDelete(false);

        } catch (err) {
            message.error("cant't able to delete", err)
        } finally {
            await fetchCompanies();
            await fetchDeletedCompanies();
            setDeleteLoading(false)
        }
    }
    const fetchDeletedCompanies = async () => {
        try {
            setDeleteLoading(true);
            const response = await axios.get(`/banquetapi/get_deleted_comp.php?hotelid=${hotel_id}`);


            const formatedData = response.data.result.map((item) => ({
                id: item.MenuID,
                name: item.MenuName,


            }))

            setData(formatedData)

        } catch (error) {
            message.error('Server Down!!!!', error)

        } finally {
            setDeleteLoading(false);

        }

    }
    useEffect(() => {
        fetchDeletedCompanies()
    }, [])
    const restoreData = async (item) => {
        try {
            setRestoringId(item.id);
            setDeleteLoading(true);
            await axios.get(`/banquetapi/delete_or_active_comp.php?menu_id=${item.id}&action=active`);
            message.success(`${item.name} restored successfully!`);
            fetchCompanies();
        } catch (err) {

            message.error('Failed to restore company', err);
        } finally {
            setActiveOpen(false)
            fetchDeletedCompanies()
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <Header />
            <MasterScreen title='Company'
                Data={companies}
                newBtn={addNew}
                deleteViewBtn={viewDeleted}
                onEdit={edit}
                onDelete={deleteDa}
                loading={tableLoading}
            />
            <Modal
                title={isEditMode ? <h2>Modify Company</h2> : <h2>Add Company</h2>}
                open={open}
                okText={isEditMode ? "Modify" : "Save"}
                onCancel={() => setOpen(false)}
                maskClosable={false}
                onOk={() => form.submit()
                }
                centered
                width={600}
                loading={modalLoading}
            >

                <Form
                    form={form}
                    onFinish={onFinish}
                    layout='vertical'
                    scrollToFirstError={{ block: "center", behavior: "smooth" }}

                >
                    <div>
                        <Form.Item
                            label="Company Name"
                            name='compName'
                            rules={[{
                                required: true,
                                message: 'Please Enter Company Name'
                            }]}
                        >
                            <Input />

                        </Form.Item>
                        <Form.Item
                            label="GST Number"
                            name="gst"


                        >
                            <Input maxLength={15} />
                        </Form.Item>
                        <Form.Item
                            label='Contact Number'
                            name='contact'
                        >
                            <Input maxLength={10} />
                        </Form.Item>
                        <Row
                            style={{ display: 'flex', gap: '10px' }}
                        >

                            <Form.Item
                                label='Address Line 1'
                                name='add1'
                            >
                                <Input.TextArea cols={35} />
                            </Form.Item>
                            <Form.Item
                                label='Address Line 2'
                                name='add2'
                            >
                                <Input.TextArea cols={35} />
                            </Form.Item>
                        </Row>
                        <Form.Item
                            label='Zipcode'
                            name='zipcode'
                        >
                            <Input type='number' />

                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name='email'
                            rules={[{ type: 'email' }]}
                        >
                            <Input />
                        </Form.Item>

                    </div>
                </Form>
            </Modal >
            <DeleteModal
                openDelete={openDelete}
                onCancel={() => setOpenDelete(false)}
                DeleteItem={DeleteItem}
                deleteTarget={deleteTarget}
            />
            <DeletedItemsModal
                activeopen={activeopen}
                onCancel={() => setActiveOpen(false)}
                data={data}
                loading={deleteLoading}
                onRestore={restoreData}
                restoringId={restoringId}
                titileName='Companies'
            />


        </>
    )
}

export default Company
