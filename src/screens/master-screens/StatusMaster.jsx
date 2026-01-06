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
                        label='Status Name'
                        name='statusName'
                        rules={[{ required: true, message: 'Status name required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name='status'
                    >
                        <Checkbox.Group>
                            <Checkbox value='booking_status'>Booking Status</Checkbox>
                            <Checkbox value='menu_status'>Menu Status</Checkbox>
                            <Checkbox value='event_status'>Event Status</Checkbox>
                        </Checkbox.Group>

                    </Form.Item>
                </Form>

            </Modal>
        </>
    )
}

export default StatusMaster
