import { Outlet } from 'react-router'
import MacAdress from './MacAdress'
import Versions from './Versions'

function AppLayout() {
  return (
    <div className="relative min-h-screen">
      <Outlet />
      <div className="absolute bottom-0 left-0 p-2 text-xs hidden">
        <MacAdress />
        <Versions />
      </div>
    </div>
  )
}

export default AppLayout
