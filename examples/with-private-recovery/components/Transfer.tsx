import { Formik, Form, Field, FormikHelpers } from 'formik'
import cx from 'clsx'
import { Currency } from '@/lib/type'

export type FormValues = {
  target: string
  amount: string
  currency: Currency
}

const initialFormValues: FormValues = {
  target: '',
  amount: '0',
  currency: Currency.ether
}

export type TransferProps = {
  handleTransfer: (
    values: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => void | Promise<any>
}

export const Transfer = ({ handleTransfer }: TransferProps) => {
  return (
    <Formik<FormValues> initialValues={initialFormValues} onSubmit={handleTransfer}>
      {({
        values,
        errors,
        touched,
        isSubmitting,
        isValid
        /* and other goodies */
      }) => (
        <div>
          <Form className="mt-2 pb-2">
            <div className="flex items-end">
              <div className="flex flex-wrap items-center gap-2 w-full sm:max-w-4xl">
                <label htmlFor="addressOrName" className="text-base font-semibold text-slate-800">
                  Transfer to
                </label>
                <div className="relative">
                  <Field
                    as="input"
                    type="text"
                    name="target"
                    id="target"
                    className={cx(
                      'block rounded-md sm:text-sm w-auto',
                      errors.target
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500'
                        : 'border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                    )}
                    placeholder="0x..."
                  />
                  <div className="absolute top-11 left-1 text-sm text-red-600">
                    <p>{errors.target && touched.target && errors.target}</p>
                  </div>
                </div>

                <label htmlFor="amount" className="text-base font-semibold text-slate-800">
                  with
                </label>
                <div className="relative rounded-md shadow-sm">
                  <Field
                    as="input"
                    type="text"
                    name="amount"
                    id="amount"
                    className={cx(
                      'block rounded-md sm:text-sm w-auto',
                      errors.amount
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500'
                        : 'border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                    )}
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <label htmlFor="currency" className="sr-only">
                      Currency
                    </label>
                    <Field
                      id="currency"
                      name="currency"
                      as="select"
                      className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 sm:text-sm"
                    >
                      <option value={Currency.ether}>Ethers</option>
                      <option value={Currency.weth}>WETH</option>
                      <option value={Currency.usdt}>USDT</option>
                      <option value={Currency.token}>TOKEN</option>
                    </Field>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !values.target}
                  className={cx(
                    'capitalize inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 disabled:bg-gray-500 px-2 py-2 text-sm',
                    'font-medium leading-4 text-white shadow-sm',
                    'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'sm:ml-1 sm:w-auto sm:text-sm'
                  )}
                >
                  transfer
                </button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </Formik>
  )
}
