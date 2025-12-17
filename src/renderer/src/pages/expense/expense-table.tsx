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
    render: (_: any, record: any) => <Action record={record} />
  }
]

export function ExpenseTable() {
  const navigate = useNavigate()
  const { data, refetch, isError } = useQuery({
    queryKey: ['expense', 'list'],
    queryFn: () => window.api.query.expense.list()
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Search" className="w-full md:max-w-sm" />
        <div className="flex gap-2 flex-wrap md:justify-end">
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
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <Table
        dataSource={data?.data || []}
        columns={expenseColumns}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default ExpenseTable
