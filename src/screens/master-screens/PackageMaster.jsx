import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, Modal } from 'antd'
import { FaArrowCircleRight } from "react-icons/fa";
const PackageMaster = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const Data = [
        {
            id: 1,
            name: 'Package Rs.900',
            rate: `900.00`
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
                title='Package Master'
                Data={Data}
                extrafields={'Rate'}
                newBtn={addNew} />
            <Modal
                title={<h2>ADD PACKAGE</h2>}
                open={open}
                okText='Save'
                onCancel={() => setOpen(false)}
                centered
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
                        label='Enter Package Name'
                        name='packageName'
                        rules={[{ required: true, message: 'Package Name is compulsory' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='Enter Rate'
                        name='rate'
                        rules={[{ required: true, message: 'Rate is compulsory' }]}
                    >
                        <input type='number' />
                    </Form.Item>
                    <Form.Item
                        label='Note'
                        name='note'
                    >
                        <Input />
                    </Form.Item>
                    <label>Category</label>
                    <br />
                    <div style={{ border: "1px solid black", borderRadius: '5px', padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                        <span>Select Categort</span>
                        <FaArrowCircleRight size={30} color='#2e76f3' style={{ cursor: 'pointer' }} />
                    </div>
                </Form>

            </Modal>

        </>
    )
}

export default PackageMaster
