import { Outlet } from 'react-router'

function Encounter() {
  return (
    <div className="pt-6 md:pt-8 pl-4 md:pl-6">
      <Outlet />
    </div>
  )
}

export default Encounter

