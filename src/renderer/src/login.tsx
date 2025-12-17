import React, { useState } from 'react'
import type { FormProps } from 'antd'
import { Button, Checkbox, Form, Input, Carousel } from 'antd'
import { useNavigate } from 'react-router'
import Alert from 'antd/es/alert/Alert'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import slide1Url from '@renderer/assets/image/Slide1.jpeg'
import slide2Url from '@renderer/assets/image/Slide2.jpeg'
import slide3Url from '@renderer/assets/image/Slide3.jpeg'

type FieldType = {
  username: string
  password: string
  remember?: boolean
}

type LoginResult = {
  success: boolean
  token?: string
  user?: { id: number; username: string }
  error?: string
}

const LoginForm: React.FC = () => {
  const [errorInfo, setErrorInfo] = useState<string>()
  const navigate = useNavigate()
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const res = (await window.api.auth.login({ username: values.username, password: values.password })) as LoginResult
    if (res.success) {
      navigate('/dashboard')
      setErrorInfo(undefined)
    } else {
      setErrorInfo(res.error ?? 'Gagal login')
    }
  }
  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = () => {
    setErrorInfo('Failed to login')
  }

  return (
    <div className="w-full">
      {errorInfo && <Alert message={errorInfo} type="error" className="mb-4" />}

      <div className="max-w-5xl w-full mx-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white/80 backdrop-blur rounded-2xl shadow-lg overflow-hidden h-full">
          <div className="p-8 h-full flex flex-col justify-center">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-xl items-center justify-center mb-3 overflow-hidden mx-auto">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-semibold">Login to your account!</h2>
              <p className="text-gray-500">Enter your registered NIK and password to login!</p>
            </div>

            <Form
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item<FieldType>
                label="NIK"
                name="username"
                rules={[{ required: true, message: 'Please input your NIK!' }]}
              >
                <Input size="large" placeholder="eg. 3212010101010001" prefix={<UserOutlined className="text-gray-400 px-1" />} />
              </Form.Item>

              <Form.Item<FieldType>
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password size="large" placeholder="************" prefix={<LockOutlined className="text-gray-400 px-1" />} />
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
          </div>

          <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center h-full">
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
