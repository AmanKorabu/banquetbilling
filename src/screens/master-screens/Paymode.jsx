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
                    <Form.Item
                        name='modes'>
                        <Checkbox.Group>
                            <Checkbox value='cash_return'>Cash Return</Checkbox>
                            <Checkbox value='room_transfer'>Room Transfer</Checkbox>
                            <Checkbox value='credit_transfer'>Credit Transfer</Checkbox>
                        </Checkbox.Group>
                    </Form.Item>

                </Form>

            </Modal>
        </>
    )
}

export default Paymode
