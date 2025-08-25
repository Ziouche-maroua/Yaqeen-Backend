# Yaqeen – Backend

**Yaqeen (يقين)** is the backend service for a humanitarian digital platform that connects donors directly with Palestinian families affected by war.  
The backend powers secure APIs, data management, and statistics to ensure transparency, trust, and real impact.

---

##  Project Vision
- Provide a **trusted bridge** between families in need and donors worldwide.  
- Ensure **transparency** through verified requests and updates.  
- Transform **humanitarian support** into measurable data and lasting impact.  

---

##  Features
- **Family Requests**: families submit their needs with documents, photos, and updates.  
- **Donor Access**: donors browse verified requests and support families directly.  
- **Analytics & Dashboards**: live statistics about needs, locations, and support progress.  
- **Security & Trust**: strict verification, data protection, and transparent processes.  

---

##  Tech Overview
- **Node.js + Express** for the backend API  
- **PostgreSQL** as the database  
- Basic **authentication and security** measures applied  

*(No direct money handling: the platform connects donors to families via trusted external links.)*

---

##  Getting Started
1. Clone the repository.  
2. Set up your environment variables (see `.env.example`).  
3. Install dependencies.  
4. Run the server locally.  

---

## 📊 Example API Endpoints
- `POST /api/auth/register` → Register a new user (family or donor)  
- `POST /api/auth/login` → Login and receive access  
- `GET /api/families` → View verified family requests  
- `POST /api/families` → Submit a new family request  
- `GET /api/stats` → View overall statistics  

---

> **Yaqeen** is not just a platform, it is a humanitarian mission:  
> turning suffering into data, and data into lasting support.
