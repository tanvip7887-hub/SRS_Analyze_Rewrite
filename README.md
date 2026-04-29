# Reqify 🚀

**Reqify** is an AI-powered platform designed to automate the analysis and refinement of Software Requirement Specifications (SRS). It helps software teams detect duplicates, identify ambiguities, and rewrite requirements for clarity using state-of-the-art NLP models.

## ✨ Key Features

- **Duplicate Detection**: Uses `all-mpnet-base-v2` transformer embeddings to find semantically similar requirements at a 0.85+ threshold.
- **Ambiguity Detection**: Hybrid logic combining a custom SVM model (0.80+ confidence) and rule-based linguistic analysis to flag vague requirements.
- **AI-Powered Rewriting**: Instantly transform messy requirements into atomic, testable, and IEEE 830-compliant "The system SHALL" statements.
- **Conflict Analysis**: Highlight cross-requirement inconsistencies before they reach development.

## 🛠️ Technology Stack

- **Frontend**: React.js, Framer Motion (Animations), Tailwind CSS/Vanilla CSS.
- **Backend**: FastAPI (Python), Sentence Transformers, Scikit-learn, spaCy NLP.
- **Database/Auth**: Supabase.
- **Logic**: Custom ML pipeline for requirement classification and semantic search.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/Reqify.git
   cd Reqify
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📄 License
This project is for academic/research purposes. See individual files for licensing details.
