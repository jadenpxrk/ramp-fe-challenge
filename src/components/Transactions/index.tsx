import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { useCallback } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"

export const Transactions: TransactionsComponent = ({ transactions, onTransactionApprovalChange }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })

      if (onTransactionApprovalChange) {
        await onTransactionApprovalChange()
      }
    },
    [fetchWithoutCache, onTransactionApprovalChange]
  )

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
