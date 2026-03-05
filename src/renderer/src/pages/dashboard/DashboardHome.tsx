import { useEffect, useState } from 'react'
import DashboardContent from './dashboard-content'
// import { useNavigate } from 'react-router'

function DashboardHome() {
  const [session, setSession] = useState<any>()
  // const navigate = useNavigate()
  useEffect(() => {
    window.api.auth.getSession().then((res) => {
      // console.log('Get Session', res)
      if (res.success) {
        setSession(res)
      }
    })
  }, [])
  // console.log('Session', session)
  return (
    <div>
      <div><DashboardContent /></div>
    </div>
  )
}

export default DashboardHome
