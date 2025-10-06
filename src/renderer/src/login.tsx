import React, { useState } from 'react'
import type { FormProps } from 'antd'
import { Button, Checkbox, Form, Input } from 'antd'
import { useNavigate } from 'react-router'
import Alert from 'antd/es/alert/Alert'

type FieldType = {
  username?: string
  password?: string
  remember?: string
}

const LoginForm: React.FC = () => {
  const [errorInfo, setErrorInfo] = useState<string>()

  const navigate = useNavigate()
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const res: any = await window.api.auth.login(values)
    console.log('res', res)
    if (res.success) {
      navigate('/dashboard')
      setErrorInfo(undefined)
    } else {
      setErrorInfo(res.error)
    }
  }
  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = () => {
    setErrorInfo('Failed to login')
  }

  return (
    <div>
      {errorInfo && <Alert message="Login failed" type="error" />}

      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
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
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default LoginForm
