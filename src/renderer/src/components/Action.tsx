import { queryClient } from '@renderer/query-client'
import { useMutation } from '@tanstack/react-query'
import { Button, message } from 'antd'

function Action({ record }: any) {
  const deleteMutation = useMutation({
    mutationKey: ['expense', 'delete'],
    mutationFn: (id: number) => window.api.query.expense.deleteById({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', 'list'] })
      message.success('Expense deleted successfully')
    }
  })
  return (
    <div className="flex gap-2">
      <Button size="small" onClick={() => console.log('Edit', record)}>
        Edit
      </Button>
      <Button size="small" onClick={() => deleteMutation.mutate(record.id)}>
        Delete
      </Button>
    </div>
  )
}

export default Action
