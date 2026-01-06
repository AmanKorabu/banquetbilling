import React, { useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Col, Form, Input, Modal, Row, TimePicker } from 'antd'
const EventMaster = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm()
    const demoD = [
        {
            id: 1,
            name: 'Meeting'
        },
        {
            id: 2,
            name: 'Mini Party'
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
                title='Event Master'
                Data={demoD}
                newBtn={addNew} />
            <Modal
                title='ADD EVENT'
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
                >
                    <Form.Item
                        label='Enter Event'
                        name='eventName'
                        rules={[{ required: true, message: 'Enter Event Name' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Row gutter={8} >
                        <Col span={8}>
                            <Form.Item
                                name='fromTime'
                                label='From Time:'>
                                <TimePicker format='hh:mm A' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='toTime'
                                label='To Time:'>
                                <TimePicker format='HH:mm A' />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

            </Modal>

        </>
    )
}

export default EventMaster
