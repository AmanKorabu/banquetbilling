import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Checkbox, Form, Input, Modal } from 'antd'

const StatusMaster = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const data = [
        {
            id: 1,
            name: 'Pending'
        },
        {
            id: 2,
            name: 'Confirmed'
        },
        {
            id: 3,
            name: 'Tentative'
        },
        {
            id: 4,
            name: 'WaitListed'
        }
    ]
    const addNew = () => {
        setOpen(true)
    }

    const onFinish = (values) => {
        console.log(values);
        const payload = {
            statusName: values.statusName,
            bookingStatus: values.bookingStatus ? 1 : 0,
            menuStatus: values.menuStatus ? 1 : 0,
            eventStatus: values.eventStatus ? 1 : 0,
        }
        console.log(payload);
        form.resetFields()
        setOpen(false)
    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Status Master'
                Data={data}
                newBtn={addNew}
            />
            <Modal
                title='ADD STATUS'
                open={open}
                okText='Save'
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}

            >
                <Form
                    layout='vertical'
                    form={form}
                    onFinish={onFinish}
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item

                        name='statusName'
                        rules={[{ required: true, message: 'Status name required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name='bookingStatus' valuePropName='checked'
                    >
                        <Checkbox> Booking Status</Checkbox>
                    </Form.Item>
                    <Form.Item
                        name='menuStatus' valuePropName='checked'
                    >
                        <Checkbox> Menu Status</Checkbox>
                    </Form.Item>
                    <Form.Item
                        name='eventStatus' valuePropName='checked'
                    >
                        <Checkbox> Event Status</Checkbox>
                    </Form.Item>
                </Form>

            </Modal>
        </>
    )
}

export default StatusMaster
