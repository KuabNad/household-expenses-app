# Manual testing checklist

Use two distinct email addresses. For the best sync test, use two devices.

- [ ] Launch with valid Firebase environment variables.
- [ ] Register account A.
- [ ] Create a household and confirm the 10 default categories appear.
- [ ] Create a custom category.
- [ ] Add an expense with amount, currency, date, category, note, payer, and payment method.
- [ ] Confirm the expense appears in Dashboard and Expenses.
- [ ] Confirm the monthly total, category total, and payer total are correct.
- [ ] Change the monthly filter backward and forward.
- [ ] Share the invite code from Settings.
- [ ] Register account B and join the household with the invite code.
- [ ] Verify account B sees account A's existing expense.
- [ ] Add an expense from account B and verify account A receives it after returning to the app.
- [ ] Confirm account A cannot edit account B's expense.
- [ ] Edit account A's own expense.
- [ ] Delete account A's own expense.
- [ ] Edit and delete an unused custom category.
- [ ] Confirm a custom category in use cannot be deleted.
- [ ] Turn off connectivity and confirm the app shows a sync notice rather than crashing.
- [ ] Restore connectivity and confirm current data refreshes.
- [ ] Log out and log back in; confirm the session and household data load correctly.

Automated tests cover month filtering and summary grouping. Run them with:

```bash
npm test
```
