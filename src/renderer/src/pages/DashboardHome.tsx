import { Button } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
// import { useNavigate } from 'react-router'

function DashboardHome() {
  const [session, setSession] = useState<
    { success: boolean; user?: { username: string } } | undefined
  >()
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
      <div className="flex justify-center items-center gap-4">
        <Button
          onClick={async () => {
            console.log('List Protected Users', window.api)
            const users = await window.api.user.list()
            console.log(users)
          }}
        >
          List Protected Users
        </Button>
        <Link to="/dashboard/registration/pre-reserved">
          <Button type="primary">Konfirmasi Antrian (Pre-Reserved)</Button>
        </Link>
      </div>
      {session ? <div>Welcome, {session?.user?.username}</div> : <div>Not Authenticated</div>}
      <Link to="/">Login </Link>
      <Button
        onClick={async () => {
          await window.api.auth.logout()
          setSession(undefined)
          // navigate('/')
        }}
      >
        Logout
      </Button>
    </div>
  )
}

export default DashboardHome
