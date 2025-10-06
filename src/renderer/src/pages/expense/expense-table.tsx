import Action from '@renderer/components/Action'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Table } from 'antd'
import { useNavigate } from 'react-router'

const expenseColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Expense Head',
    dataIndex: ['expenseHead', 'name'], // relasi ke ExpenseHead
    key: 'expenseHead'
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (value: string) => new Date(value).toLocaleDateString()
  },
  {
    title: 'Invoice Number',
    dataIndex: 'invoiceNumber',
    key: 'invoiceNumber'
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (value: string) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(Number(value))
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true // potong jika terlalu panjang
  },
  {
    title: 'Action',
    key: 'action',
    render: (_: any, record: any) => <Action data={_} record={record} model="expense" />
  }
]

export function ExpenseTable() {
  const navigate = useNavigate()
  const { data, refetch } = useQuery({
    queryKey: ['expense', 'list'],
    queryFn: () => window.api.query.expense.list()
  })

  return (
    <div>
      <div className="flex justify-between items-center">
        <Input type="text" placeholder="Search" className="max-w-sm" />
        <div className="flex gap-4">
          <Button onClick={() => window.api.query.expense.seed().then(() => refetch())}>
            Seed
          </Button>
          <Button
            onClick={async () => {
              const data = await window.api.query.expenseHead.seed()
              console.log(data)
            }}
          >
            Seed Expense Heads
          </Button>
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/expense/create')}>
            Create New
          </Button>
        </div>
      </div>
      <Table
        dataSource={data?.success ? data?.data || [] : []}
        columns={expenseColumns}
        size="small"
        className="mt-4"
      />
    </div>
  )
}

export default ExpenseTable
