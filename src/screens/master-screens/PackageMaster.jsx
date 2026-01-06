import React from 'react'
import Header from '../Header'
import MasterScreen from '../../components/ReusableCompnents/MasterScreen'

const PackageMaster = () => {
    const Data = [
        {
            id: 1,
            name: 'Package Rs.900',
            rate: `900.00`
        }
    ]
    return (
        <>
            <Header />
            <MasterScreen
                title='Package Master'
                Data={Data}
                extrafields={'Rate'} />

        </>
    )
}

export default PackageMaster
