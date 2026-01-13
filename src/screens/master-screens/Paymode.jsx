import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Checkbox, Form, Input, Modal } from 'antd'

const Paymode = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const data = [{
        id: 1,
        name: 'cash'
    },
    {
        id: 2,
        name: 'UPI'
    }]
    const addNew = () => {
        setOpen(true)
    }
    const onFinish = (values) => {
        console.log(values);
        const payload = {
            paymode: values.paymode,
            cashReturn: values.cashReturn ? 1 : 0,
            roomTransfer: values.roomTransfer ? 1 : 0,
            creditTrasfer: values.creditTrasfer ? 1 : 0,
        }
        console.log(payload);
        form.resetFields()
        setOpen(false)
    }
    return (
        <>
            <Header />
            <MasterScreen title='Paymode'
                Data={data}
                newBtn={addNew} />
            <Modal
                title='ADD PAYMODE'
                open={open}
                okText='Save'
                onCancel={() => setOpen(false)}
                maskClosable={false}
                onOk={() => form.submit()}
            >
                <Form
                    layout='vertical'
                    form={form}
                    onFinish={onFinish}
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Enter Paymode'
                        name='paymode'
                        rules={[{ required: true, message: 'Paymode is compulsory' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* Checkbox options for different modes */}
                    <Form.Item label='Select Modes' name='cashReturn' style={{ marginBottom: 0 }} valuePropName='checked'>
                        <Checkbox>Cash Return</Checkbox>
                    </Form.Item>
                    <Form.Item name='roomTransfer' style={{ marginBottom: 0 }} valuePropName='checked' >
                        <Checkbox>Room Transfer</Checkbox>
                    </Form.Item>
                    <Form.Item name='creditTrasfer' style={{ marginBottom: 0 }} valuePropName='checked'>
                        <Checkbox>Credit Transfer</Checkbox>
                    </Form.Item>

                </Form>

            </Modal>
        </>
    )
}

export default Paymode
