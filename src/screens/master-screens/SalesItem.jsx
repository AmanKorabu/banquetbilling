import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'

const SalesItem = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const sales = [
        {
            id: 1,
            name: 'test'
        }
    ]
    const addNew = () => {
        setOpen(true)
    }
    const onFinish = (values) => {
        console.log(values);

    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Sales Item'
                Data={sales}
                newBtn={addNew} />
            <Modal
                title='ADD SALE ITEM'
                open={open}
                onCancel={() => setOpen(false)}
                okText='Save'
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
                        label='Enter Item Name'
                        name='itemName'
                        rules={[{ required: true, message: 'Item name is required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Printing Name'
                        name='printName'
                        rules={[{ required: true, message: 'Item name is required' }]}>
                        <Input />
                    </Form.Item>


                </Form>

            </Modal>

        </>
    )
}

export default SalesItem
