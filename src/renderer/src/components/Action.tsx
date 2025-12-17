import { queryClient } from '@renderer/query-client'
import { useMutation } from '@tanstack/react-query'
import { Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

type ExpenseRecord = { id: number }
type ActionProps = { record: ExpenseRecord }

function Action({ record }: ActionProps) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['expense', 'delete'],
    mutationFn: (id: number) => window.api.query.expense.deleteById({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', 'list'] })
      message.success('Expense deleted successfully')
    }
  })

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          // Belum ada halaman edit khusus expense; arahkan ke create sebagai placeholder
          navigate('/dashboard/expense/create')
        }
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => deleteMutation.mutate(record.id)
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export default Action
