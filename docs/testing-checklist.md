# Manual testing checklist

Use two distinct email addresses. For the best sync test, use two devices.

- [ ] Launch with valid Firebase environment variables.
- [ ] Register account A.
- [ ] Create a household and confirm the 10 default categories appear.
- [ ] Create a custom category.
- [ ] Add an expense with amount, currency, date, category, note, payer, and payment method.
- [ ] Open the date field, select a day in the in-app calendar, and confirm the chosen date is saved.
- [ ] Add a monthly recurring expense and confirm it appears in “Suscripciones y recurrentes”.
- [ ] Move to the next month and confirm the monthly recurring expense is projected there.
- [ ] Confirm the expense appears in Dashboard and Expenses.
- [ ] Confirm the monthly total, category total, and payer total are correct.
- [ ] Change the monthly filter backward and forward.
- [ ] Select months in the annual color calendar and confirm the monthly summary changes.
- [ ] Confirm heavier-spending months appear redder and lighter months bluer.
- [ ] Confirm the year-to-date category bars include all elapsed months.
- [ ] Enter account A's monthly income and verify income, expenses, and savings.
- [ ] Enter account B's monthly income and verify both people see the shared comparison.
- [ ] Change month and confirm each month stores its own income values.
- [ ] Import `docs/import-template.csv` from Añadir and review every detected row.
- [ ] Confirm expense rows use the selected category and income rows update monthly income.
- [ ] Import the same table again and confirm likely duplicate expenses are unselected.
- [ ] Import an `.xlsx` file with the same headers and confirm it produces the same preview.
- [ ] Import a Spanish `Concepto;Fecha;Importe;Saldo` export and confirm EUR, signs, and dates.
- [ ] Import a Polish mBank export and confirm metadata rows are skipped and PLN is detected.
- [ ] Confirm an mBank file with distorted Polish header characters is still recognized.
- [ ] Change a detected row between Gasto and Ingreso before importing.
- [ ] Cancel an import and confirm no transactions are written.
- [ ] Share the invite code from Settings.
- [ ] Register account B and join the household with the invite code.
- [ ] Verify account B sees account A's existing expense.
- [ ] Add an expense from account B and verify account A receives it after returning to the app.
- [ ] Confirm account A cannot edit account B's expense.
- [ ] Edit account A's own expense.
- [ ] Change the expense date and confirm it moves to the correct monthly view.
- [ ] Delete account A's own expense.
- [ ] Confirm the deleted expense disappears immediately from Dashboard, Expenses, category totals, payer totals, and future recurring projections.
- [ ] Rename a default category and confirm existing expenses keep that category.
- [ ] Edit and delete an unused custom category.
- [ ] Delete a category in use by moving its expenses to “Otros”.
- [ ] Delete a category in use together with all of its expenses.
- [ ] Select a pie-chart category and confirm the total, payer summary, and expense list are filtered.
- [ ] Clear the pie-chart filter and confirm all monthly expenses return.
- [ ] Turn off connectivity and confirm the app shows a sync notice rather than crashing.
- [ ] Restore connectivity and confirm current data refreshes.
- [ ] Log out and log back in; confirm the session and household data load correctly.

Automated tests cover month filtering and summary grouping. Run them with:

```bash
npm test
```

## Offline Mac edition

- [ ] Run `npm run build:offline:mac`.
- [ ] Double-click `start-offline-mac.command`.
- [ ] Confirm the app opens without a login or Firebase warning.
- [ ] Add an income, expense, custom category, and recurring expense.
- [ ] Reload the browser and confirm all local data remains.
- [ ] Disconnect the Mac from the internet and confirm the app still starts and works.
- [ ] Import a CSV and an Excel `.xlsx` file while offline.
- [ ] Add a second local member in Ajustes without creating a login.
- [ ] Add a manual expense paid by the second member.
- [ ] Import a bank table for the second member.
- [ ] Save monthly income for both local members and verify separate savings totals.
- [ ] Rename an existing local member and confirm old expenses show the new name.
- [ ] Create a second household, switch between households, and verify their data is separate.
- [ ] Type `VACIAR`, empty one household, and confirm the other household is unchanged.
- [ ] Open the Terminal-provided LAN address on an iPhone connected to the same Wi-Fi.
- [ ] Add an expense on the iPhone and confirm it appears on the Mac within a few seconds.
- [ ] Open the recent-expense order dialog and test newest, oldest, highest, and lowest.
- [ ] Confirm category colors are saturated and easy to distinguish in forms and charts.
