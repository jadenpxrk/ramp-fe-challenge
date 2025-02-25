import { Fragment, useCallback, useEffect, useMemo, useState } from "react"

import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)

    try {
      if (employees === null) {
        await employeeUtils.fetchAll()
      }

      if (selectedEmployeeId) {
        await transactionsByEmployeeUtils.fetchById(selectedEmployeeId)
      } else {
        await paginatedTransactionsUtils.fetchAll()
      }
    } catch (error) {
      console.error("Error loading all transactions:", error)
      // if error go to safe state
      transactionsByEmployeeUtils.invalidateData()
      paginatedTransactionsUtils.invalidateData()
      await paginatedTransactionsUtils.fetchAll()
    } finally {
      setIsLoading(false)
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils, selectedEmployeeId])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setSelectedEmployeeId(employeeId)
      paginatedTransactionsUtils.invalidateData()

      try {
        if (employeeId === EMPTY_EMPLOYEE.id) {
          // all
          setSelectedEmployeeId("")
          transactionsByEmployeeUtils.invalidateData()
          await paginatedTransactionsUtils.fetchAll()
        } else {
          await transactionsByEmployeeUtils.fetchById(employeeId)
        }
      } catch (error) {
        console.error("Error loading transactions:", error)
        // if error go to safe state
        setSelectedEmployeeId("")
        paginatedTransactionsUtils.invalidateData()
        transactionsByEmployeeUtils.invalidateData()
        await paginatedTransactionsUtils.fetchAll()
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const refreshTransactions = useCallback(async () => {
    try {
      if (selectedEmployeeId) {
        // refresh only that person
        await transactionsByEmployeeUtils.fetchById(selectedEmployeeId)
      } else {
        // refresh all
        paginatedTransactionsUtils.invalidateData()
        await paginatedTransactionsUtils.fetchAll()
      }
    } catch (error) {
      console.error("Error refreshing transactions:", error)
      // if error go to safe state
      paginatedTransactionsUtils.invalidateData()
      transactionsByEmployeeUtils.invalidateData()
      await paginatedTransactionsUtils.fetchAll()
    }
  }, [selectedEmployeeId, transactionsByEmployeeUtils, paginatedTransactionsUtils])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} onTransactionApprovalChange={refreshTransactions} />

          {transactions !== null &&
            ((paginatedTransactions?.nextPage !== null && !selectedEmployeeId) ||
              selectedEmployeeId === "") && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions()
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}
