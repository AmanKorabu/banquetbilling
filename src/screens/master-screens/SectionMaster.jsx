import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Checkbox, Col, ColorPicker, Form, Input, InputNumber, message, Modal, Row, Select } from 'antd'
import axios from 'axios'
import DeletedItemsModal from '../../components/ReusableCompnents/DeletedItemsModal'
import DeleteModal from '../../components/ReusableCompnents/DeleteModal'

const billingModesOptions = [
    { id: 1, label: 'Dine Inn' },
    { id: 2, label: 'Direct Bill' },
];
const printingModesOptions = [
    { id: 1, label: 'KOT then Bill' },
    { id: 2, label: 'KOT and Bill' },
    { id: 3, label: 'Bill Only' },
];
const settlementDataOptions = [
    { id: 1, label: 'After Bill' },
    { id: 2, label: 'Direct Settlement' },
    { id: 3, label: 'Pending' },
];

const SectionMaster = () => {
    const [form] = Form.useForm();
    const [open, setOpen] = useState(false);
    const [sections, setSections] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [loading, setLoading] = useState(false);
    const [deleteopen, setDeleteOpen] = useState(false)
    const [deletedSections, setDeletedSections] = useState([]);
    const [activeOpen, setActiveOpen] = useState(false);
    const [restoringId, setRestoreId] = useState(null);
    const [isEditMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null)
    const hotel_id = localStorage.getItem('hotel_id')
    const user_id = localStorage.getItem('user_id');
    const [showDirectPayMode, setShowDirectPaymode] = useState(false);
    const [settlementData, setSettlementData] = useState([])

    const fetchSections = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/banquetapi/get_all_outlets.php?hotelid=${hotel_id}`);

            const formatData = response.data.result.map((item) => ({
                id: item.OutletID,
                name: item.OutletName
            }))
            setSections(formatData)
        } catch (err) {
            message.error(err)
        } finally {
            setLoading(false)
        }
    }, [hotel_id])
    useEffect(() => {
        fetchSections()
    }, [fetchSections])

    const viewDeletedSections = React.useCallback(() => {
        setActiveOpen(true)
    }, [])
    const DeletedSections = async () => {
        try {

            setLoading(true)
            const response = await axios.get(`/banquetapi/get_deleted_outlets.php?hotelid=${hotel_id}`);
            const formattedData = response.data.result.map((item) => ({
                id: item.OutletID,
                name: item.OutletName,
            }))
            setDeletedSections(formattedData);
        } catch (err) {
            message.error('server error!!!', err)

        }
        finally {
            setLoading(false);

        }
    }
    useEffect(() => {
        DeletedSections()
    }, [])

    const DeleteSection = React.useCallback((company) => {
        setDeleteTarget(company)
        setDeleteOpen(true)

    }, [])

    const DeleteItem = async () => {
        if (!deleteTarget) return;
        try {
            setLoading(true);
            await axios.get(`/banquetapi/delete_or_active_outlet.php?outlet_id=${deleteTarget.id}&action=delete`)
            message.info(`${deleteTarget.name} is deleted`)

        } catch (error) {
            message.error('Server Down', error);
        } finally {
            setDeleteTarget(null)
            setDeleteOpen(false)
            await fetchSections()
            await DeletedSections()
        }
    }
    const restoreData = async (item) => {
        try {
            setLoading(true);
            setRestoreId(item.id);

            await axios.get(`/banquetapi/delete_or_active_outlet.php?outlet_id=${item.id}&action=active`)
            message.info(`${item.name} section is activated`)

        } catch (err) {
            message.error('Server down failed to delete!!!', err)
        } finally {
            setLoading(false);
            setActiveOpen(false);
            await fetchSections();
            DeletedSections()
        }
    }
    const onFinish = async (values) => {
        try {
            setLoading(true);
            const payload = {
                user_id: user_id,
                outlet_id: editId,
                Hotelid: hotel_id,
                outlet_name: values.sectionName,
                display_indx: values.DisplayIdx,
                billing_mode_id: values.billingModes,
                print_mode_id: values.printingMode,
                settlmnt_setting_id: values.settlementSetting,
                extra_chrg_per: values.extraCharges_percentage || 0,
                extra_chrg_amt: values.extraCharges_amt || 0,
                bg_color: values.color || "",
                cust_details_mandetory: values.Customer_Contact_mandatory ? 1 : 0,
                print_cust_details: values.customer_Details ? 1 : 0,
                bill_print_msg: values.Bill_print_msg ? 1 : 0,
                kot_print_msg: values.KOT_print_msg ? 1 : 0,
                str_note: values.Bill_Print_Note || "",
                str_e_bill: values.e_bill_SMS ? 1 : 0,
                str_feedback_sms: '',
                str_del_mode: values.Delivery_mode ? 1 : 0,
                str_table_time: values.Table_Turnover_Time ? 1 : 0,
                str_direct_paymodeid: values.directPayMode ?? 0,
            }
            setOpen(false)
            if (isEditMode) {

                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/modify_outlet.php`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                message.success("Section is modified successfully");
                fetchSections();
            }
            else {
                const body = new URLSearchParams(payload);
                await axios.post(`/banquetapi/save_outlet.php`, body, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                })
                message.success("Section is saved successfully");
                form.resetFields();
                setOpen(false);
                fetchSections();

            }
        } catch (err) {
            message.error(err)
        }
        finally {
            setLoading(false)

        }
    }
    const edit = React.useCallback(async (item) => {
        setEditMode(true)
        setOpen(true)
        setEditId(item.id)
        try {
            const res = await axios.get(`/banquetapi/get_outlet_details2.php?outlet_id=${item.id}`)

            const section = res.data.result[0];
            const billingModesId = billingModesOptions.find(mode => mode.label === section.BillingMode)?.id || null;
            const printingModesId = printingModesOptions.find(mode => mode.label === section.PrintingMode)?.id || null;
            const settlementSettingId = settlementDataOptions.find(mode => mode.label === section.StettlementSetting)?.id || null;
            form.setFieldsValue({
                sectionName: section.OutletName,
                DisplayIdx: section.DisplayIndex,
                customer_Details: section.print_cust_details == 1,
                Bill_print_msg: section.BillPrint_message == 1,
                KOT_print_msg: section.KotPrint_message == 1,
                Customer_Contact_mandatory: section.cust_details_mandetory == 1,
                e_bill_SMS: section.EBillSms == 1,
                Delivery_mode: section.DeliveryMode == 1,
                Table_Turnover_Time: section.TableTime == 1,
                billingModes: billingModesId,
                printingMode: printingModesId,
                settlementSetting: settlementSettingId,
                extraCharges_percentage: section.ExtraChargesFood_Per,
                extraCharges_amt: section.ExtraChargesFood_Amt,
                color: section.BackgroundColor,
                Bill_Print_Note: section.BillPrintNote,
            });
        } catch (error) {
            message.error(error)
        } finally {
            setLoading(false);
        }
    }, [form])
    const addNew = React.useCallback(() => {
        setOpen(true);
        setEditMode(false);
        form.resetFields();
    }, [form])

    const fetchSettlement = async () => {
        try {
            const response = await axios.get(`/banquetapi/get_all_pay_modes.php?hotel_id=${hotel_id}`)
            setSettlementData(response.data.result)

        } catch (error) {
            message.error(error)
        }
    }
    useEffect(() => {
        fetchSettlement()
    }, [])
    return (
        <>
            <Header />
            <MasterScreen
                title='Section Master'
                deleteViewBtn={viewDeletedSections}
                Data={sections}
                onEdit={edit}
                onDelete={DeleteSection}
                viewTitle='Sections'
                newBtn={addNew}
                loading={loading}
            />
            <Modal
                title={isEditMode ? <h2>Modify Section</h2> : <h2>Add Sections</h2>}
                open={open}
                okText={isEditMode ? 'Modify' : 'Save'}
                onCancel={() => setOpen(false)}
                maskClosable={false}
                centered
                width={600}
                onOk={() => form.submit()}

            >
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout='vertical'
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Section Name'
                        name='sectionName'
                        rules={[{ required: true, message: 'Section Name is required', type: 'string' }]}
                    >
                        <Input />

                    </Form.Item>


                    <Form.Item
                        label='Display Index'
                        name='DisplayIdx'
                        rules={[{ required: true, message: 'Display Index is required' }]}

                    >
                        <input type='number' />
                    </Form.Item>


                    <Row gutter={[8, 10]}>
                        <Col span={12}>
                            <Form.Item
                                name="customer_Details"
                                valuePropName="checked"

                            >
                                <Checkbox>Print customer details on bill</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='Bill_print_msg'
                                valuePropName="checked"
                            >
                                <Checkbox>Bill print message</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='KOT_print_msg'
                                valuePropName="checked" >
                                <Checkbox>KOT Print message</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='Customer_Contact_mandatory'
                                valuePropName="checked" >
                                <Checkbox >Customer Contact Number mandatory</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='e_bill_SMS'
                                valuePropName="checked"
                            >
                                <Checkbox>E-Bill SMS</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='Delivery_mode'
                                valuePropName="checked"
                            >
                                <Checkbox >Delivery mode</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='Table_Turnover_Time'
                                valuePropName="checked"
                            >
                                <Checkbox>Table Turnover Time</Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>


                    <Form.Item label="Billing Mode" name="billingModes">
                        <Select placeholder="Select billing mode">
                            {
                                billingModesOptions
                                    .map((item) => (
                                        <Select.Option key={item.id} value={item.id}>{item.label}</Select.Option>
                                    ))
                            }

                        </Select>
                    </Form.Item>

                    <Form.Item label="Printing Mode" name="printingMode">
                        <Select placeholder="Select printing mode">
                            {
                                printingModesOptions.map((item) => (
                                    <Select.Option key={item.id} value={item.id}>{item.label}</Select.Option>
                                ))
                            }

                        </Select>
                    </Form.Item>

                    <Form.Item label="Settlement Setting" name="settlementSetting">
                        <Select placeholder="Select settlement setting"
                            onChange={(value) => {
                                if (value == 2) {
                                    setShowDirectPaymode(true)
                                }
                                else {
                                    setShowDirectPaymode(false)
                                }
                            }}>
                            {
                                settlementDataOptions.map((item) => (
                                    <Select.Option key={item.id} value={item.id}>{item.label}</Select.Option>
                                ))
                            }
                            {/* <Select.Option value={1}>After Bill</Select.Option>
                            <Select.Option value={2}>Direct Settlement</Select.Option>
                            <Select.Option value={3}>Pending</Select.Option> */}
                        </Select>
                    </Form.Item>
                    {showDirectPayMode && (
                        <Form.Item
                            label="Direct Settlement Paymode"
                            name="directPayMode"
                            rules={[{ required: true, message: 'Please select pay mode' }]}
                        >
                            <Select placeholder="Select pay mode">
                                {settlementData.map((item) => (
                                    <Select.Option
                                        key={item.Modeid}
                                        value={item.Modeid}
                                    >
                                        {item.PayName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}


                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Form.Item
                            label='Extra Charges (%)'
                            name='extraCharges_percentage'
                        >
                            <input type='number' style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label='Extra Charges (₹)'
                            name='extraCharges_amt'
                        >
                            <input type='number' style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                    <Form.Item
                        label='Color'
                        name='color'
                        getValueFromEvent={(color) => color.toHexString()}>
                        <ColorPicker showText />
                    </Form.Item>
                    <Form.Item
                        label='Bill Print Note'
                        name='Bill_Print_Note' >
                        <Input />
                    </Form.Item>

                </Form>


            </Modal>
            <DeleteModal
                openDelete={deleteopen}
                onCancel={() => setDeleteOpen(false)}
                DeleteItem={DeleteItem}
                deleteTarget={deleteTarget}
            />
            <DeletedItemsModal
                titileName='Sections'
                activeopen={activeOpen}
                onCancel={() => setActiveOpen(false)}
                data={deletedSections}
                loadingDlt={loading}
                onRestore={restoreData}
                restoringId={restoringId}
            />
            <Modal

            ></Modal>

        </>
    )
}

export default SectionMaster
