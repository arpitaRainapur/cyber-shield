# CyberShield — Smart Digital Safety Assistant for Senior Citizens

CyberShield is a multilingual, voice-guided digital safety platform designed to help senior citizens recognize online financial scams, practice safe decision-making in a zero-risk simulator, analyze suspicious messages or links safely, and share learning progress with family caregivers only through explicit consent.

---

## Project Folder Structure

```text
CyberShield/
├── src/                        # React + Tailwind CSS Frontend
│   ├── assets/images/          # Generated safety & tutorial illustrations
│   ├── components/             # Navbar, SafeImage
│   ├── i18n/                   # English, Hindi, Marathi translations
│   ├── pages/                  # Home, Auth, Tutorials, Simulator, ScamChecker, Emergency, Caregiver
│   ├── services/               # REST API client & Web Speech TTS/STT service
│   ├── App.tsx                 # Main application shell
│   ├── main.tsx                # React mount point
│   └── index.css               # Tailwind CSS v4 & senior accessibility styles
├── server/                     # Node.js / Express Full-Stack Runtime (Port 3000)
│   ├── db.ts                   # SQLite relational schema & multilingual seeds
│   ├── scamAnalyzer.ts         # Explainable NLP + static lexical URL baseline
│   ├── scenarios.ts            # 5 multilingual scam simulation scenarios
│   └── security.ts             # Argon2id hashing, AES-256-GCM, HMAC session tokens
├── server.ts                   # Express + Vite server entry point
├── backend/                    # Python Flask + MySQL + Scikit-learn Backend
│   ├── app.py                  # Flask app factory, CORS, Limiter, security headers
│   ├── models.py               # Flask-SQLAlchemy ORM models (8 tables)
│   ├── routes/                 # auth.py, tutorials.py, scam_checker.py, caregiver.py
│   ├── security/               # auth_security.py (Argon2id), encryption.py (AES-GCM), rbac.py
│   ├── services/               # scam_detector.py, train_model.py (TF-IDF + LogisticRegression)
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Flask + MySQL environment template
├── database/
│   └── schema.sql              # MySQL 8.0 database schema (8 tables + indexes)
├── package.json
├── vite.config.ts
└── README.md
```

---

## Option A: Run Immediately in VS Code (Full-Stack React + Express + SQLite)

The fastest way to run and demo the entire application locally in VS Code:

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```
2. **Start the full-stack development server on port 3000**
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in Chrome or Edge (recommended for best Hindi/Marathi Web Speech API voice support).

---

## Option B: Run with Python Flask + MySQL + Scikit-learn Backend (VS Code)

### 1. Set Up MySQL Database
1. Start MySQL 8.0 Server locally.
2. Create the database and all 8 tables:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Create a dedicated least-privilege MySQL application user:
   ```sql
   CREATE USER 'cybershield_app'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
   GRANT SELECT, INSERT, UPDATE, DELETE ON cybershield_db.* TO 'cybershield_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 2. Configure & Start Python Flask Backend
1. Open a terminal in VS Code inside the project root:
   ```bash
   cd backend
   python3 -m venv .venv
   # Windows PowerShell: .venv\Scripts\Activate.ps1
   # macOS / Linux:
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Copy `backend/.env.example` to `backend/.env` and fill in your `SECRET_KEY`, `ENCRYPTION_KEY_BASE64`, and MySQL credentials.
3. Start Flask:
   ```bash
   python app.py
   ```
   Flask listens on `http://127.0.0.1:5000`.

### 3. Train & Evaluate the Scikit-learn Scam Model (Optional)
If a trained model binary (`scam_tfidf_logreg.joblib`) is not present, CyberShield uses a clearly labelled explainable NLP + lexical URL baseline. To train and evaluate the Scikit-learn `TfidfVectorizer + LogisticRegression` classifier on a labelled SMS/phishing CSV dataset (`text,label` columns):

```bash
python backend/services/train_model.py --dataset path/to/labelled_scams.csv
```

The script outputs a real classification report (precision, recall, F1-score) and confusion matrix on a stratified 20% held-out test split before saving `scam_tfidf_logreg.joblib`.

---

## Security Highlights

- **Argon2id Password Hashing**: Both `server/security.ts` and `backend/security/auth_security.py` hash passwords using Argon2id with random salts.
- **Role-Based Access Control (RBAC)**: Senior Citizen and Caregiver roles enforce strict API authorization.
- **Consent-First Caregiver Access**: Caregivers can only view learning progress, quiz scores, and simulation metrics after a Senior Citizen explicitly generates and grants consent, and Seniors can withdraw consent in one click.
- **Zero-Fetch URL Inspection**: The Scam & Link Checker inspects URL syntax lexically as plain text and never visits or fetches submitted links.
- **AES-256-GCM Encryption**: Trusted family emergency reminders are encrypted at rest.
- **Minimal Data Collection**: Scam check history is never stored unless the user explicitly opts in via checkbox; real OTPs, PINs, CVVs, and banking credentials are never requested or stored.

---

## GitHub Setup Commands

```bash
git init
git add .
git commit -m "Initial commit: CyberShield digital safety platform for senior citizens"
git branch -M main
git remote add origin https://github.com/<your-username>/CyberShield.git
git push -u origin main
```
