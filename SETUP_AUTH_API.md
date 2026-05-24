# REST API, βάση δεδομένων και login

## 1. Δημιούργησε το τοπικό `.env`

Αντέγραψε το `.env.example` σε `.env` και άλλαξε τις τιμές:

```txt
API_PORT=4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
SESSION_SECRET=βάλε-ένα-τυχαίο-secret-τουλάχιστον-32-χαρακτήρων
SESSION_COOKIE_NAME=ship_session
ADMIN_EMAIL=το-email-σου
ADMIN_PASSWORD=ένας-δυνατός-κωδικός
```

Το `.env` δεν ανεβαίνει στο GitHub, επειδή το `.gitignore` αγνοεί τα τοπικά env files.
Το `.env.example` εξαιρείται από το ignore, μένει στο repo μόνο ως οδηγός και δεν περιέχει πραγματικά μυστικά.

Για να φτιάξεις secret μπορείς να τρέξεις:

```bash
node -e "console.log(crypto.randomBytes(32).toString('base64url'))"
```

## 2. Ξεκίνα το API

Σε ένα terminal:

```bash
npm run dev:api
```

Το API δημιουργεί αυτόματα SQLite database στο `server/data/ship-map.sqlite`,
φορτώνει τα υπάρχοντα ships από `src/data/ships.json`, και δημιουργεί admin χρήστη
με τα `ADMIN_EMAIL` και `ADMIN_PASSWORD`.

## 3. Ξεκίνα το Next.js app

Σε δεύτερο terminal:

```bash
npm run dev
```

Άνοιξε `http://localhost:3000/login` και κάνε login με τα admin στοιχεία σου.

## Τι άλλαξε

- Το Express API δίνει REST endpoints: `/api/auth/login`, `/api/auth/me`, `/api/ships`, `/api/ships/:id`.
- Το Next app αποθηκεύει το session σε `httpOnly` cookie μέσω `/api/auth/login`.
- Οι σελίδες `/`, `/map`, `/dashboard`, `/3d` και `/ships/...` προστατεύονται από `src/proxy.ts`.
- Τα δεδομένα ships έρχονται δυναμικά από το API και όχι απευθείας από το JSON στο frontend.
