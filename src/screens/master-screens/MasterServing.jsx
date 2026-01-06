import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'


const MasterServing = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const Data = [
        {
            id: 1,
            name: 'buffet'
        },
        {
            id: 2,
            name: 'Table System'
        }
    ]
    const collectData = (values) => {
        console.log(values);
        form.resetFields()
        setOpen(false)
    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Master Servings'
                Data={Data}
                viewTitle='Servings'
                newBtn={() => setOpen(true)}
            />
            <Modal
                title={<h2>Add Serving</h2>}
                open={open}
                okText='Save'
                onCancel={() => setOpen(false)}
                maskClosable={false}
                onOk={() => form.submit()}
            >
                <Form
                    layout='vertical'
                    form={form}
                    onFinish={collectData}
                >
                    <Form.Item
                        label='Enter Serving'
                        name='serving'
                        rules={[{ required: true, message: 'Serving shoul not be empty' }]}>
                        <Input />

                    </Form.Item>
                </Form>

            </Modal>
        </>
    )
}

export default MasterServing
