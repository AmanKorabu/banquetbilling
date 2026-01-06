import React from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'

const ItemPackageMaster = () => {
    const Data = [{
        id: 1,
        name: 'Rooms',
        rate: `2000.00`
    }]
    return (
        <>
            <Header />
            <MasterScreen
                title='Item Package Master'
                Data={Data}
                extrafields={'Rate'} />
        </>
    )
}

export default ItemPackageMaster
