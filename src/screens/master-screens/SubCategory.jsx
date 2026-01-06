import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'

const SubCategory = () => {
    const [subcategoryOpen, setSubCategoryOpen] = useState(false)
    const [form] = Form.useForm()
    const subCat = [
        {
            id: 1,
            name: 'panipuri'
        }
    ]
    const addNew = () => {
        setSubCategoryOpen(true)
    }
    function onFinish(values) {
        console.log(values);
        form.resetFields()
        setSubCategoryOpen(false)

    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Sub Category'
                Data={subCat}
                newBtn={addNew}
            />
            <Modal
                title='ADD MENU SUB CATEGORY'
                open={subcategoryOpen}
                onCancel={() => setSubCategoryOpen(false)}
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
                        label='Enter Sub Category Name'
                        name='subCategoryName'
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
        </>
    )
}
export default SubCategory