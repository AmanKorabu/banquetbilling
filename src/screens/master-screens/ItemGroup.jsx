import React, { useEffect, useState } from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'
import { Form, Input, message, Modal, Radio } from 'antd'
import axios from 'axios'


const ItemGroup = () => {

    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [itemList, setItemList] = useState([]);
    const [loading, setLoading] = useState(false)
    const ItemData = async () => {
        try {
            setLoading(true)
            const respsone = await axios.get(`/banquetapi/get_all_item_grp.php?hotelid=290`)
            console.log(respsone.data.result);
            const formattedData = respsone.data.result.map((item) => ({
                id: item.GroupID,
                name: item.GroupName
            }))
            setItemList(formattedData)
            console.log('formattteddddd',formattedData);
            

        } catch (error) {
            message.error("cant't able to load item group SERVER DOWN!", error)
        }
        finally{
            setLoading(false)
        }
    }
    useEffect(() => {
        ItemData()
    }, [])
    const Data = (values) => {
        console.log(values);
        form.resetFields()
        setOpen(false)

    }
    return (
        <>
            <Header />
            <MasterScreen
                title='Item Group'
                Data={itemList}
                newBtn={() => setOpen(true)}
                loading={loading}
            />
            <Modal
                title='Add Item Group'
                open={open}
                onCancel={() => setOpen(false)}
                maskClosable={false}
                okText='Save'
                width={400}
                onOk={() => form.submit()}
                centered

            >

                <Form
                    form={form}
                    layout='vertical'
                    onFinish={Data}
                    scrollToFirstError={{ block: 'center', behavior: 'smooth' }}
                >
                    <Form.Item
                        label='Item Group Name'
                        name='Item_Group_Name'
                        rules={[{ required: true, message: 'Item Group name is required' }]}>
                        <Input />


                    </Form.Item>
                    <Form.Item
                        name='group_name'>
                        <Radio.Group>
                            <Radio value='F&B'>F&B</Radio>
                            <Radio value='Non_F&B'>Non F&B</Radio>
                            <Radio value='other'>Other</Radio>
                        </Radio.Group>
                    </Form.Item>

                </Form>
            </Modal>
        </>
    )
}

export default ItemGroup
