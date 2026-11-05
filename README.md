# Solana Made Simple (SMSai)

An AI-powered educational app that helps users understand the Solana ecosystem.

Topics include:
- Wallets and seed phrases
- DeFi and staking
- Memecoins
- RWAs (Real World Assets)

Built with:
- Vite
- React
- Tailwind CSS

Created by Solana Made Simple.

## Phase 1 notes

SMSai keeps the existing visit counter. `/api/visits` still reads and increments `stats.visit_count`. Nothing in this version resets, deletes, or re-seeds that counter. The count stays on the left of the header.

XP is counted on the server. The first signed-in wallet gets 20 XP. Each question asked with a valid sign-in gets 5 XP. The browser cannot set those numbers. Profile create and update require a wallet signature first. That sign-in returns a session, and profile saves send that session.

### One-time leaderboard reset at launch

This reset is off by default. Do not run it against production until launch, and do not run it from a preview if preview uses the same database. It was not run while this change was built.

It sets `users.xp` and `users.total_questions` to 0. It does not read or write the visits counter. A successful run records `phase1-xp` in `launch_resets`, so a second call will not zero the board again.

1. In the Vercel project, set these for the launch environment only:
   - `LEADERBOARD_LAUNCH_RESET` = `confirm`
   - `LEADERBOARD_LAUNCH_RESET_SECRET` = a long random string
2. Deploy this version.
3. Run this once. Replace the host if you are not resetting production.

```bash
curl -sS -X POST "https://www.smsai.fun/api/launch-reset" \
  -H "Content-Type: application/json" \
  -H "X-Launch-Reset-Secret: $LEADERBOARD_LAUNCH_RESET_SECRET" \
  -d '{"confirm":"ZERO_LEADERBOARD_KEEP_VISITS"}'
```

4. Check the JSON. `reset` should be true, and `visits_untouched` should be true. Then load `/api/visits` and confirm the visit count did not change.
5. Remove `LEADERBOARD_LAUNCH_RESET` or set it to anything other than `confirm`.

If the flag is missing, the route returns 404 and does not touch the database. If the reset already ran, the route returns 409 and does not zero scores again. There is no reset button in the app.

### Get Help

Set `DISCORD_TICKET_WEBHOOK` to a Discord webhook URL when the Discord side is ready. Until then, the form tells people help is not connected and does not send the note. The form asks for a topic and a description. A Discord username is optional so a reply has somewhere to go. It does not ask for a seed phrase, private key, or password.
