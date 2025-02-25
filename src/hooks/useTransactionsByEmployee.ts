import { RequestByEmployeeParams, Transaction } from "../utils/types"
import { useCallback, useState } from "react"

import { TransactionsByEmployeeResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<Transaction[] | null>(null)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)

  const fetchById = useCallback(
    async (employeeId: string) => {
      setCurrentEmployeeId(employeeId)

      // Reset transactions when switching employees
      if (currentEmployeeId !== employeeId) {
        setTransactionsByEmployee(null)
      }

      const data = await fetchWithCache<Transaction[], RequestByEmployeeParams>(
        "transactionsByEmployee",
        {
          employeeId,
        }
      )

      setTransactionsByEmployee((previousTransactions) => {
        if (previousTransactions === null) {
          return data
        }

        // If we're fetching for the same employee, we might want to append
        // But the current API doesn't support pagination for employee transactions
        // So we'll just return the new data
        return data
      })
    },
    [fetchWithCache, currentEmployeeId]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null)
    setCurrentEmployeeId(null)
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData }
}
