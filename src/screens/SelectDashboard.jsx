import DemoBillList from './DemoBillList'
import EscapeNavigate from '../hooks/EscapeNavigate'



function SelectDashboard() {
    EscapeNavigate('/dashboard')
    
    return (
        <>
            <DemoBillList />
        </>
    )
}

export default SelectDashboard
