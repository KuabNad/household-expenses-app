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
