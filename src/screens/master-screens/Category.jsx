import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'

const Category = () => {
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [form] = Form.useForm()
    const cat = [
        {
            id: 1,
            name: 'Rooms'
        }
    ]
    const addNew = () => {
        console.log('add');
        setCategoryOpen(true)

    }
    const onFinish = (values) => {
        console.log(values);
        form.resetFields()
        setCategoryOpen(false)

    }
    return (
        <div>
            <Header />
            <MasterScreen
                title='Master Category'
                Data={cat}
                viewTitle='Categories'
                newBtn={addNew}
            />
            <Modal
                title='ADD MENU KITCHEN CATEGORY'
                open={categoryOpen}
                onCancel={() => setCategoryOpen(false)}
                maskClosable={false}
                okText='Save'
                onOk={() => form.submit()}
                centered
            >
                <Form
                    form={form}
                    layout='vertical'
                    onFinish={onFinish}
                    scrollToFirstError={{ block: "center", behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Enter Category Name'
                        name='categoryName'
                        rules={[{ required: true, message: 'category name is compulsory ' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Display Index'
                        name='dispIndex'
                        rules={[{ required: true, message: 'Display index  is compulsory ' }]}>
                        <Input />
                    </Form.Item>

                </Form>

            </Modal>
            
        </div>
    )
}

export default Category
