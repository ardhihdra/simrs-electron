import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { rpc } from '@renderer/utils/client'
import slide1Url from '@renderer/assets/image/Slide1.jpeg'
import slide2Url from '@renderer/assets/image/Slide2.jpeg'
import slide3Url from '@renderer/assets/image/Slide3.jpeg'
import logoUrl from '@renderer/assets/logo.png'
import { useProfileStore } from '@renderer/store/profileStore'
import type { FormProps } from 'antd'
import { Button, Carousel, Checkbox, Form, Input } from 'antd'
import Alert from 'antd/es/alert/Alert'
import React, { useState } from 'react'
import { useNavigate } from 'react-router'

type FieldType = {
  username: string
  password: string
  remember?: boolean
}

type LoginResult = {
  success: boolean
  token?: string
  user?: { id: number; username: string; hakAksesId: string }
  error?: string
}

const dummyUsers = [
  {
    username: 'admin1',
    password: 'admin123'
  },
  {
    username: 'registration.poli.umum',
    password: 'registration123'
  },
  {
    username: 'nurse.poli.umum',
    password: 'nurse123'
  },
  {
    username: 'doctor.poli.umum',
    password: 'doctor123'
  },
  {
    username: 'lab.admin',
    password: 'lab123'
  },
  {
    username: 'rad.admin',
    password: 'rad123'
  },
  {
    username: 'kasir.admin',
    password: 'kasir123'
  },
  {
    username: 'ok.admin',
    password: 'ok123'
  },
  {
    username: 'farmasi.admin',
    password: 'pharmacist123'
  }
]

const LoginForm: React.FC = () => {
  const IS_DEVELOPMENT = window.env.NODE_ENV !== 'production'
  console.log('is dev', IS_DEVELOPMENT)
  const [errorInfo, setErrorInfo] = useState<string>()
  const navigate = useNavigate()
  const setProfile = useProfileStore((state) => state.setProfile)
  const form = Form.useForm<FieldType>()[0]
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const res = (await window.api.auth.login({
      username: values.username,
      password: values.password
    })) as LoginResult
    if (res.success && res.user) {
      setProfile(res.user)
      navigate('/module-selection')
      setErrorInfo(undefined)
    } else {
      setErrorInfo(res.error ?? 'Gagal login')
    }
  }
  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = () => {
    setErrorInfo('Failed to login')
  }

  return (
    <div className="relative h-screen overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-cyan-100 px-6 py-10 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="max-w-5xl w-full mx-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 border border-white/10 backdrop-blur rounded-2xl shadow-lg overflow-hidden h-full bg-white">
          <div className="p-8 h-full flex flex-col justify-center">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-xl items-center justify-center mb-3 overflow-hidden mx-auto">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-semibold">Login to your account!</h2>
              <p className="text-gray-500">Enter your registered Username and password to login!</p>
            </div>

            {IS_DEVELOPMENT && (
              <div className="max-h-36 overflow-auto mb-4 border-2 border-dashed border-yellow-300 rounded p-2">
                <div className="mb-1">Dev only:</div>
                {dummyUsers.map((user) => (
                  <Button
                    key={user.username}
                    color="blue"
                    className="mb-1"
                    onClick={() => {
                      // setProfile({ id: 1, username: user.username, hakAksesId: 'ADMIN' })
                      form.setFieldsValue({ username: user.username, password: user.password })
                    }}
                  >
                    {user.username} / {user.password}
                  </Button>
                ))}
              </div>
            )}

            <Form
              layout="vertical"
              form={form}
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item<FieldType>
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input
                  size="large"
                  placeholder="eg. admin1"
                  prefix={<UserOutlined className="text-gray-400 px-1" />}
                />
              </Form.Item>

              <Form.Item<FieldType>
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  size="large"
                  placeholder="************"
                  prefix={<LockOutlined className="text-gray-400 px-1" />}
                />
              </Form.Item>

              <div className="flex items-center justify-between">
                <Form.Item<FieldType> name="remember" valuePropName="checked" className="mb-0">
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => setErrorInfo('Silakan hubungi admin untuk reset password')}
                >
                  Forgot Password ?
                </button>
              </div>

              <Form.Item className="mt-4">
                <Button type="primary" htmlType="submit" size="large" className="w-full">
                  Login
                </Button>
              </Form.Item>
            </Form>
            <Button
              size="large"
              className="w-full"
              onClick={() => rpc.window.create({ route: '/kioska/setup', title: 'Kioska Publik' })}
            >
              Buka Kioska Publik
            </Button>
            {errorInfo && <Alert message={errorInfo} type="error" className="mb-4" />}
          </div>

          <div className="p-8 bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center h-full">
            <div className="w-full max-w-xl h-full">
              <Carousel autoplay dots className="rounded-xl overflow-hidden h-full">
                <div>
                  <img src={slide1Url} alt="Slide 1" className="w-full h-full object-contain" />
                </div>
                <div>
                  <img src={slide2Url} alt="Slide 2" className="w-full h-full object-contain" />
                </div>
                <div>
                  <img src={slide3Url} alt="Slide 3" className="w-full h-full object-contain" />
                </div>
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
