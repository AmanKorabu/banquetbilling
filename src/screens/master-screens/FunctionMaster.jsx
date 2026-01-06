import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'

const FunctionMaster = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const data = [
        {
            id: 1,
            name: 'Birthday',
            rate: 200
        }
    ]
    const addNew = () => {
        setOpen(true)

    }
    const onFinish = (values) => {
        console.log(values);
        form.resetFields();
        setOpen(false)

    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Function Master'
                Data={data}
                newBtn={addNew} />
            <Modal
                title='ADD FINCTION'
                centered
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
                        label='Enter Function Name'
                        name='functionName'
                        rules={[{ required: true, message: 'Function name is required' }]}>
                        <Input />
                    </Form.Item>

                </Form>

            </Modal>
        </>
    )
}

export default FunctionMaster
