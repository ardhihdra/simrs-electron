import { useQuery } from '@tanstack/react-query'

function MacAdress(): React.JSX.Element {
  const macAdress = useQuery({
    queryKey: ['mac'],
    queryFn: () => window.api.macaddress.getPrimaryMacAddress()
  })

  return <div>Primary MAC Address: {macAdress.data?.data || '-'}</div>
}

export default MacAdress
